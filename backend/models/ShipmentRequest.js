const mongoose = require('mongoose');

// ============================================
// Pickup Address Sub-Schema (Embedded Document)
// ============================================
const pickupAddressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Contact name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true,
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
    zip: {
        type: String,
        required: [true, 'ZIP/Postal code is required'],
        trim: true,
    },
}, { _id: false });

// ============================================
// Destination Address Sub-Schema
// ============================================
const destinationAddressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Recipient name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
        type: String,
        required: [true, 'Recipient phone is required'],
        trim: true,
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
    zip: {
        type: String,
        required: [true, 'ZIP/Postal code is required'],
        trim: true,
    },
}, { _id: false });

// ============================================
// Shipment Request Schema
// ============================================
const shipmentRequestSchema = new mongoose.Schema({
    // --- Relations ---
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Client ID is required'],
        index: true,
    },

    // --- Request Reference ---
    requestNumber: {
        type: String,
        unique: true,
        index: true,
    },

    // --- Shipping Mode & Delivery Type ---
    mode: {
        type: String,
        enum: {
            values: ['Air', 'Sea'],
            message: 'Mode must be either Air or Sea',
        },
        required: [true, 'Shipping mode is required'],
    },
    deliveryType: {
        type: String,
        enum: {
            values: ['Door to Door', 'Warehouse'],
            message: 'Delivery type must be either Door to Door or Warehouse',
        },
        required: [true, 'Delivery type is required'],
    },

    // --- Package Information ---
    itemName: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
        maxlength: [200, 'Item name cannot exceed 200 characters'],
    },
    itemDescription: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
        default: '',
    },
    boxCount: {
        type: Number,
        required: [true, 'Box count is required'],
        min: [1, 'Box count must be at least 1'],
        validate: {
            validator: Number.isInteger,
            message: 'Box count must be a whole number',
        },
    },
    totalWeight: {
        type: Number,
        min: [0, 'Weight cannot be negative'],
        default: 0,
    },
    weightUnit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg',
    },
    totalCbm: {
        type: Number,
        min: [0, 'CBM cannot be negative'],
        default: 0,
    },
    hsCode: {
        type: String,
        trim: true,
        default: '',
        maxlength: [20, 'HS Code cannot exceed 20 characters'],
    },

    // --- Photo Documentation ---
    photoUrls: [{
        type: String,
        trim: true,
    }],

    // --- Addresses ---
    pickupAddress: {
        type: pickupAddressSchema,
        required: [true, 'Pickup address is required'],
    },
    destinationAddress: {
        type: destinationAddressSchema,
        required: [true, 'Destination address is required'],
    },

    // --- Special Instructions ---
    specialInstructions: {
        type: String,
        trim: true,
        maxlength: [500, 'Instructions cannot exceed 500 characters'],
        default: '',
    },

    // --- Insurance ---
    insuranceRequired: {
        type: Boolean,
        default: false,
    },
    declaredValue: {
        type: Number,
        min: [0, 'Declared value cannot be negative'],
        default: 0,
    },
    declaredValueCurrency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'CNY', 'JPY'],
    },

    // --- Status Management ---
    status: {
        type: String,
        enum: {
            values: ['Pending', 'Quoted', 'Approved', 'Rejected', 'Cancelled'],
            message: 'Invalid status value',
        },
        default: 'Pending',
        index: true,
    },

    // --- Audit Fields ---
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    reviewedAt: {
        type: Date,
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    rejectionReason: {
        type: String,
        trim: true,
        default: '',
    },

}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    },
    toObject: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});

// ============================================
// Indexes for Performance
// ============================================
shipmentRequestSchema.index({ clientId: 1, status: 1 });
shipmentRequestSchema.index({ requestNumber: 1 }, { unique: true });
shipmentRequestSchema.index({ createdAt: -1 });
shipmentRequestSchema.index({ status: 1, createdAt: -1 });

// ============================================
// Virtual Fields
// ============================================

/**
 * Virtual to check if request is editable
 */
shipmentRequestSchema.virtual('isEditable').get(function () {
    return this.status === 'Pending';
});

/**
 * Virtual to get request age in days
 */
shipmentRequestSchema.virtual('ageInDays').get(function () {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ============================================
// Pre-save Middleware
// ============================================

/**
 * Auto-generate request number
 */
shipmentRequestSchema.pre('save', async function (next) {
    if (this.isNew && !this.requestNumber) {
        this.requestNumber = await generateRequestNumber();
    }
    next();
});

// ============================================
// Instance Methods
// ============================================

/**
 * Check if request can be quoted
 * @returns {boolean}
 */
shipmentRequestSchema.methods.canBeQuoted = function () {
    return this.status === 'Pending';
};

/**
 * Check if request can be approved
 * @returns {boolean}
 */
shipmentRequestSchema.methods.canBeApproved = function () {
    return this.status === 'Quoted';
};

/**
 * Mark request as quoted
 * @param {ObjectId} managerId - The manager who created the quote
 */
shipmentRequestSchema.methods.markAsQuoted = async function (managerId) {
    this.status = 'Quoted';
    this.reviewedAt = new Date();
    this.reviewedBy = managerId;
    return this.save();
};

/**
 * Approve the request
 */
shipmentRequestSchema.methods.approve = async function () {
    if (!this.canBeApproved()) {
        throw new Error('Request cannot be approved in current state');
    }
    this.status = 'Approved';
    return this.save();
};

/**
 * Reject the request
 * @param {string} reason - Rejection reason
 */
shipmentRequestSchema.methods.reject = async function (reason = '') {
    this.status = 'Rejected';
    this.rejectionReason = reason;
    return this.save();
};

// ============================================
// Static Methods
// ============================================

/**
 * Find pending requests
 * @returns {Promise<ShipmentRequest[]>}
 */
shipmentRequestSchema.statics.findPending = function () {
    return this.find({ status: 'Pending' })
        .populate('clientId', 'fullName email customerCode')
        .sort({ createdAt: -1 });
};

/**
 * Find requests by client
 * @param {ObjectId} clientId - Client ID
 * @returns {Promise<ShipmentRequest[]>}
 */
shipmentRequestSchema.statics.findByClient = function (clientId) {
    return this.find({ clientId })
        .sort({ createdAt: -1 });
};

// ============================================
// Helper Functions
// ============================================

/**
 * Generate unique request number
 * @returns {Promise<string>} - Generated request number (e.g., "REQ-20260114-ABC123")
 */
async function generateRequestNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let requestNumber;
    let isUnique = false;

    while (!isUnique) {
        let randomPart = '';
        for (let i = 0; i < 6; i++) {
            randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        requestNumber = `REQ-${dateStr}-${randomPart}`;

        const existing = await mongoose.model('ShipmentRequest').findOne({ requestNumber });
        if (!existing) {
            isUnique = true;
        }
    }

    return requestNumber;
}

module.exports = mongoose.model('ShipmentRequest', shipmentRequestSchema);
