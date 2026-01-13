const ShipmentRequest = require('../models/ShipmentRequest');
const Quotation = require('../models/Quotation');
const Notification = require('../models/Notification');

// ============================================
// Get all shipment requests (Manager view)
// ============================================
exports.getAllRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) {
            query.status = status;
        }

        const [requests, total] = await Promise.all([
            ShipmentRequest.find(query)
                .populate('clientId', 'fullName email customerCode phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            ShipmentRequest.countDocuments(query)
        ]);

        res.json({
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + requests.length < total,
            }
        });
    } catch (error) {
        console.error('Get All Requests Error:', error);
        res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
    }
};

// ============================================
// Get requests for a specific client
// ============================================
exports.getClientRequests = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = { clientId };
        if (status) {
            query.status = status;
        }

        const [requests, total] = await Promise.all([
            ShipmentRequest.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            ShipmentRequest.countDocuments(query)
        ]);

        res.json({
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + requests.length < total,
            }
        });
    } catch (error) {
        console.error('Get Client Requests Error:', error);
        res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
    }
};

// ============================================
// Get single request by ID
// ============================================
exports.getRequest = async (req, res) => {
    try {
        const request = await ShipmentRequest.findById(req.params.id)
            .populate('clientId', 'fullName email customerCode phone');

        if (!request) {
            return res.status(404).json({ message: 'Shipment request not found' });
        }

        res.json(request);
    } catch (error) {
        console.error('Get Request Error:', error);
        res.status(500).json({ message: 'Failed to fetch request', error: error.message });
    }
};

// ============================================
// Create new shipment request (Client)
// ============================================
exports.createRequest = async (req, res) => {
    try {
        const {
            clientId,
            mode,
            deliveryType,
            itemName,
            itemDescription,
            boxCount,
            totalWeight,
            weightUnit,
            totalCbm,
            hsCode,
            photoUrls,
            pickupAddress,
            destinationAddress,
            specialInstructions,
            insuranceRequired,
            declaredValue,
            declaredValueCurrency,
        } = req.body;

        // Validate required fields
        if (!clientId || !mode || !deliveryType || !itemName || !boxCount || !pickupAddress || !destinationAddress) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['clientId', 'mode', 'deliveryType', 'itemName', 'boxCount', 'pickupAddress', 'destinationAddress']
            });
        }

        const newRequest = new ShipmentRequest({
            clientId,
            mode,
            deliveryType,
            itemName,
            itemDescription,
            boxCount,
            totalWeight,
            weightUnit,
            totalCbm,
            hsCode,
            photoUrls: photoUrls || [],
            pickupAddress,
            destinationAddress,
            specialInstructions,
            insuranceRequired,
            declaredValue,
            declaredValueCurrency,
            status: 'Pending',
            submittedAt: new Date(),
        });

        const savedRequest = await newRequest.save();

        res.status(201).json({
            message: 'Shipment request created successfully',
            request: savedRequest,
        });
    } catch (error) {
        console.error('Create Request Error:', error);
        res.status(400).json({ message: 'Failed to create request', error: error.message });
    }
};

// ============================================
// Update shipment request
// ============================================
exports.updateRequest = async (req, res) => {
    try {
        const request = await ShipmentRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Shipment request not found' });
        }

        // Only allow updates if status is Pending
        if (request.status !== 'Pending') {
            return res.status(400).json({
                message: 'Cannot update request. Only pending requests can be modified.'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'mode', 'deliveryType', 'itemName', 'itemDescription', 'boxCount',
            'totalWeight', 'weightUnit', 'totalCbm', 'hsCode', 'photoUrls',
            'pickupAddress', 'destinationAddress', 'specialInstructions',
            'insuranceRequired', 'declaredValue', 'declaredValueCurrency'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                request[field] = req.body[field];
            }
        });

        const updatedRequest = await request.save();

        res.json({
            message: 'Request updated successfully',
            request: updatedRequest,
        });
    } catch (error) {
        console.error('Update Request Error:', error);
        res.status(400).json({ message: 'Failed to update request', error: error.message });
    }
};

// ============================================
// Cancel shipment request (Client)
// ============================================
exports.cancelRequest = async (req, res) => {
    try {
        const request = await ShipmentRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Shipment request not found' });
        }

        // Only allow cancellation if status is Pending or Quoted
        if (!['Pending', 'Quoted'].includes(request.status)) {
            return res.status(400).json({
                message: 'Cannot cancel request. Only pending or quoted requests can be cancelled.'
            });
        }

        request.status = 'Cancelled';
        await request.save();

        res.json({
            message: 'Request cancelled successfully',
            request,
        });
    } catch (error) {
        console.error('Cancel Request Error:', error);
        res.status(500).json({ message: 'Failed to cancel request', error: error.message });
    }
};

// ============================================
// Mark request as quoted (Manager)
// ============================================
exports.markAsQuoted = async (req, res) => {
    try {
        const { managerId } = req.body;
        const request = await ShipmentRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Shipment request not found' });
        }

        if (!request.canBeQuoted()) {
            return res.status(400).json({
                message: 'Request cannot be quoted in its current state'
            });
        }

        await request.markAsQuoted(managerId);

        // Create notification for client
        await Notification.createNotification({
            recipientId: request.clientId,
            title: 'Quotation Ready',
            message: `A quotation has been created for your request ${request.requestNumber}`,
            type: 'success',
            category: 'request',
            relatedId: request._id,
            relatedModel: 'ShipmentRequest',
        });

        res.json({
            message: 'Request marked as quoted',
            request,
        });
    } catch (error) {
        console.error('Mark As Quoted Error:', error);
        res.status(500).json({ message: 'Failed to update request', error: error.message });
    }
};

// ============================================
// Approve request (after client accepts quotation)
// ============================================
exports.approveRequest = async (req, res) => {
    try {
        const request = await ShipmentRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Shipment request not found' });
        }

        if (!request.canBeApproved()) {
            return res.status(400).json({
                message: 'Request cannot be approved. It must be in Quoted status.'
            });
        }

        await request.approve();

        res.json({
            message: 'Request approved successfully',
            request,
        });
    } catch (error) {
        console.error('Approve Request Error:', error);
        res.status(500).json({ message: 'Failed to approve request', error: error.message });
    }
};

// ============================================
// Reject request (Manager)
// ============================================
exports.rejectRequest = async (req, res) => {
    try {
        const { reason } = req.body;
        const request = await ShipmentRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Shipment request not found' });
        }

        await request.reject(reason);

        // Create notification for client
        await Notification.createNotification({
            recipientId: request.clientId,
            title: 'Request Rejected',
            message: reason || `Your request ${request.requestNumber} has been rejected`,
            type: 'error',
            category: 'request',
            relatedId: request._id,
            relatedModel: 'ShipmentRequest',
        });

        res.json({
            message: 'Request rejected',
            request,
        });
    } catch (error) {
        console.error('Reject Request Error:', error);
        res.status(500).json({ message: 'Failed to reject request', error: error.message });
    }
};

// ============================================
// Get pending requests count (for dashboard)
// ============================================
exports.getPendingCount = async (req, res) => {
    try {
        const count = await ShipmentRequest.countDocuments({ status: 'Pending' });
        res.json({ count });
    } catch (error) {
        console.error('Get Pending Count Error:', error);
        res.status(500).json({ message: 'Failed to get count', error: error.message });
    }
};

// ============================================
// Delete request (Admin only)
// ============================================
exports.deleteRequest = async (req, res) => {
    try {
        const request = await ShipmentRequest.findByIdAndDelete(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Shipment request not found' });
        }

        // Also delete related quotations
        await Quotation.deleteMany({ requestId: req.params.id });

        res.json({ message: 'Request and related data deleted successfully' });
    } catch (error) {
        console.error('Delete Request Error:', error);
        res.status(500).json({ message: 'Failed to delete request', error: error.message });
    }
};
