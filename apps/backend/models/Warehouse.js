const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Warehouse name is required'],
        trim: true,
        unique: true
    },
    code: {
        type: String,
        required: [true, 'Warehouse code is required'],
        trim: true,
        uppercase: true,
        unique: true
    },
    address: {
        addressLine: {
            type: String,
            required: [true, 'Address line is required'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            trim: true
        },
        zip: {
            type: String,
            required: [true, 'ZIP code is required'],
            trim: true
        }
    },
    contact: {
        name: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
