const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================
// Saved Address Sub-Schema
// ============================================
const savedAddressSchema = new mongoose.Schema({
    label: { type: String, default: 'Default' },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
    contactName: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
    type: { type: String, enum: ['pickup', 'delivery', 'both'], default: 'both' },
});

// ============================================
// User Schema
// ============================================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, default: '' },
    country: { type: String, default: '' },
    location: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    role: {
        type: String,
        enum: ['client app', 'manager', 'admin'],
        default: 'client app'
    },
    customerCode: { type: String, unique: true, sparse: true },
    savedAddresses: { type: [savedAddressSchema], default: [] },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    emailVerified: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================
// CRITICAL FIX: Async Pre-save Hook (No 'next')
// ============================================
userSchema.pre('save', async function () {
    // 1. Generate Customer Code (Instant Timestamp Method)
    // 1. Generate Customer Code (Short Format: LMS-6char)
    if (this.isNew && this.role === 'client app' && !this.customerCode) {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.customerCode = `LMS-${randomCode}`;
    }

    // 2. Hash Password if modified
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
    }
    // Note: With async functions, we do NOT call next(). Mongoose handles it.
});

// ============================================
// Methods
// ============================================
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.findByEmailWithPassword = function (email) {
    return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// ============================================
// Address Helper Methods
// ============================================

userSchema.methods.addAddress = function (addressData, setAsDefault = false) {
    if (setAsDefault || this.savedAddresses.length === 0) {
        this.savedAddresses.forEach(addr => addr.isDefault = false);
        addressData.isDefault = true;
    }
    this.savedAddresses.push(addressData);
    return this.save();
};

userSchema.methods.updateAddress = function (addressId, updateData) {
    const address = this.savedAddresses.id(addressId);
    if (!address) throw new Error('Address not found');

    if (updateData.isDefault) {
        this.savedAddresses.forEach(addr => addr.isDefault = false);
    }

    Object.assign(address, updateData);
    return this.save();
};

userSchema.methods.removeAddress = function (addressId) {
    // Use filter to remove the address safely
    const originalLength = this.savedAddresses.length;
    this.savedAddresses = this.savedAddresses.filter(addr => addr._id.toString() !== addressId.toString());

    // If nothing was removed, just return save (idempotent)
    if (this.savedAddresses.length === originalLength) {
        return this.save();
    }

    // If we removed the default address, make the first one default (if exists)
    const hasDefault = this.savedAddresses.some(addr => addr.isDefault);
    if (!hasDefault && this.savedAddresses.length > 0) {
        this.savedAddresses[0].isDefault = true;
    }
    return this.save();
};

userSchema.methods.setDefaultAddress = function (addressId) {
    const address = this.savedAddresses.id(addressId);
    if (!address) throw new Error('Address not found');

    this.savedAddresses.forEach(addr => addr.isDefault = false);
    address.isDefault = true;
    return this.save();
};

userSchema.methods.getDefaultAddress = function () {
    return this.savedAddresses.find(addr => addr.isDefault) || null;
};

module.exports = mongoose.model('User', userSchema);