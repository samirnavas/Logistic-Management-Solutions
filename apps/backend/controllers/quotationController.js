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
            status: 'request_sent',
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

        // Automatically update status to 'cost_calculated' if manager updates price/items
        // and current status is 'request_sent'
        if (quotation.status === 'request_sent' && (req.body.totalAmount !== undefined || req.body.items !== undefined)) {
            // Ensure we don't accidentally set it if the manager explicitly set it to something else in this same update (though unlikely via this logic)
            if (!req.body.status) {
                quotation.status = 'cost_calculated';
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

        // Set status to 'cost_calculated' (intermediate) or whatever was passed
        // This ensures the quotation is marked as processed but not yet "Approved" or "Sent" fully unless workflow dictates
        quotation.status = status || 'cost_calculated';

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

        quotation.status = 'rejected';
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
};  // Note: This is a simplified Indian numbering system version based on "Rupees" in prompt sample. 
// If international is needed, standard billion/million logic should be used. 
// Given "Rupees" in the prompt image text ("Ninety Thousand... Rupees Only"), I will use a standard English approach but "Rupees" label is in the template.

// ============================================
// Send quotation to client app
// ============================================
exports.sendToClient = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id)
            .populate('clientId', 'fullName email customerCode phone')
            .populate('managerId', 'fullName email');

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // 1. Prepare Data for PDF
        // Filter items for the table (Goods) vs Charges
        // Assuming 'Freight', 'Insurance', 'Packaging', 'Handling', 'Tax' are charges
        const chargeCategories = ['freight', 'insurance', 'packaging', 'handling', 'tax'];

        const goodsItems = quotation.items.filter(item => !chargeCategories.includes(item.category.toLowerCase()));

        // Calculate charges from items or use specific fields if logic dictates
        // The prompt says: "Cost Breakdown: ... Shipping Charge, Pickup, Packaging, Insurance, Taxes."
        const getCharge = (cat) => quotation.items
            .filter(i => i.category.toLowerCase() === cat)
            .reduce((sum, i) => sum + (i.amount || 0), 0);

        const shippingCharge = getCharge('freight');
        const pickupCharge = getCharge('handling'); // Assuming handling maps to pickup or similar
        const packagingCharge = getCharge('packaging');
        const insuranceCharge = getCharge('insurance');

        // Format Currency
        const formatCurrency = (amount) => {
            return amount.toLocaleString('en-IN', { maximumFractionDigits: 2 }); // Indian formatting as per sample
        };

        const pdfData = {
            clientName: quotation.clientId.fullName,
            clientAddress: `${quotation.destination.addressLine}, ${quotation.destination.city}`,
            clientPhone: quotation.clientId.phone || quotation.destination.phone || '',
            quotationId: quotation.quotationNumber,
            date: new Date(quotation.createdAt).toLocaleDateString('en-GB'), // DD/MM/YYYY
            validityDate: new Date(quotation.validUntil).toLocaleDateString('en-GB'),
            items: goodsItems.map((item, index) => ({
                index: index + 1,
                image: item.images && item.images.length > 0 ? item.images[0] : null,
                category: item.category,
                description: item.description,
                hsCode: '8320', // Placeholder or add field to model if needed. 
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
        await quotation.sendToClient(); // This sets status='sent' and saves

        // Create notification for client app
        await Notification.createQuotationNotification(
            quotation.clientId._id, // Ensure ID is passed
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
// client app accepts quotation
// ============================================
exports.acceptByClient = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        await quotation.acceptByClient();

        // Create Shipment automatically
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

        // Notify manager
        await Notification.createNotification({
            recipientId: quotation.managerId,
            title: 'Quotation Accepted',
            message: `client app has accepted quotation ${quotation.quotationNumber}. Shipment created: ${savedShipment.trackingNumber}`,
            type: 'success',
            category: 'quotation',
            relatedId: quotation._id,
            relatedModel: 'Quotation',
        });

        res.json({
            message: 'Quotation accepted and shipment created',
            quotation,
            trackingNumber: savedShipment.trackingNumber,
            shipmentId: savedShipment._id
        });
    } catch (error) {
        console.error('Accept By client app Error:', error);
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

        quotation.status = 'approved';
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

        quotation.status = 'details_submitted';
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
        quotation.status = 'ready_for_pickup';

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
                        { $match: { status: 'request_sent' } },
                        { $count: "count" }
                    ],
                    totalQuotations: [
                        { $match: { status: { $ne: 'request_sent' } } },
                        { $count: "count" }
                    ],
                    pendingQuotations: [
                        { $match: { status: { $in: ['cost_calculated', 'Pending Approval', 'Sent'] } } },
                        { $count: "count" }
                    ],
                    acceptedQuotations: [
                        { $match: { status: { $in: ['Accepted', 'ready_for_pickup', 'shipped', 'delivered'] } } },
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
