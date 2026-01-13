const Shipment = require('../models/Shipment');
const Notification = require('../models/Notification');

// ============================================
// Get all shipments
// ============================================
exports.getShipments = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) {
            query.status = status;
        }

        const [shipments, total] = await Promise.all([
            Shipment.find(query)
                .populate('clientId', 'fullName email customerCode phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Shipment.countDocuments(query)
        ]);

        res.json({
            shipments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + shipments.length < total,
            }
        });
    } catch (error) {
        console.error('Get Shipments Error:', error);
        res.status(500).json({ message: 'Failed to fetch shipments', error: error.message });
    }
};

// ============================================
// Get shipments for a specific client
// ============================================
exports.getClientShipments = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = { clientId };
        if (status) {
            query.status = status;
        }

        const [shipments, total] = await Promise.all([
            Shipment.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Shipment.countDocuments(query)
        ]);

        res.json({
            shipments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + shipments.length < total,
            }
        });
    } catch (error) {
        console.error('Get Client Shipments Error:', error);
        res.status(500).json({ message: 'Failed to fetch shipments', error: error.message });
    }
};

// ============================================
// Get active shipments for a client
// ============================================
exports.getActiveShipments = async (req, res) => {
    try {
        const { clientId } = req.params;

        const shipments = await Shipment.findActiveByClient(clientId);

        res.json({ shipments });
    } catch (error) {
        console.error('Get Active Shipments Error:', error);
        res.status(500).json({ message: 'Failed to fetch shipments', error: error.message });
    }
};

// ============================================
// Get single shipment by ID
// ============================================
exports.getShipment = async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id)
            .populate('clientId', 'fullName email customerCode phone')
            .populate('requestId', 'requestNumber itemName');

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        res.json(shipment);
    } catch (error) {
        console.error('Get Shipment Error:', error);
        res.status(500).json({ message: 'Failed to fetch shipment', error: error.message });
    }
};

// ============================================
// Get shipment by tracking number
// ============================================
exports.getShipmentByTracking = async (req, res) => {
    try {
        const shipment = await Shipment.findByTracking(req.params.trackingNumber);

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        res.json(shipment);
    } catch (error) {
        console.error('Get By Tracking Error:', error);
        res.status(500).json({ message: 'Failed to fetch shipment', error: error.message });
    }
};

// ============================================
// Get shipments by status
// ============================================
exports.getShipmentsByStatus = async (req, res) => {
    try {
        const { status } = req.params;

        const shipments = await Shipment.find({ status })
            .populate('clientId', 'fullName email customerCode')
            .sort({ createdAt: -1 });

        res.json({ shipments });
    } catch (error) {
        console.error('Get By Status Error:', error);
        res.status(500).json({ message: 'Failed to fetch shipments', error: error.message });
    }
};

// ============================================
// Get shipments requiring attention
// ============================================
exports.getRequiringAttention = async (req, res) => {
    try {
        const shipments = await Shipment.findRequiringAttention();
        res.json({ shipments });
    } catch (error) {
        console.error('Get Requiring Attention Error:', error);
        res.status(500).json({ message: 'Failed to fetch shipments', error: error.message });
    }
};

// ============================================
// Get shipment statistics for a client
// ============================================
exports.getClientStats = async (req, res) => {
    try {
        const { clientId } = req.params;

        const stats = await Shipment.getClientStats(clientId);

        res.json(stats);
    } catch (error) {
        console.error('Get Client Stats Error:', error);
        res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
    }
};

// ============================================
// Create shipment
// ============================================
exports.createShipment = async (req, res) => {
    try {
        const {
            clientId,
            requestId,
            quotationId,
            managerId,
            mode,
            serviceType,
            origin,
            destination,
            packageCount,
            totalWeight,
            weightUnit,
            totalCbm,
            itemDescription,
            estimatedDelivery,
            isInsured,
            isFragile,
            requiresRefrigeration,
            isHazardous,
            deliveryInstructions,
            signatureRequired,
        } = req.body;

        // Validate required fields
        if (!clientId || !origin || !destination) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['clientId', 'origin', 'destination']
            });
        }

        const newShipment = new Shipment({
            clientId,
            requestId,
            quotationId,
            managerId,
            mode: mode || 'Air',
            serviceType: serviceType || 'Standard',
            origin,
            destination,
            currentLocation: origin,
            packageCount: packageCount || 1,
            totalWeight,
            weightUnit,
            totalCbm,
            itemDescription,
            estimatedDelivery,
            isInsured,
            isFragile,
            requiresRefrigeration,
            isHazardous,
            deliveryInstructions,
            signatureRequired,
            status: 'Processing',
            timeline: [{
                status: 'Processing',
                location: origin.city || '',
                timestamp: new Date(),
                description: 'Shipment created and is being processed',
            }],
        });

        const savedShipment = await newShipment.save();

        // Send notification to client
        await Notification.createShipmentNotification(
            clientId,
            savedShipment,
            'Processing'
        );

        res.status(201).json({
            message: 'Shipment created successfully',
            shipment: savedShipment,
        });
    } catch (error) {
        console.error('Create Shipment Error:', error);
        res.status(400).json({ message: 'Failed to create shipment', error: error.message });
    }
};

// ============================================
// Update shipment status with timeline event
// ============================================
exports.updateStatus = async (req, res) => {
    try {
        const { status, location, description, notifyClient = true } = req.body;

        const shipment = await Shipment.findById(req.params.id);

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        // Update status and add timeline event
        await shipment.updateStatus(status, location, description);

        // Send notification to client
        if (notifyClient) {
            await Notification.createShipmentNotification(
                shipment.clientId,
                shipment,
                status
            );
        }

        res.json({
            message: 'Shipment status updated',
            shipment,
        });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(400).json({ message: 'Failed to update status', error: error.message });
    }
};

// ============================================
// Mark as picked up
// ============================================
exports.markPickedUp = async (req, res) => {
    try {
        const { location } = req.body;

        const shipment = await Shipment.findById(req.params.id);

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        await shipment.markPickedUp(location);

        // Send notification
        await Notification.createShipmentNotification(
            shipment.clientId,
            shipment,
            'Picked Up'
        );

        res.json({
            message: 'Shipment marked as picked up',
            shipment,
        });
    } catch (error) {
        console.error('Mark Picked Up Error:', error);
        res.status(400).json({ message: 'Failed to update shipment', error: error.message });
    }
};

// ============================================
// Mark as delivered
// ============================================
exports.markDelivered = async (req, res) => {
    try {
        const { recipientName } = req.body;

        const shipment = await Shipment.findById(req.params.id);

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        await shipment.markDelivered(recipientName);

        // Send notification
        await Notification.createShipmentNotification(
            shipment.clientId,
            shipment,
            'Delivered'
        );

        res.json({
            message: 'Shipment marked as delivered',
            shipment,
        });
    } catch (error) {
        console.error('Mark Delivered Error:', error);
        res.status(400).json({ message: 'Failed to update shipment', error: error.message });
    }
};

// ============================================
// Mark as exception
// ============================================
exports.markException = async (req, res) => {
    try {
        const { reason, location } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Exception reason is required' });
        }

        const shipment = await Shipment.findById(req.params.id);

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        await shipment.markException(reason, location);

        // Send notification
        await Notification.createShipmentNotification(
            shipment.clientId,
            shipment,
            'Exception'
        );

        res.json({
            message: 'Shipment marked as exception',
            shipment,
        });
    } catch (error) {
        console.error('Mark Exception Error:', error);
        res.status(400).json({ message: 'Failed to update shipment', error: error.message });
    }
};

// ============================================
// Add timeline event (without status change)
// ============================================
exports.addTimelineEvent = async (req, res) => {
    try {
        const { status, location, description, timestamp } = req.body;

        const shipment = await Shipment.findById(req.params.id);

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        await shipment.addTimelineEvent({
            status,
            location,
            description,
            timestamp,
            updateStatus: false, // Don't update the main status
        });

        res.json({
            message: 'Timeline event added',
            shipment,
        });
    } catch (error) {
        console.error('Add Timeline Event Error:', error);
        res.status(400).json({ message: 'Failed to add event', error: error.message });
    }
};

// ============================================
// Update shipment details
// ============================================
exports.updateShipment = async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id);

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        // Update allowed fields
        const allowedUpdates = [
            'carrier', 'carrierTrackingNumber', 'estimatedDelivery',
            'deliveryInstructions', 'isInsured', 'isFragile',
            'requiresRefrigeration', 'isHazardous', 'internalNotes',
            'customsStatus', 'customsDeclarationNumber', 'hsCode'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                shipment[field] = req.body[field];
            }
        });

        const updatedShipment = await shipment.save();

        res.json({
            message: 'Shipment updated successfully',
            shipment: updatedShipment,
        });
    } catch (error) {
        console.error('Update Shipment Error:', error);
        res.status(400).json({ message: 'Failed to update shipment', error: error.message });
    }
};

// ============================================
// Delete shipment
// ============================================
exports.deleteShipment = async (req, res) => {
    try {
        const shipment = await Shipment.findByIdAndDelete(req.params.id);

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        res.json({ message: 'Shipment deleted successfully' });
    } catch (error) {
        console.error('Delete Shipment Error:', error);
        res.status(500).json({ message: 'Failed to delete shipment', error: error.message });
    }
};

// ============================================
// Get shipment timeline
// ============================================
exports.getTimeline = async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id)
            .select('trackingNumber timeline status');

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        res.json({
            trackingNumber: shipment.trackingNumber,
            currentStatus: shipment.status,
            timeline: shipment.timeline,
        });
    } catch (error) {
        console.error('Get Timeline Error:', error);
        res.status(500).json({ message: 'Failed to fetch timeline', error: error.message });
    }
};
