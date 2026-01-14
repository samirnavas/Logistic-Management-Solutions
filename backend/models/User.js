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
    role: {
        type: String,
        enum: ['client', 'manager', 'admin'],
        default: 'client'
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
    if (this.isNew && this.role === 'client' && !this.customerCode) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.customerCode = `LMS-${timestamp}${random}`;
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

module.exports = mongoose.model('User', userSchema);