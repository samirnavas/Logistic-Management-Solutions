const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================
// Saved Address Sub-Schema (Embedded Document)
// ============================================
const savedAddressSchema = new mongoose.Schema({
    label: {
        type: String,
        required: [true, 'Address label is required'],
        trim: true,
        maxlength: [50, 'Label cannot exceed 50 characters'],
        default: 'Default',
    },
    addressLine: {
        type: String,
        required: [true, 'Address line is required'],
        trim: true,
        maxlength: [200, 'Address line cannot exceed 200 characters'],
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
    },
    state: {
        type: String,
        trim: true,
        default: '',
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
    },
    zipCode: {
        type: String,
        required: [true, 'ZIP/Postal code is required'],
        trim: true,
    },
    contactName: {
        type: String,
        trim: true,
        default: '',
    },
    contactPhone: {
        type: String,
        trim: true,
        default: '',
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        enum: ['pickup', 'delivery', 'both'],
        default: 'both',
    },
}); // Keep _id for individual address management

// ============================================
// User Schema
// ============================================
const userSchema = new mongoose.Schema({
    // --- Core Identity ---
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Full name must be at least 2 characters'],
        maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address',
        ],
        index: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Exclude from queries by default
    },
    phone: {
        type: String,
        trim: true,
        default: '',
    },
    avatarUrl: {
        type: String,
        trim: true,
        default: '',
    },

    // --- Role Management ---
    role: {
        type: String,
        enum: {
            values: ['client', 'manager', 'admin'],
            message: 'Role must be either client, manager, or admin',
        },
        default: 'client',
        index: true,
    },

    // --- Logistics Information ---
    customerCode: {
        type: String,
        unique: true,
        sparse: true, // Allows null values while maintaining uniqueness
        trim: true,
        uppercase: true,
        index: true,
    },

    // --- Saved Addresses (Multiple pickup/delivery locations) ---
    savedAddresses: {
        type: [savedAddressSchema],
        default: [],
        validate: {
            validator: function (addresses) {
                // Ensure only one default address
                const defaults = addresses.filter(a => a.isDefault);
                return defaults.length <= 1;
            },
            message: 'Only one address can be set as default',
        },
    },

    // --- Account Status ---
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLoginAt: {
        type: Date,
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },

}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.password; // Never expose password
        }
    },
    toObject: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.password;
        }
    }
});

// ============================================
// Indexes for Performance
// ============================================
// Note: email and customerCode indexes are defined in field definitions
// Only add compound indexes here
userSchema.index({ createdAt: -1 });

// ============================================
// Pre-save Middleware
// ============================================

// Auto-generate customerCode for clients
userSchema.pre('save', async function (next) {
    if (this.isNew && this.role === 'client' && !this.customerCode) {
        this.customerCode = await generateCustomerCode();
    }
    next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ============================================
// Instance Methods
// ============================================

/**
 * Compare password with hashed password
 * @param {string} candidatePassword - The password to compare
 * @returns {Promise<boolean>} - True if password matches
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if user is a manager
 * @returns {boolean}
 */
userSchema.methods.isManager = function () {
    return this.role === 'manager';
};

/**
 * Check if user is an admin
 * @returns {boolean}
 */
userSchema.methods.isAdmin = function () {
    return this.role === 'admin';
};

/**
 * Check if user is a client
 * @returns {boolean}
 */
userSchema.methods.isClient = function () {
    return this.role === 'client';
};

/**
 * Check if user has elevated privileges (manager or admin)
 * @returns {boolean}
 */
userSchema.methods.hasElevatedPrivileges = function () {
    return ['manager', 'admin'].includes(this.role);
};

/**
 * Get user's display name (full name or email prefix)
 * @returns {string}
 */
userSchema.methods.getDisplayName = function () {
    return this.fullName || this.email.split('@')[0];
};

/**
 * Get the default address
 * @returns {Object|null} - Default address or null if none set
 */
userSchema.methods.getDefaultAddress = function () {
    if (!this.savedAddresses || this.savedAddresses.length === 0) {
        return null;
    }
    return this.savedAddresses.find(addr => addr.isDefault) || this.savedAddresses[0];
};

/**
 * Add a new saved address
 * @param {Object} addressData - Address data to add
 * @param {boolean} setAsDefault - Whether to set as default
 * @returns {Promise<User>}
 */
userSchema.methods.addAddress = async function (addressData, setAsDefault = false) {
    // If setting as default, unset other defaults
    if (setAsDefault) {
        this.savedAddresses.forEach(addr => {
            addr.isDefault = false;
        });
        addressData.isDefault = true;
    }

    // If this is the first address, set it as default
    if (this.savedAddresses.length === 0) {
        addressData.isDefault = true;
    }

    this.savedAddresses.push(addressData);
    return this.save();
};

/**
 * Remove a saved address by ID
 * @param {ObjectId} addressId - Address ID to remove
 * @returns {Promise<User>}
 */
userSchema.methods.removeAddress = async function (addressId) {
    const addressIndex = this.savedAddresses.findIndex(
        addr => addr._id.toString() === addressId.toString()
    );

    if (addressIndex === -1) {
        throw new Error('Address not found');
    }

    const wasDefault = this.savedAddresses[addressIndex].isDefault;
    this.savedAddresses.splice(addressIndex, 1);

    // If removed address was default, set first remaining as default
    if (wasDefault && this.savedAddresses.length > 0) {
        this.savedAddresses[0].isDefault = true;
    }

    return this.save();
};

/**
 * Set an address as the default
 * @param {ObjectId} addressId - Address ID to set as default
 * @returns {Promise<User>}
 */
userSchema.methods.setDefaultAddress = async function (addressId) {
    let found = false;

    this.savedAddresses.forEach(addr => {
        if (addr._id.toString() === addressId.toString()) {
            addr.isDefault = true;
            found = true;
        } else {
            addr.isDefault = false;
        }
    });

    if (!found) {
        throw new Error('Address not found');
    }

    return this.save();
};

/**
 * Update a saved address
 * @param {ObjectId} addressId - Address ID to update
 * @param {Object} updateData - Updated address data
 * @returns {Promise<User>}
 */
userSchema.methods.updateAddress = async function (addressId, updateData) {
    const address = this.savedAddresses.find(
        addr => addr._id.toString() === addressId.toString()
    );

    if (!address) {
        throw new Error('Address not found');
    }

    // Update allowed fields
    const allowedFields = ['label', 'addressLine', 'city', 'state', 'country', 'zipCode', 'contactName', 'contactPhone', 'type'];
    allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
            address[field] = updateData[field];
        }
    });

    // Handle isDefault separately to ensure only one default
    if (updateData.isDefault === true) {
        this.savedAddresses.forEach(addr => {
            addr.isDefault = addr._id.toString() === addressId.toString();
        });
    }

    return this.save();
};

// ============================================
// Static Methods
// ============================================

/**
 * Find user by email with password included
 * @param {string} email - User email
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByEmailWithPassword = function (email) {
    return this.findOne({ email: email.toLowerCase() }).select('+password');
};

/**
 * Find user by customer code
 * @param {string} customerCode - Customer code
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByCustomerCode = function (customerCode) {
    return this.findOne({ customerCode: customerCode.toUpperCase() });
};

// ============================================
// Helper Functions
// ============================================

/**
 * Generate unique customer code
 * @returns {Promise<string>} - Generated customer code (e.g., "LMS-A1B2C3")
 */
async function generateCustomerCode() {
    const prefix = 'LMS';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let isUnique = false;

    while (!isUnique) {
        let randomPart = '';
        for (let i = 0; i < 6; i++) {
            randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        code = `${prefix}-${randomPart}`;

        // Check if code already exists
        const existingUser = await mongoose.model('User').findOne({ customerCode: code });
        if (!existingUser) {
            isUnique = true;
        }
    }

    return code;
}

module.exports = mongoose.model('User', userSchema);
