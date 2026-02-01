const Quotation = require('../models/Quotation');
const Notification = require('../models/Notification');
const Shipment = require('../models/Shipment');

// ============================================
// Get all quotations (Manager view)
// ============================================
exports.getAllQuotations = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) {
            query.status = status;
        }

        const [quotations, total] = await Promise.all([
            Quotation.find(query)
                .populate('clientId', 'fullName email customerCode')
                .populate('managerId', 'fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Quotation.countDocuments(query)
        ]);

        res.json({
            quotations,
            totalCount: total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Get All Quotations Error:', error);
        res.status(500).json({ message: 'Failed to fetch quotations', error: error.message });
    }
};

// ============================================
// Get quotations for a specific client app
// ============================================
exports.getClientQuotations = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = { clientId };

        const [quotations, total] = await Promise.all([
            Quotation.find(query)
                .populate('managerId', 'fullName email')
                .sort({ createdAt: -1 }) // Newest first
                .skip(skip)
                .limit(parseInt(limit)),
            Quotation.countDocuments(query)
        ]);

        res.json({
            quotations: quotations.map(q => q.toClientJSON()),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + quotations.length < total,
            }
        });
    } catch (error) {
        console.error('Get client app Quotations Error:', error);
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
            .populate('managerId', 'fullName email');

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
// Get quotation for client app (with visibility check)
// ============================================
exports.getClientQuotation = async (req, res) => {
    try {
        const { id, clientId } = req.params;

        const quotation = await Quotation.findOne({ _id: id, clientId })
            .populate('managerId', 'fullName email');

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Return client app-safe version
        res.json(quotation.toClientJSON());
    } catch (error) {
        console.error('Get client app Quotation Error:', error);
        res.status(500).json({ message: 'Failed to fetch quotation', error: error.message });
    }
};

// ============================================
// Create new quotation (Originally created by client app as Request)
// ============================================
exports.createQuotation = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            origin,
            destination,
            items,
            pickupDate,
            deliveryDate,
            cargoType,
            serviceType,
            specialInstructions
        } = req.body;

        // Validation for critical fields
        if (!origin || !destination || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Missing required fields or invalid items format',
                required: ['origin', 'destination', 'items (array)']
            });
        }

        const newQuotation = new Quotation({
            clientId: userId,
            origin,
            destination,
            items, // Initial items from request
            pickupDate,
            deliveryDate,
            cargoType,
            serviceType,
            specialInstructions,
            status: 'PENDING_REVIEW',
            totalAmount: 0 // Initialize to 0
        });

        const savedQuotation = await newQuotation.save();

        // Notify managers (optional but good for workflow)
        // await Notification.createNotificationForManagers(...)

        res.status(201).json({
            message: 'Quotation request created successfully',
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
            'validUntil', 'termsAndConditions', 'internalNotes', 'additionalNotes',
            'status', 'managerId', 'origin', 'destination', 'pickupDate', 'deliveryDate'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                quotation[field] = req.body[field];
            }
        });

        // Automatically update status to 'VERIFIED' if manager updates price/items
        // and current status is 'PENDING_REVIEW'
        if (quotation.status === 'PENDING_REVIEW' && (req.body.totalAmount !== undefined || req.body.items !== undefined)) {
            // Ensure we don't accidentally set it if the manager explicitly set it to something else in this same update (though unlikely via this logic)
            if (!req.body.status) {
                quotation.status = 'VERIFIED';
            }
        }

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
// Update Quote Price (Specialized Endpoint)
// ============================================
exports.updateQuotePrice = async (req, res) => {
    try {
        const { items, taxRate, discount, internalNotes, additionalNotes, validUntil, status } = req.body;
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Update fields
        if (items) quotation.items = items;
        if (taxRate !== undefined) quotation.taxRate = taxRate;
        if (discount !== undefined) quotation.discount = discount;
        if (internalNotes !== undefined) quotation.internalNotes = internalNotes;
        if (additionalNotes !== undefined) quotation.additionalNotes = additionalNotes;
        if (validUntil !== undefined) quotation.validUntil = validUntil;

        // Set status to 'VERIFIED' (intermediate) or whatever was passed
        // This ensures the quotation is marked as processed but not yet "Approved" or "Sent" fully unless workflow dictates
        quotation.status = status || 'VERIFIED';

        // Recalculate totals
        quotation.calculateTotals();

        const updatedQuotation = await quotation.save();

        res.json({
            message: 'Quotation price updated successfully',
            quotation: updatedQuotation,
        });
    } catch (error) {
        console.error('Update Quote Price Error:', error);
        res.status(400).json({ message: 'Failed to update quotation price', error: error.message });
    }
};

// ============================================
// Reject quotation (Manager)
// ============================================
exports.rejectQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        quotation.status = 'REJECTED';
        const updatedQuotation = await quotation.save();

        // Notify client app
        await Notification.createNotification({
            recipientId: quotation.clientId,
            title: 'Request Rejected',
            message: `Your request ${quotation.quotationNumber} has been rejected by the manager.`,
            type: 'error',
            category: 'quotation',
            relatedId: quotation._id,
            relatedModel: 'Quotation',
        });

        res.json({
            message: 'Quotation rejected successfully',
            quotation: updatedQuotation,
        });
    } catch (error) {
        console.error('Reject Quotation Error:', error);
        res.status(500).json({ message: 'Failed to reject quotation', error: error.message });
    }
};

// ============================================
// Approve quotation by manager
// ============================================
exports.approveByManager = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        await quotation.approveByManager();

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
// Send quotation to client app
// ============================================
const { generateCustomPDF } = require('../utils/pdfGenerator');
const { cloudinary } = require('../config/cloudinary');
const stream = require('stream');

// Helper to convert number to words (Basic implementation)
const numberToWords = (num) => {
    if (num === 0) return "Zero";
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const regex = /^(\d{1,2})(\d{2})(\d{2})(\d{1})(\d{2})$/;
    const getWords = (n) => {
        if ((n = n.toString()).length > 9) return 'overflow';
        n = ('000000000' + n).substr(-9);
        return (n.match(regex) || []).slice(1).reduce((str, v, i) => {
            if (parseFloat(v) === 0) return str;
            return str + (a[Number(v)] || b[v[0]] + ' ' + a[v[1]]) + (['Crore ', 'Lakh ', 'Thousand ', 'Hundred ', ''][i]);
        }, '');
    }
    return getWords(Math.floor(num)).trim() + " Only";
};

// ============================================
// Send quotation to client app (UPDATED WITH PHASE 3 VALIDATIONS)
// ============================================
exports.sendToClient = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id)
            .populate('clientId', 'fullName email customerCode phone')
            .populate('managerId', 'fullName email');

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // ============================================
        // PHASE 3: VALIDATION CHECKS
        // ============================================

        // Check 1: Prevent sending if status is EXPIRED
        if (quotation.status === 'EXPIRED') {
            return res.status(400).json({
                message: 'Cannot send an expired quotation to client',
                error: 'Quotation has already expired. Please create a new quotation.'
            });
        }

        // Check 2: Prevent sending if totalAmount is 0 (unless it's a specific free service)
        // This prevents sending quotes that haven't been properly priced
        if (quotation.totalAmount === 0) {
            return res.status(400).json({
                message: 'Cannot send quotation with zero amount',
                error: 'Please calculate the quotation price before sending to client'
            });
        }

        // Optional Check 3: Ensure quotation has been verified
        // Uncomment if you want to enforce verification step before sending
        // if (quotation.status !== 'VERIFIED' && quotation.status !== 'QUOTATION_GENERATED') {
        //     return res.status(400).json({ 
        //         message: 'Quotation must be verified before sending to client',
        //         currentStatus: quotation.status
        //     });
        // }

        // ============================================
        // 1. Prepare Data for PDF
        // ============================================
        // Filter items for the table (Goods) vs Charges
        // Assuming 'Freight', 'Insurance', 'Packaging', 'Handling', 'Tax' are charges
        const chargeCategories = ['freight', 'insurance', 'packaging', 'handling', 'tax'];

        const goodsItems = quotation.items.filter(item => !chargeCategories.includes(item.category.toLowerCase()));

        // Calculate charges from items or use specific fields if logic dictates
        const getCharge = (cat) => quotation.items
            .filter(i => i.category.toLowerCase() === cat)
            .reduce((sum, i) => sum + (i.amount || 0), 0);

        const shippingCharge = getCharge('freight');
        const pickupCharge = getCharge('handling');
        const packagingCharge = getCharge('packaging');
        const insuranceCharge = getCharge('insurance');

        // Format Currency
        const formatCurrency = (amount) => {
            return amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
        };

        const pdfData = {
            clientName: quotation.clientId.fullName,
            clientAddress: `${quotation.destination.addressLine}, ${quotation.destination.city}`,
            clientPhone: quotation.clientId.phone || quotation.destination.phone || '',
            quotationId: quotation.quotationNumber,
            date: new Date(quotation.createdAt).toLocaleDateString('en-GB'),
            validityDate: new Date(quotation.validUntil).toLocaleDateString('en-GB'),
            items: goodsItems.map((item, index) => ({
                index: index + 1,
                image: item.images && item.images.length > 0 ? item.images[0] : null,
                category: item.category,
                description: item.description,
                hsCode: '8320',
                boxes: item.quantity,
                weight: item.weight + ' kg',
                cbm: item.packingVolume || 0
            })),
            currency: quotation.currency === 'USD' ? '$' : (quotation.currency === 'INR' ? '₹' : quotation.currency),
            shippingCharge: formatCurrency(shippingCharge),
            pickupCharge: formatCurrency(pickupCharge),
            packagingCharge: formatCurrency(packagingCharge),
            insuranceCharge: formatCurrency(insuranceCharge),
            tax: formatCurrency(quotation.tax),
            totalAmount: formatCurrency(quotation.totalAmount),
            totalAmountInWords: numberToWords(quotation.totalAmount)
        };

        // 2. Generate PDF
        const pdfBuffer = await generateCustomPDF(pdfData);

        // 3. Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'raw',
                    folder: 'lms/quotations',
                    format: 'pdf',
                    public_id: `quotation_${quotation.quotationNumber}_${Date.now()}`
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary Upload Error:', error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            const bufferStream = new stream.PassThrough();
            bufferStream.end(pdfBuffer);
            bufferStream.pipe(uploadStream);
        });

        // 4. Save URL and Update Status
        quotation.pdfUrl = uploadResult.secure_url;
        // The sendToClient() method already sets status to 'QUOTATION_SENT'
        await quotation.sendToClient();

        // Create notification for client app
        await Notification.createQuotationNotification(
            quotation.clientId._id,
            quotation,
            'sent'
        );

        res.json({
            message: 'Quotation generated, uploaded, and sent to client app',
            quotation,
            pdfUrl: quotation.pdfUrl
        });
    } catch (error) {
        console.error('Send To client app Error:', error);
        res.status(500).json({ message: 'Failed to send quotation', error: error.message });
    }
};

// ============================================
// Request Revision / Negotiation (Client Only) - PHASE 4
// ============================================
exports.requestRevision = async (req, res) => {
    try {
        const { reason } = req.body;
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // PHASE 4: Strict validation - only allow if status is QUOTATION_SENT
        if (quotation.status !== 'QUOTATION_SENT') {
            return res.status(400).json({
                message: 'Cannot request revision for this quotation',
                error: `Current status is ${quotation.status}. Revision can only be requested for sent quotations.`,
                currentStatus: quotation.status
            });
        }

        // Validate reason
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                message: 'Reason is required',
                error: 'Please provide a reason for the revision request'
            });
        }

        // Update status to NEGOTIATION_REQUESTED
        quotation.status = 'NEGOTIATION_REQUESTED';

        // Save reason in negotiation.clientNotes
        quotation.negotiation = {
            ...quotation.negotiation,
            clientNotes: reason,
            isActive: true
        };

        // Add to audit log (statusHistory)
        quotation.statusHistory.push({
            status: 'NEGOTIATION_REQUESTED',
            changedBy: req.user ? req.user.id : quotation.clientId,
            reason: `Client requested revision: ${reason}`,
            timestamp: new Date()
        });

        await quotation.save();

        // Notify Admin/Manager about the negotiation request
        if (quotation.managerId) {
            await Notification.createNotification({
                recipientId: quotation.managerId,
                title: 'Negotiation Requested',
                message: `Client has requested a revision for quotation ${quotation.quotationNumber}. Reason: ${reason}`,
                type: 'warning',
                category: 'quotation',
                relatedId: quotation._id,
                relatedModel: 'Quotation',
            });
        }

        res.json({
            message: 'Revision request submitted successfully',
            quotation,
            negotiation: quotation.negotiation
        });
    } catch (error) {
        console.error('Request Revision Error:', error);
        res.status(500).json({ message: 'Failed to request revision', error: error.message });
    }
};

// ============================================
// Client Accepts Quotation (REFINED - PHASE 4)
// ============================================
exports.acceptByClient = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // ============================================
        // PHASE 4: STRICT VALIDATION CHECKS
        // ============================================

        // Check 1: Status must be QUOTATION_SENT
        if (quotation.status !== 'QUOTATION_SENT') {
            return res.status(400).json({
                message: 'Cannot accept this quotation',
                error: `Current status is ${quotation.status}. Only sent quotations can be accepted.`,
                currentStatus: quotation.status
            });
        }

        // Check 2: Expiry validation - Ensure validUntil has NOT passed
        const now = new Date();
        if (quotation.validUntil && new Date(quotation.validUntil) < now) {
            return res.status(400).json({
                message: 'Cannot accept an expired quotation',
                error: 'This quotation has passed its validity date. Please contact us for a new quote.',
                validUntil: quotation.validUntil,
                expired: true
            });
        }

        // ============================================
        // STATE CHANGE: ACCEPTED
        // ============================================

        // Update to ACCEPTED status first
        quotation.isAcceptedByClient = true;
        quotation.clientAcceptedAt = new Date();
        quotation.status = 'ACCEPTED';

        // Add to audit log
        quotation.statusHistory.push({
            status: 'ACCEPTED',
            changedBy: req.user ? req.user.id : quotation.clientId,
            reason: 'Client accepted quotation',
            timestamp: new Date()
        });

        await quotation.save();

        // ============================================
        // TRIGGER: AUTOMATICALLY CREATE SHIPMENT
        // ============================================

        const packageCount = quotation.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

        const newShipment = new Shipment({
            quotationId: quotation._id,
            clientId: quotation.clientId,
            managerId: quotation.managerId,
            origin: {
                city: quotation.origin.city,
                country: quotation.origin.country,
                address: `${quotation.origin.addressLine}, ${quotation.origin.state || ''} ${quotation.origin.zip || ''}`.trim(),
            },
            destination: {
                city: quotation.destination.city,
                country: quotation.destination.country,
                address: `${quotation.destination.addressLine}, ${quotation.destination.state || ''} ${quotation.destination.zip || ''}`.trim(),
            },
            packageCount: packageCount,
            shippingCost: quotation.totalAmount,
            status: 'Processing',
        });

        const savedShipment = await newShipment.save();

        // ============================================
        // FINAL STATE: BOOKED (Lock it permanently)
        // ============================================

        quotation.status = 'BOOKED';
        quotation.statusHistory.push({
            status: 'BOOKED',
            changedBy: null, // System
            reason: `Shipment created: ${savedShipment.trackingNumber}`,
            timestamp: new Date()
        });

        await quotation.save();

        // Notify manager
        await Notification.createNotification({
            recipientId: quotation.managerId,
            title: 'Quotation Accepted & Booked',
            message: `Client has accepted quotation ${quotation.quotationNumber}. Shipment created: ${savedShipment.trackingNumber}. Quotation is now locked.`,
            type: 'success',
            category: 'quotation',
            relatedId: quotation._id,
            relatedModel: 'Quotation',
        });

        res.json({
            message: 'Quotation accepted, shipment created, and booking confirmed',
            quotation,
            trackingNumber: savedShipment.trackingNumber,
            shipmentId: savedShipment._id,
            status: 'BOOKED'
        });
    } catch (error) {
        console.error('Accept By Client Error:', error);
        res.status(500).json({ message: 'Failed to accept quotation', error: error.message });
    }
};

// ============================================
// client app rejects quotation
// ============================================
exports.rejectByClient = async (req, res) => {
    try {
        const { reason } = req.body;
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        await quotation.rejectByClient(reason);

        // Notify manager
        await Notification.createNotification({
            recipientId: quotation.managerId,
            title: 'Quotation Rejected',
            message: `client app has rejected quotation ${quotation.quotationNumber}. Reason: ${reason || 'Not specified'}`,
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
        console.error('Reject By client app Error:', error);
        res.status(500).json({ message: 'Failed to reject quotation', error: error.message });
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
// Approve Request (Manager)
// ============================================
exports.approveRequest = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        quotation.status = 'VERIFIED';
        await quotation.save();

        // Notify client
        await Notification.createNotification({
            recipientId: quotation.clientId,
            title: 'Request Approved',
            message: 'Request Approved. Please add your address details.',
            type: 'success',
            category: 'quotation',
            relatedId: quotation._id,
            relatedModel: 'Quotation',
        });

        res.json({
            message: 'Request approved successfully',
            quotation,
        });
    } catch (error) {
        console.error('Approve Request Error:', error);
        res.status(500).json({ message: 'Failed to approve request', error: error.message });
    }
};

// ============================================
// Update Address (Client)
// ============================================
exports.updateAddress = async (req, res) => {
    try {
        const { origin, destination } = req.body;
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        if (origin) quotation.origin = origin;
        if (destination) quotation.destination = destination;

        quotation.status = 'PENDING_REVIEW';
        const updatedQuotation = await quotation.save();

        res.json({
            message: 'Address details submitted successfully',
            quotation: updatedQuotation,
        });
    } catch (error) {
        console.error('Update Address Error:', error);
        res.status(500).json({ message: 'Failed to update address', error: error.message });
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

        // Update addresses in quotation directly
        if (pickupAddress) quotation.origin = pickupAddress;
        if (deliveryAddress) quotation.destination = deliveryAddress;

        // Update Quotation status
        quotation.status = 'BOOKED';

        // Also mark as accepted if not already (legacy compatibility)
        if (!quotation.isAcceptedByClient) {
            quotation.isAcceptedByClient = true;
            quotation.clientAcceptedAt = new Date();
        }

        await quotation.save();

        // Notify manager
        try {
            if (quotation.managerId) {
                await Notification.createNotification({
                    recipientId: quotation.managerId,
                    title: 'Address Confirmed',
                    message: `client app has confirmed address details for quotation ${quotation.quotationNumber}. Ready for pickup.`,
                    type: 'info',
                    category: 'quotation',
                    relatedId: quotation._id,
                    relatedModel: 'Quotation',
                });
            }
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

// ============================================
// Get Quotation Stats
// ============================================
exports.getQuotationStats = async (req, res) => {
    try {
        const stats = await Quotation.aggregate([
            {
                $facet: {
                    totalRequests: [
                        { $count: "count" }
                    ],
                    pendingRequests: [
                        { $match: { status: 'PENDING_REVIEW' } },
                        { $count: "count" }
                    ],
                    totalQuotations: [
                        { $match: { status: { $ne: 'PENDING_REVIEW' } } },
                        { $count: "count" }
                    ],
                    pendingQuotations: [
                        { $match: { status: { $in: ['VERIFIED', 'Pending Approval', 'QUOTATION_SENT'] } } },
                        { $count: "count" }
                    ],
                    acceptedQuotations: [
                        { $match: { status: { $in: ['ACCEPTED', 'BOOKED', 'shipped', 'delivered'] } } },
                        { $count: "count" }
                    ]
                }
            },
            {
                $project: {
                    totalRequests: { $ifNull: [{ $arrayElemAt: ["$totalRequests.count", 0] }, 0] },
                    pendingRequests: { $ifNull: [{ $arrayElemAt: ["$pendingRequests.count", 0] }, 0] },
                    totalQuotations: { $ifNull: [{ $arrayElemAt: ["$totalQuotations.count", 0] }, 0] },
                    pendingQuotations: { $ifNull: [{ $arrayElemAt: ["$pendingQuotations.count", 0] }, 0] },
                    acceptedQuotations: { $ifNull: [{ $arrayElemAt: ["$acceptedQuotations.count", 0] }, 0] }
                }
            }
        ]);

        res.json(stats[0]);
    } catch (error) {
        console.error('Get Quotation Stats Error:', error);
        res.status(500).json({ message: 'Failed to fetch quotation statistics', error: error.message });
    }
};

// ============================================
// Request Clarification (Admin/Manager)
// ============================================
exports.requestClarification = async (req, res) => {
    try {
        const { message } = req.body;
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Check if user is authorized (Manager/Admin)
        // Assuming req.user is populated by middleware
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ message: 'Not authorized to request clarification' });
        }

        quotation.status = 'INFO_REQUIRED';

        // Update negotiation field
        quotation.negotiation = {
            ...quotation.negotiation,
            adminResponse: message,
            isActive: true
        };

        // Add to history
        quotation.statusHistory.push({
            status: 'INFO_REQUIRED',
            changedBy: req.user.id,
            reason: message,
            timestamp: new Date()
        });

        await quotation.save();

        // Notify Client
        await Notification.createNotification({
            recipientId: quotation.clientId,
            title: 'Action Required',
            message: 'Admin has requested more information for your quotation request.',
            type: 'warning',
            category: 'quotation',
            relatedId: quotation._id,
            relatedModel: 'Quotation'
        });

        res.json({
            message: 'Clarification requested successfully',
            quotation
        });
    } catch (error) {
        console.error('Request Clarification Error:', error);
        res.status(500).json({ message: 'Failed to request clarification', error: error.message });
    }
};

// ============================================
// Submit Clarification (Client)
// ============================================
exports.submitClarification = async (req, res) => {
    try {
        const { items, specialInstructions, clientNotes } = req.body;
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Update items and special instructions if provided
        if (items) quotation.items = items;
        if (specialInstructions) quotation.specialInstructions = specialInstructions;

        // Update negotiation.clientNotes
        quotation.negotiation = {
            ...quotation.negotiation,
            clientNotes: clientNotes,
            isActive: true
        };

        // Change status back to PENDING_REVIEW
        quotation.status = 'PENDING_REVIEW';

        // Add to history
        quotation.statusHistory.push({
            status: 'PENDING_REVIEW',
            changedBy: req.user.id,
            reason: 'Client submitted clarification',
            timestamp: new Date()
        });

        await quotation.save();

        // Notify Manager
        if (quotation.managerId) {
            await Notification.createNotification({
                recipientId: quotation.managerId,
                title: 'Clarification Submitted',
                message: 'Client has updated the quotation request details.',
                type: 'info',
                category: 'quotation',
                relatedId: quotation._id,
                relatedModel: 'Quotation'
            });
        }

        res.json({
            message: 'Clarification submitted successfully',
            quotation
        });
    } catch (error) {
        console.error('Submit Clarification Error:', error);
        res.status(500).json({ message: 'Failed to submit clarification', error: error.message });
    }
};

// ============================================
// Mark as Verified (Manager/Dispatcher) - PHASE 3
// ============================================
exports.markAsVerified = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Check permission (Admin/Manager/Dispatcher)
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            // In a real scenario, you'd check for 'dispatcher' role too
            return res.status(403).json({ message: 'Not authorized to verify requests' });
        }

        quotation.status = 'VERIFIED';

        // Add to history
        quotation.statusHistory.push({
            status: 'VERIFIED',
            changedBy: req.user.id,
            reason: 'Request verified by operations',
            timestamp: new Date()
        });

        await quotation.save();

        res.json({
            message: 'Quotation request verified',
            quotation
        });
    } catch (error) {
        console.error('Mark as Verified Error:', error);
        res.status(500).json({ message: 'Failed to verify quotation', error: error.message });
    }
};

// ============================================
// Save as Draft (Client) - DRAFT FUNCTIONALITY
// ============================================
exports.saveAsDraft = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            origin,
            destination,
            items,
            pickupDate,
            deliveryDate,
            cargoType,
            serviceType,
            specialInstructions,
            productPhotos,
            validUntil,
            termsAndConditions,
            additionalNotes
        } = req.body;

        // For drafts, we allow partial data
        // Minimum requirement: at least clientId (which comes from auth)
        // Everything else is optional for drafts

        const draftData = {
            clientId: userId,
            status: 'DRAFT', // CRUCIAL: Always set to DRAFT regardless of input
        };

        // Add optional fields only if they exist
        if (origin) draftData.origin = origin;
        if (destination) draftData.destination = destination;
        if (items && Array.isArray(items) && items.length > 0) draftData.items = items;
        if (pickupDate) draftData.pickupDate = pickupDate;
        if (deliveryDate) draftData.deliveryDate = deliveryDate;
        if (cargoType) draftData.cargoType = cargoType;
        if (serviceType) draftData.serviceType = serviceType;
        if (specialInstructions) draftData.specialInstructions = specialInstructions;
        if (productPhotos) draftData.productPhotos = productPhotos;
        if (validUntil) draftData.validUntil = validUntil;
        if (termsAndConditions) draftData.termsAndConditions = termsAndConditions;
        if (additionalNotes) draftData.additionalNotes = additionalNotes;

        const newDraft = new Quotation(draftData);

        // Initialize statusHistory for the draft
        newDraft.statusHistory = [{
            status: 'DRAFT',
            changedBy: userId,
            reason: 'Draft created by client',
            timestamp: new Date()
        }];

        const savedDraft = await newDraft.save();

        res.status(201).json({
            message: 'Draft saved successfully',
            quotation: savedDraft,
        });
    } catch (error) {
        console.error('Save Draft Error:', error);
        res.status(400).json({
            message: 'Failed to save draft',
            error: error.message
        });
    }
};

// ============================================
// Submit Quotation (Transition DRAFT → PENDING_REVIEW)
// ============================================
exports.submitQuotation = async (req, res) => {
    try {
        const quotationId = req.params.id;
        const userId = req.user.id;

        const quotation = await Quotation.findById(quotationId);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Check 1: Verify ownership (only the client who created it can submit)
        if (quotation.clientId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Not authorized to submit this quotation',
                error: 'You can only submit your own quotations'
            });
        }

        // Check 2: Current status must be DRAFT
        if (quotation.status !== 'DRAFT') {
            return res.status(400).json({
                message: 'Cannot submit this quotation',
                error: `Current status is ${quotation.status}. Only drafts can be submitted.`,
                currentStatus: quotation.status
            });
        }

        // Check 3: Validate all required fields are present
        const validationErrors = [];

        if (!quotation.origin || !quotation.origin.city || !quotation.origin.country) {
            validationErrors.push('Origin address is incomplete (city and country required)');
        }

        if (!quotation.destination || !quotation.destination.city || !quotation.destination.country) {
            validationErrors.push('Destination address is incomplete (city and country required)');
        }

        if (!quotation.items || !Array.isArray(quotation.items) || quotation.items.length === 0) {
            validationErrors.push('At least one item is required');
        }

        if (!quotation.cargoType) {
            validationErrors.push('Cargo type is required');
        }

        // If there are validation errors, return them
        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: 'Quotation validation failed',
                errors: validationErrors,
                hint: 'Please complete all required fields before submitting'
            });
        }

        // All validations passed - transition to PENDING_REVIEW
        quotation.status = 'PENDING_REVIEW';

        // Add to audit log (statusHistory)
        quotation.statusHistory.push({
            status: 'PENDING_REVIEW',
            changedBy: userId,
            reason: 'Client submitted quotation for review',
            timestamp: new Date()
        });

        await quotation.save();

        // Optional: Notify managers about new submission
        try {
            // You can add notification logic here if needed
            // await Notification.createNotificationForManagers({...});
        } catch (notifError) {
            console.error('Failed to send notification:', notifError);
            // Don't fail the request if notification fails
        }

        res.json({
            message: 'Quotation submitted successfully',
            quotation,
            status: 'PENDING_REVIEW'
        });
    } catch (error) {
        console.error('Submit Quotation Error:', error);
        res.status(500).json({
            message: 'Failed to submit quotation',
            error: error.message
        });
    }
};

// ============================================
// Check & Update Expired Quotations (Job) - PHASE 3
// ============================================
exports.checkExpiry = async () => {
    try {
        const now = new Date();

        // Find quotations that ARE 'QUOTATION_SENT' AND expired
        const expiredQuotations = await Quotation.find({
            status: 'QUOTATION_SENT',
            validUntil: { $lt: now }
        });

        if (expiredQuotations.length === 0) {
            return; // No expired quotations found
        }

        console.log(`Found ${expiredQuotations.length} expired quotations. Updating status...`);

        for (const quote of expiredQuotations) {
            quote.status = 'EXPIRED';
            quote.statusHistory.push({
                status: 'EXPIRED',
                changedBy: null, // System
                reason: 'Validity date passed',
                timestamp: now
            });
            await quote.save();

            // Optional: Notify manager or client about expiry
        }
    } catch (error) {
        console.error('Check Expiry Job Error:', error);
    }
};