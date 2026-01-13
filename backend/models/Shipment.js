const mongoose = require('mongoose');

const ShipmentSchema = new mongoose.Schema({
    trackingNumber: {
        type: String,
        required: true,
        unique: true
    },
    origin: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: 'Pending'
    },
    estimatedDelivery: {
        type: Date,
        required: true
    },
    packageIds: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('Shipment', ShipmentSchema);
