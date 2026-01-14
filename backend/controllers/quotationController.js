const Quotation = require('../models/Quotation');
const ShipmentRequest = require('../models/ShipmentRequest');
const Notification = require('../models/Notification');

// ============================================
// Get all quotations (Manager view)
// ============================================
exports.getAllQuotations = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) {
            query.status = status;
        }

        const [quotations, total] = await Promise.all([
            Quotation.find(query)
                .populate('clientId', 'fullName email customerCode')
                .populate('managerId', 'fullName email')
                .populate('requestId', 'requestNumber itemName mode')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Quotation.countDocuments(query)
        ]);

        res.json({
            quotations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + quotations.length < total,
            }
        });
    } catch (error) {
        console.error('Get All Quotations Error:', error);
        res.status(500).json({ message: 'Failed to fetch quotations', error: error.message });
    }
};

// ============================================
// Get quotations for a specific client
// ============================================
exports.getClientQuotations = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        // 1. Fetch Approved/Sent Quotations
        const quotationQuery = {
            clientId,
            status: { $in: ['Approved', 'Sent', 'Accepted', 'Rejected', 'Ready for Pickup'] }
        };

        // 2. Fetch Pending Shipment Requests (to show as "Request Sent")
        // We only fetch these on the first page to ensure they appear at the top
        // or we can try to merge properly. For simplicity, we'll fetch them and prepend.
        // But pagination logic gets complex.
        // Let's just fetch pending requests if page=1, or simply ignore pagination for requests for now (assuming low volume)

        const requestsPromise = ShipmentRequest.find({
            clientId,
            status: 'Pending'
        }).sort({ createdAt: -1 });

        const quotationsPromise = Quotation.find(quotationQuery)
            .populate('requestId', 'requestNumber itemName mode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const countPromise = Quotation.countDocuments(quotationQuery);

        const [requests, quotations, totalQuotations] = await Promise.all([
            requestsPromise,
            quotationsPromise,
            countPromise
        ]);

        // Map requests to look like quotations
        const requestQuotations = requests.map(req => ({
            _id: req._id, // Use request ID as pseudo-quotation ID
            requestId: req,
            clientId: req.clientId,
            createdDate: req.createdAt,
            createdAt: req.createdAt,
            totalAmount: 0,
            status: 'Pending Approval', // Maps to QuotationStatus.pending
            items: [{
                description: req.itemName,
                amount: 0
            }],
            isVirtual: true // Flag to identify it's not a real quotation
        }));

        // Merge: Requests first (newer), then quotations
        // Note: this breaks strict pagination for mixed lists, but ensures visibility of new requests
        const combined = [...requestQuotations, ...quotations];

        res.json({
            quotations: combined,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalQuotations + requests.length,
                totalPages: Math.ceil((totalQuotations + requests.length) / limit),
                hasMore: (skip + quotations.length < totalQuotations) // Simplified
            }
        });
    } catch (error) {
        console.error('Get Client Quotations Error:', error);
        res.status(500).json({ message: 'Failed to fetch quotations', error: error.message });
    }
};

// ============================================
// Get single quotation by ID
// ============================================
exports.getQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id)
            .populate('clientId', 'fullName email customerCode phone')
            .populate('managerId', 'fullName email')
            .populate('requestId');

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        res.json(quotation);
    } catch (error) {
        console.error('Get Quotation Error:', error);
        res.status(500).json({ message: 'Failed to fetch quotation', error: error.message });
    }
};

// ============================================
// Get quotation for client (with visibility check)
// ============================================
exports.getClientQuotation = async (req, res) => {
    try {
        const { id, clientId } = req.params;

        const quotation = await Quotation.findOne({ _id: id, clientId })
            .populate('requestId', 'requestNumber itemName mode deliveryType');

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Return client-safe version
        res.json(quotation.toClientJSON());
    } catch (error) {
        console.error('Get Client Quotation Error:', error);
        res.status(500).json({ message: 'Failed to fetch quotation', error: error.message });
    }
};

// ============================================
// Create new quotation (Manager)
// ============================================
exports.createQuotation = async (req, res) => {
    try {
        const {
            requestId,
            managerId,
            clientId,
            items,
            taxRate,
            discount,
            discountReason,
            currency,
            validUntil,
            termsAndConditions,
            internalNotes,
        } = req.body;

        // Validate required fields
        if (!requestId || !managerId || !clientId || !items || items.length === 0) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['requestId', 'managerId', 'clientId', 'items']
            });
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const tax = (subtotal * (taxRate || 0)) / 100;
        const totalAmount = subtotal + tax - (discount || 0);

        // Set validity to 30 days from now if not provided
        const validityDate = validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const newQuotation = new Quotation({
            requestId,
            managerId,
            clientId,
            items,
            subtotal,
            taxRate: taxRate || 0,
            tax,
            discount: discount || 0,
            discountReason,
            totalAmount,
            currency: currency || 'USD',
            validUntil: validityDate,
            termsAndConditions,
            internalNotes,
            status: 'Draft',
        });

        const savedQuotation = await newQuotation.save();

        res.status(201).json({
            message: 'Quotation created successfully',
            quotation: savedQuotation,
        });
    } catch (error) {
        console.error('Create Quotation Error:', error);
        res.status(400).json({ message: 'Failed to create quotation', error: error.message });
    }
};

// ============================================
// Update quotation (Manager)
// ============================================
exports.updateQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        if (!quotation.canBeEdited()) {
            return res.status(400).json({
                message: 'Cannot update quotation. Only draft or pending approval quotations can be modified.'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'items', 'taxRate', 'discount', 'discountReason', 'currency',
            'validUntil', 'termsAndConditions', 'internalNotes'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                quotation[field] = req.body[field];
            }
        });

        // Recalculate totals
        quotation.calculateTotals();

        const updatedQuotation = await quotation.save();

        res.json({
            message: 'Quotation updated successfully',
            quotation: updatedQuotation,
        });
    } catch (error) {
        console.error('Update Quotation Error:', error);
        res.status(400).json({ message: 'Failed to update quotation', error: error.message });
    }
};

// ============================================
// Approve quotation by manager
// ============================================
exports.approveByManager = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id)
            .populate('requestId', 'requestNumber');

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        await quotation.approveByManager();

        // Update related request status
        if (quotation.requestId) {
            await ShipmentRequest.findByIdAndUpdate(
                quotation.requestId._id || quotation.requestId,
                { status: 'Quoted' }
            );
        }

        res.json({
            message: 'Quotation approved by manager',
            quotation,
        });
    } catch (error) {
        console.error('Approve By Manager Error:', error);
        res.status(500).json({ message: 'Failed to approve quotation', error: error.message });
    }
};

// ============================================
// Send quotation to client
// ============================================
exports.sendToClient = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id)
            .populate('requestId', 'requestNumber');

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        await quotation.sendToClient();

        // Create notification for client
        await Notification.createQuotationNotification(
            quotation.clientId,
            quotation,
            'sent'
        );

        res.json({
            message: 'Quotation sent to client',
            quotation,
        });
    } catch (error) {
        console.error('Send To Client Error:', error);
        res.status(500).json({ message: 'Failed to send quotation', error: error.message });
    }
};

// ============================================
// Client accepts quotation
// ============================================
exports.acceptByClient = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        await quotation.acceptByClient();

        // Update related request status to Approved
        if (quotation.requestId) {
            await ShipmentRequest.findByIdAndUpdate(
                quotation.requestId,
                { status: 'Approved' }
            );
        }

        // Notify manager
        await Notification.createNotification({
            recipientId: quotation.managerId,
            title: 'Quotation Accepted',
            message: `Client has accepted quotation ${quotation.quotationNumber}`,
            type: 'success',
            category: 'quotation',
            relatedId: quotation._id,
            relatedModel: 'Quotation',
        });

        res.json({
            message: 'Quotation accepted',
            quotation,
        });
    } catch (error) {
        console.error('Accept By Client Error:', error);
        res.status(500).json({ message: 'Failed to accept quotation', error: error.message });
    }
};

// ============================================
// Client rejects quotation
// ============================================
exports.rejectByClient = async (req, res) => {
    try {
        const { reason } = req.body;
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        await quotation.rejectByClient(reason);

        // Update related request status
        if (quotation.requestId) {
            await ShipmentRequest.findByIdAndUpdate(
                quotation.requestId,
                { status: 'Rejected' }
            );
        }

        // Notify manager
        await Notification.createNotification({
            recipientId: quotation.managerId,
            title: 'Quotation Rejected',
            message: `Client has rejected quotation ${quotation.quotationNumber}. Reason: ${reason || 'Not specified'}`,
            type: 'warning',
            category: 'quotation',
            relatedId: quotation._id,
            relatedModel: 'Quotation',
        });

        res.json({
            message: 'Quotation rejected',
            quotation,
        });
    } catch (error) {
        console.error('Reject By Client Error:', error);
        res.status(500).json({ message: 'Failed to reject quotation', error: error.message });
    }
};

// ============================================
// Get quotations by request ID
// ============================================
exports.getByRequest = async (req, res) => {
    try {
        const quotations = await Quotation.findByRequest(req.params.requestId);
        res.json(quotations);
    } catch (error) {
        console.error('Get By Request Error:', error);
        res.status(500).json({ message: 'Failed to fetch quotations', error: error.message });
    }
};

// ============================================
// Delete quotation (Admin only)
// ============================================
exports.deleteQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findByIdAndDelete(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        res.json({ message: 'Quotation deleted successfully' });
    } catch (error) {
        console.error('Delete Quotation Error:', error);
        res.status(500).json({ message: 'Failed to delete quotation', error: error.message });
    }
};

// ============================================
// Confirm address and set Ready for Pickup
// ============================================
exports.confirmAddress = async (req, res) => {
    try {
        const { pickupAddress, deliveryAddress } = req.body;
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Update the related ShipmentRequest with the new addresses
        if (quotation.requestId) {
            const updateData = {};
            if (pickupAddress) updateData.pickupAddress = pickupAddress;
            if (deliveryAddress) updateData.destinationAddress = deliveryAddress;

            await ShipmentRequest.findByIdAndUpdate(
                quotation.requestId,
                updateData
            );
        }

        // Update Quotation status
        quotation.status = 'Ready for Pickup';
        // Also mark as accepted if not already
        if (!quotation.isAcceptedByClient) {
            quotation.isAcceptedByClient = true;
            quotation.clientAcceptedAt = new Date();
        }

        await quotation.save();

        // Notify manager
        try {
            await Notification.createNotification({
                recipientId: quotation.managerId,
                title: 'Address Confirmed',
                message: `Client has confirmed address details for quotation ${quotation.quotationNumber}. Ready for pickup.`,
                type: 'info',
                category: 'quotation',
                relatedId: quotation._id,
                relatedModel: 'Quotation',
            });
        } catch (notifError) {
            console.error('Failed to create notification', notifError);
        }

        res.json({
            message: 'Address confirmed and quotation updated',
            quotation,
        });
    } catch (error) {
        console.error('Confirm Address Error:', error);
        res.status(500).json({ message: 'Failed to confirm address', error: error.message });
    }
};
