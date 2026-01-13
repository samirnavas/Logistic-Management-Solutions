const Shipment = require('../models/Shipment');

// Get all shipments
exports.getShipments = async (req, res) => {
    try {
        const shipments = await Shipment.find().sort({ createdAt: -1 });
        res.json(shipments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single shipment by ID
exports.getShipment = async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id);
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }
        res.json(shipment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get shipment by tracking number
exports.getShipmentByTracking = async (req, res) => {
    try {
        const shipment = await Shipment.findOne({ trackingNumber: req.params.trackingNumber });
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }
        res.json(shipment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get shipments by status
exports.getShipmentsByStatus = async (req, res) => {
    try {
        const status = req.params.status;
        // Case insensitive search
        const shipments = await Shipment.find({
            status: { $regex: new RegExp(`^${status}$`, 'i') }
        }).sort({ createdAt: -1 });
        res.json(shipments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create shipment
exports.createShipment = async (req, res) => {
    try {
        const newShipment = new Shipment(req.body);
        const savedShipment = await newShipment.save();
        res.status(201).json(savedShipment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update shipment
exports.updateShipment = async (req, res) => {
    try {
        const updatedShipment = await Shipment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedShipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }
        res.json(updatedShipment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete shipment
exports.deleteShipment = async (req, res) => {
    try {
        const deletedShipment = await Shipment.findByIdAndDelete(req.params.id);
        if (!deletedShipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }
        res.json({ message: 'Shipment deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
