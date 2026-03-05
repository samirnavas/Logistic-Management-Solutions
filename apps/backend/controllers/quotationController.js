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
// Get Quotation Statistics (Dashboard)
// ============================================
exports.getStats = async (req, res) => {
    try {
        const [
            totalRequests,
            pendingRequests,
            totalQuotations,
            pendingQuotations,
            acceptedQuotations
        ] = await Promise.all([
            // 1. Total Requests: All submitted quotations (excluding drafts)
            Quotation.countDocuments({ status: { $ne: 'DRAFT' } }),

            // 2. Pending Requests: Requests waiting for admin action
            //    PENDING_ADMIN_REVIEW  → new submission or customer revision sent back
            //    AWAITING_FINAL_CHARGE_SHEET → customer accepted, admin must add mile charges
            Quotation.countDocuments({
                status: { $in: ['PENDING_ADMIN_REVIEW', 'AWAITING_FINAL_CHARGE_SHEET'] }
            }),

            // 3. Total Quotations: Quotes where pricing has been generated at least once
            Quotation.countDocuments({
                status: {
                    $in: [
                        'PENDING_CUSTOMER_APPROVAL',
                        'AWAITING_FINAL_CHARGE_SHEET',
                        'PAYMENT_PENDING',
                        'CONVERTED_TO_SHIPMENT',
                        'REJECTED',
                    ]
                }
            }),

            // 4. Pending Quotations: Sent to client, awaiting their decision
            Quotation.countDocuments({
                status: { $in: ['PENDING_CUSTOMER_APPROVAL', 'PAYMENT_PENDING'] }
            }),

            // 5. Accepted / Converted Quotations
            Quotation.countDocuments({
                status: { $in: ['CONVERTED_TO_SHIPMENT'] }
            })
        ]);

        res.json({
            totalRequests,
            pendingRequests,
            totalQuotations,
            pendingQuotations,
            acceptedQuotations
        });
    } catch (error) {
        console.error('Get Stats Error:', error);
        res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
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
            specialInstructions,
            handoverMethod,
            pickupAddress,
            warehouseDropOffLocation,
            currency
            // Explicitly excluding 'status' from destructuring to prevent it from being passed
        } = req.body;

        // Validation for critical fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Missing required fields or invalid items format',
                required: ['items (array)']
            });
        }

        // Conditional validation for Origin/Destination based on handover method
        // (Handled by Mongoose schema validation)

        // Validate currency
        const allowedCurrencies = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'AED', 'INR'];
        const resolvedCurrency = allowedCurrencies.includes(currency) ? currency : 'USD';

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
            handoverMethod,
            pickupAddress,
            warehouseDropOffLocation,
            currency: resolvedCurrency,
            status: 'PENDING_ADMIN_REVIEW', // Strict Default
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
// Update Quotation (Debugged & Fixed v2)
// ============================================
exports.updateQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        let updateData = { ...req.body };

        console.log('\n========== UPDATE QUOTATION REQUEST ==========');
        console.log('[1] Quotation ID:', id);
        console.log('[2] User Role:', req.user.role);
        console.log('[3] Request Body:', JSON.stringify(updateData, null, 2));

        // 1. Fetch Current State
        const currentQuotation = await Quotation.findById(id);
        if (!currentQuotation) {
            console.log('[ERROR] Quotation not found!');
            return res.status(404).json({ message: 'Quotation not found' });
        }

        console.log('[4] Current Status in DB:', currentQuotation.status);
        console.log('[5] Current Handover Method:', currentQuotation.handoverMethod);

        // 2. CLIENT LOGIC
        // FIX: Handle both 'client' and 'client app' role values
        const isClient = req.user.role === 'client' || req.user.role === 'client app';

        if (isClient) {
            console.log('[6] Processing CLIENT update...');

            // A) HANDLING DROP-OFF vs PICKUP
            if (updateData.handoverMethod === 'DROP_OFF') {
                console.log('[7] ✓ DROP_OFF detected - Setting placeholder pickup address');
                updateData.pickupAddress = 'CLIENT WILL DROP OFF AT WAREHOUSE';
            } else {
                console.log('[7] Handover method is:', updateData.handoverMethod || 'not changing');
            }

            // B) FORCE STATUS UPDATE
            // NOTE: 'APPROVED' is NOT in the enum - only 'VERIFIED' exists
            console.log('[8] Checking if should update status...');
            console.log('    Current status:', currentQuotation.status);
            console.log('    Is VERIFIED?', currentQuotation.status === 'VERIFIED');

            if (currentQuotation.status === 'VERIFIED') {
                console.log('[9] ✓✓✓ VERIFIED status confirmed - FORCING status to ADDRESS_PROVIDED');
                updateData.status = 'ADDRESS_PROVIDED';
            }
            // C) SECURITY: Prevent changing status if not in Draft/Info phase
            else if (currentQuotation.status !== 'DRAFT' && currentQuotation.status !== 'INFO_REQUIRED') {
                console.log('[9] ✗ Not in editable status - Removing any status field from update');
                delete updateData.status;
            } else {
                console.log('[9] Status is editable (DRAFT or INFO_REQUIRED)');
            }
        } else {
            console.log('[6] Processing ADMIN/MANAGER update (no special logic)');
        }

        console.log('[10] Final update data:', JSON.stringify(updateData, null, 2));

        // 3. Perform Update
        const updatedQuotation = await Quotation.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: false }
        );

        if (!updatedQuotation) {
            console.log('[ERROR] Update returned null!');
            return res.status(500).json({ message: 'Update failed - no document returned' });
        }

        console.log('[11] ✅ UPDATE SUCCESSFUL');
        console.log('     New Status:', updatedQuotation.status);
        console.log('     New Handover Method:', updatedQuotation.handoverMethod);
        console.log('     Pickup Address:', updatedQuotation.pickupAddress);
        console.log('==============================================\n');

        res.status(200).json(updatedQuotation);
    } catch (error) {
        console.error('[CRITICAL ERROR] Update failed:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: 'Update failed', error: error.message });
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
        if (items) {
            // Fix: Preserve existing goods items and append new charge items
            // because frontend only sends the financial breakdown items under updateQuotePrice.
            const chargeCategories = ['freight', 'insurance', 'packaging', 'handling', 'tax', 'other'];
            const preservedGoodsItems = (quotation.items || []).filter(item => {
                const cat = (item.category || '').toLowerCase();
                return !chargeCategories.includes(cat);
            });
            quotation.items = [...preservedGoodsItems, ...items];
        }

        if (taxRate !== undefined) quotation.taxRate = Number(taxRate) || 0;
        if (discount !== undefined) quotation.discount = Math.max(0, Number(discount) || 0); // Clamp: shield against floating-point negatives
        if (internalNotes !== undefined) quotation.internalNotes = internalNotes;
        if (additionalNotes !== undefined) quotation.additionalNotes = additionalNotes;
        if (validUntil !== undefined) quotation.validUntil = validUntil;

        // Set status - use passed status or default to QUOTATION_GENERATED (pricing has been calculated)
        quotation.status = status || 'QUOTATION_GENERATED';

        // Recalculate totals
        quotation.calculateTotals();

        const updatedQuotation = await quotation.save();

        res.json({
            message: 'Quotation price updated successfully',
            quotation: updatedQuotation,
        });
    } catch (error) {
        console.error('Update Quote Price Error:', error);
        require('fs').writeFileSync('C:/Programming/Logistic-Management-Solutions/apps/backend/error-log.json', JSON.stringify({ message: error.message, stack: error.stack, errors: error.errors, requestBody: req.body }, null, 2));
        res.status(400).json({ message: 'Failed to update quotation price', error: error.message, details: error.errors });
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

        quotation.status = 'PENDING_CUSTOMER_APPROVAL';
        quotation.isApprovedByManager = true;
        quotation.managerApprovedAt = new Date();
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
// Update Address (Client) - FIXED FOR DROP-OFF
// ============================================
exports.updateAddress = async (req, res) => {
    try {
        console.log('\n========== UPDATE ADDRESS REQUEST ==========');
        console.log('[Address Update] ID:', req.params.id);
        console.log('[Address Update] Body:', JSON.stringify(req.body, null, 2));

        const { origin, destination, handoverMethod, warehouseDropOffLocation } = req.body;
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            console.log('[Address Update] ERROR: Quotation not found');
            return res.status(404).json({ message: 'Quotation not found' });
        }

        console.log('[Address Update] Current Status:', quotation.status);
        console.log('[Address Update] Current Handover Method:', quotation.handoverMethod);

        // Update address fields
        if (origin) {
            console.log('[Address Update] Updating origin address');
            quotation.origin = origin;
        }
        if (destination) {
            console.log('[Address Update] Updating destination address');
            quotation.destination = destination;
        }

        // Handle handover method change
        if (handoverMethod) {
            console.log('[Address Update] Handover method:', handoverMethod);
            quotation.handoverMethod = handoverMethod;

            // CRITICAL FIX: If Drop-off, set placeholder pickup address
            if (handoverMethod === 'DROP_OFF') {
                console.log('[Address Update] ✓ DROP_OFF detected - Setting placeholder pickup address');
                quotation.pickupAddress = 'CLIENT WILL DROP OFF AT WAREHOUSE';
            }
        }

        // Handle warehouse location for drop-off
        if (warehouseDropOffLocation) {
            console.log('[Address Update] Setting warehouse drop-off location');
            quotation.warehouseDropOffLocation = warehouseDropOffLocation;
        }

        // CRITICAL FIX: Don't hardcode PENDING_ADMIN_REVIEW!
        // Check current status and set appropriate next status
        if (quotation.status === 'VERIFIED') {
            console.log('[Address Update] ✓✓✓ Status is VERIFIED - Moving to ADDRESS_PROVIDED');
            quotation.status = 'ADDRESS_PROVIDED';
        } else if (quotation.status === 'DRAFT' || quotation.status === 'INFO_REQUIRED') {
            console.log('[Address Update] Status is editable - Moving to PENDING_ADMIN_REVIEW');
            quotation.status = 'PENDING_ADMIN_REVIEW';
        } else {
            console.log('[Address Update] Status unchanged -', quotation.status);
        }

        const updatedQuotation = await quotation.save();

        console.log('[Address Update] ✅ SUCCESS');
        console.log('[Address Update] New Status:', updatedQuotation.status);
        console.log('[Address Update] New Handover Method:', updatedQuotation.handoverMethod);
        console.log('==============================================\n');

        res.json({
            message: 'Address details submitted successfully',
            quotation: updatedQuotation,
        });
    } catch (error) {
        console.error('[Address Update] CRITICAL ERROR:', error);
        console.error('Stack trace:', error.stack);
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
                        { $match: { status: 'PENDING_ADMIN_REVIEW' } },
                        { $count: "count" }
                    ],
                    totalQuotations: [
                        { $match: { status: { $ne: 'PENDING_ADMIN_REVIEW' } } },
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

        // Change status back to PENDING_ADMIN_REVIEW
        quotation.status = 'PENDING_ADMIN_REVIEW';

        // Add to history
        quotation.statusHistory.push({
            status: 'PENDING_ADMIN_REVIEW',
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
        quotation.isApprovedByManager = true;
        quotation.managerApprovedAt = new Date();

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
// Submit Quotation (Transition DRAFT → PENDING_ADMIN_REVIEW)
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

        // IMPORTANT: Update quotation data if provided in request body
        const {
            origin,
            destination,
            items,
            pickupDate,
            deliveryDate,
            cargoType,
            serviceType,
            specialInstructions,
            productPhotos
        } = req.body;

        // Update fields if provided
        if (origin) quotation.origin = origin;
        if (destination) quotation.destination = destination;
        if (items && Array.isArray(items)) quotation.items = items;
        if (pickupDate) quotation.pickupDate = pickupDate;
        if (deliveryDate) quotation.deliveryDate = deliveryDate;
        if (cargoType) quotation.cargoType = cargoType;
        if (serviceType) quotation.serviceType = serviceType;
        if (specialInstructions) quotation.specialInstructions = specialInstructions;
        if (productPhotos) quotation.productPhotos = productPhotos;

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

        // All validations passed - transition to PENDING_ADMIN_REVIEW
        quotation.status = 'PENDING_ADMIN_REVIEW';

        // Add to audit log (statusHistory)
        quotation.statusHistory.push({
            status: 'PENDING_ADMIN_REVIEW',
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
            status: 'PENDING_ADMIN_REVIEW'
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

        // Find quotes that are awaiting the customer's decision and have passed validUntil.
        // In the new workflow REJECTED is the terminal state for expired quotes.
        const expiredQuotations = await Quotation.find({
            status: 'PENDING_CUSTOMER_APPROVAL',
            validUntil: { $lt: now }
        });

        if (expiredQuotations.length === 0) {
            return;
        }

        console.log(`Found ${expiredQuotations.length} expired quotations. Marking as REJECTED...`);

        for (const quote of expiredQuotations) {
            quote.status = 'REJECTED';
            quote.statusHistory.push({
                status: 'REJECTED',
                changedBy: null, // System
                reason: 'Validity date passed — quotation expired automatically',
                timestamp: now
            });
            await quote.save();

            // Optional: Notify client about expiry
        }
    } catch (error) {
        console.error('Check Expiry Job Error:', error);
    }
};
// ============================================
// Send Warehouse Details (Admin Only)
// ============================================
exports.sendWarehouseDetails = async (req, res) => {
    try {
        const { locationMessage } = req.body;
        const quotationId = req.params.id;

        // Authorization check - Admin only
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                message: 'Not authorized to send warehouse details',
                error: 'Only admin or manager can send warehouse details'
            });
        }

        // Validate locationMessage
        if (!locationMessage || locationMessage.trim().length === 0) {
            return res.status(400).json({
                message: 'Location message is required',
                error: 'Please provide warehouse location and instructions'
            });
        }

        const quotation = await Quotation.findById(quotationId);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Update warehouseDropOffLocation
        quotation.warehouseDropOffLocation = locationMessage;

        // Add to audit log
        quotation.statusHistory.push({
            status: quotation.status, // Keep current status
            changedBy: req.user.id,
            reason: 'Warehouse drop-off details provided',
            timestamp: new Date()
        });

        await quotation.save();

        // Notify Client
        await Notification.createNotification({
            recipientId: quotation.clientId,
            title: 'Warehouse Drop-off Details Received',
            message: `Warehouse drop-off location and instructions have been provided for your quotation ${quotation.quotationNumber}.`,
            type: 'info',
            category: 'quotation',
            relatedId: quotation._id,
            relatedModel: 'Quotation'
        });

        res.json({
            message: 'Warehouse details sent successfully',
            quotation,
            warehouseDropOffLocation: quotation.warehouseDropOffLocation
        });
    } catch (error) {
        console.error('Send Warehouse Details Error:', error);
        res.status(500).json({
            message: 'Failed to send warehouse details',
            error: error.message
        });
    }
};

// ================================================================
// ===  ITERATIVE QUOTATION WORKFLOW  —  5 STATE-MACHINE ACTIONS ===
// ================================================================

/**
 * Helper — push a status-history entry without a full save.
 * Call this before the caller's own quote.save().
 */
function pushHistory(quotation, status, userId, reason) {
    quotation.statusHistory.push({
        status,
        changedBy: userId || null,
        reason,
        timestamp: new Date(),
    });
}

// ----------------------------------------------------------------
// 1. CREATE DRAFT QUOTATION  (Customer — Phase 1)
//    Accepts routingData + items.  Defaults to PENDING_ADMIN_REVIEW.
// ----------------------------------------------------------------
exports.createDraftQuotation = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            routingData,
            items,
            cargoType,
            serviceType,
            serviceMode,
            specialInstructions,
            productPhotos,
            additionalNotes,
            validUntil,
            currency,  // Client-chosen global currency (USD / AED / INR / EUR …)
        } = req.body;

        // --- Validate routingData minimum fields ---
        if (
            !routingData ||
            !routingData.sourceCity ||
            !routingData.destinationCity
        ) {
            return res.status(400).json({
                message: 'routingData is required with at least sourceCity and destinationCity',
                required: ['routingData.sourceCity', 'routingData.destinationCity'],
            });
        }

        // --- Items are encouraged but not mandatory at Phase 1 ---
        if (items && (!Array.isArray(items) || items.some(i => !i.description || !i.quantity))) {
            return res.status(400).json({
                message: 'Each item must have at minimum a description and a quantity',
            });
        }

        // Validate currency if provided (falls back to schema default 'USD')
        const allowedCurrencies = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'AED', 'INR'];
        const resolvedCurrency = allowedCurrencies.includes(currency) ? currency : 'USD';

        const newQuotation = new Quotation({
            clientId: userId,
            routingData,
            items: items || [],
            cargoType: cargoType || 'General Cargo',
            serviceType: serviceType || 'Standard',
            serviceMode: serviceMode || 'door_to_door',
            specialInstructions: specialInstructions || '',
            productPhotos: productPhotos || [],
            additionalNotes: additionalNotes || '',
            validUntil: validUntil || null,
            currency: resolvedCurrency,
            // Status goes straight to PENDING_ADMIN_REVIEW on first submit.
            // Customers who want to save a pure draft should use the existing
            // saveAsDraft endpoint and then submitQuotation.
            status: 'PENDING_ADMIN_REVIEW',
            totalAmount: 0,
        });

        pushHistory(newQuotation, 'PENDING_ADMIN_REVIEW', userId, 'Customer submitted quotation inquiry');

        const saved = await newQuotation.save();

        // Notify admin/manager that a new inquiry has arrived
        try {
            if (newQuotation.managerId) {
                await Notification.createNotification({
                    recipientId: newQuotation.managerId,
                    title: 'New Quotation Inquiry',
                    message: `New inquiry ${saved.quotationId} received from customer. Routing: ${routingData.sourceCity} → ${routingData.destinationCity}`,
                    type: 'info',
                    category: 'quotation',
                    relatedId: saved._id,
                    relatedModel: 'Quotation',
                });
            }
        } catch (notifErr) {
            console.error('Notification error (non-fatal):', notifErr.message);
        }

        return res.status(201).json({
            message: 'Quotation inquiry submitted successfully',
            quotation: saved,
        });
    } catch (error) {
        console.error('createDraftQuotation Error:', error);
        return res.status(400).json({
            message: 'Failed to create quotation inquiry',
            error: error.message,
            details: error.errors,
        });
    }
};

// ----------------------------------------------------------------
// 2. ADMIN PRICE QUOTATION  (Admin/Manager — Phase 3)
//    Inputs: baseFreightCharge, itemizedCosts, estimatedHandlingFee,
//            taxRate, discount, validUntil, internalNotes
//    Guard:  status must be PENDING_ADMIN_REVIEW
//    Result: PENDING_CUSTOMER_APPROVAL
// ----------------------------------------------------------------
exports.adminPriceQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            baseFreightCharge,
            itemizedCosts,
            estimatedHandlingFee,
            taxRate,
            discount,
            validUntil,
            internalNotes,
            additionalNotes,
            items, // Admin may also refine line-item amounts
        } = req.body;

        const quotation = await Quotation.findById(id);
        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // --- State guard ---
        if (quotation.status !== 'PENDING_ADMIN_REVIEW') {
            return res.status(400).json({
                message: 'Invalid state transition',
                error: `adminPriceQuotation can only be called when status is PENDING_ADMIN_REVIEW. Current status: ${quotation.status}`,
                currentStatus: quotation.status,
                allowedFrom: ['PENDING_ADMIN_REVIEW'],
            });
        }

        // --- Validate that a base freight charge is being provided ---
        if (baseFreightCharge === undefined || baseFreightCharge === null) {
            return res.status(400).json({
                message: 'baseFreightCharge is required to price a quotation',
            });
        }
        if (Number(baseFreightCharge) < 0) {
            return res.status(400).json({ message: 'baseFreightCharge cannot be negative' });
        }

        // --- Apply pricing fields ---
        if (!quotation.pricing) quotation.pricing = {};
        quotation.pricing.baseFreightCharge = Number(baseFreightCharge);

        if (estimatedHandlingFee !== undefined) {
            quotation.pricing.estimatedHandlingFee = Math.max(0, Number(estimatedHandlingFee));
        }
        if (itemizedCosts && Array.isArray(itemizedCosts)) {
            quotation.itemizedCosts = itemizedCosts;
        }
        if (taxRate !== undefined) {
            quotation.taxRate = Math.max(0, Math.min(100, Number(taxRate)));
        }
        if (discount !== undefined) {
            quotation.discount = Math.max(0, Number(discount)); // Clamp — never negative
        }
        if (validUntil !== undefined) quotation.validUntil = validUntil;
        if (internalNotes !== undefined) quotation.internalNotes = internalNotes;
        if (additionalNotes !== undefined) quotation.additionalNotes = additionalNotes;
        if (req.body.pricingNotes !== undefined) quotation.additionalNotes = req.body.pricingNotes;

        // Admin sets shippingCharge per item — declaredValue (commercial value) is NEVER overwritten.
        if (items && Array.isArray(items) && items.length > 0) {
            quotation.items = quotation.items.map((existingItem, i) => {
                const adminInput = items[i] || {};
                return {
                    ...existingItem.toObject(),            // keep all client fields intact
                    shippingCharge: Number(adminInput.shippingCharge ?? adminInput.unitPrice ?? 0),
                    // Also mirror into legacy fields for backward compat
                    unitPrice: Number(adminInput.shippingCharge ?? adminInput.unitPrice ?? 0),
                    amount: Number(adminInput.shippingCharge ?? adminInput.unitPrice ?? 0) * (existingItem.quantity || 1),
                    // declaredValue is NOT updated here — stays as client provided it
                };
            });
        }

        // Mark as approved by this admin
        quotation.isApprovedByManager = true;
        quotation.managerApprovedAt = new Date();
        quotation.managerId = req.user.id;

        // Increment revision counter each time admin re-prices
        quotation.revisionCount = (quotation.revisionCount || 0) + 1;

        // Transition state
        quotation.status = 'PENDING_CUSTOMER_APPROVAL';
        pushHistory(quotation, 'PENDING_CUSTOMER_APPROVAL', req.user.id, 'Admin priced quotation and sent for customer review');

        // calculateTotals() is invoked by pre-save because pricing fields changed.
        const saved = await quotation.save();

        // Notify customer
        try {
            await Notification.createNotification({
                recipientId: quotation.clientId,
                title: 'Quotation Ready for Review',
                message: `Your quotation ${saved.quotationId} has been priced and is ready for your review.`,
                type: 'success',
                category: 'quotation',
                relatedId: saved._id,
                relatedModel: 'Quotation',
            });
        } catch (notifErr) {
            console.error('Notification error (non-fatal):', notifErr.message);
        }

        return res.json({
            message: 'Quotation priced and sent to customer for approval',
            quotation: saved,
        });
    } catch (error) {
        console.error('adminPriceQuotation Error:', error);
        return res.status(400).json({
            message: 'Failed to price quotation',
            error: error.message,
            details: error.errors,
        });
    }
};

// ----------------------------------------------------------------
// 3. CUSTOMER REVISE QUOTATION  (Customer — Phase 3 bounce-back)
//    Customer modifies items/notes and sends back for re-pricing.
//    Guard:  status must be PENDING_CUSTOMER_APPROVAL AND isLocked must be false
//    Result: revisionCount++, status → PENDING_ADMIN_REVIEW
// ----------------------------------------------------------------
exports.customerReviseQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { items, specialInstructions, additionalNotes, revisionNotes } = req.body;

        const quotation = await Quotation.findById(id);
        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // --- Ownership check ---
        if (quotation.clientId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Not authorized',
                error: 'You can only revise your own quotations',
            });
        }

        // --- State guard: must be PENDING_CUSTOMER_APPROVAL ---
        if (quotation.status !== 'PENDING_CUSTOMER_APPROVAL') {
            return res.status(400).json({
                message: 'Invalid state transition',
                error: `customerReviseQuotation can only be called when status is PENDING_CUSTOMER_APPROVAL. Current status: ${quotation.status}`,
                currentStatus: quotation.status,
                allowedFrom: ['PENDING_CUSTOMER_APPROVAL'],
            });
        }

        // --- Lock guard: cannot revise if already locked ---
        if (quotation.isLocked) {
            return res.status(400).json({
                message: 'Quotation is locked',
                error: 'This quotation has already been accepted and locked. You cannot revise a locked quotation.',
                isLocked: true,
            });
        }

        // --- Apply customer changes ---
        if (items && Array.isArray(items) && items.length > 0) {
            // Preserve client fields AND preserve existing admin pricing on each item
            quotation.items = items.map((item, i) => {
                const oldItem = quotation.items && quotation.items.length > i ? quotation.items[i] : {};
                return {
                    ...item,
                    shippingCharge: oldItem.shippingCharge || 0,
                    unitPrice: oldItem.unitPrice || 0,
                    amount: oldItem.amount || 0,
                };
            });
        }
        if (specialInstructions !== undefined) quotation.specialInstructions = specialInstructions;
        if (additionalNotes !== undefined) quotation.additionalNotes = additionalNotes;

        // Log revision notes in negotiation
        quotation.negotiation = {
            ...(quotation.negotiation || {}),
            clientNotes: revisionNotes || '',
            isActive: true,
        };

        // Increment revision counter
        quotation.revisionCount = (quotation.revisionCount || 0) + 1;

        // Reset admin approval — admin must re-price
        quotation.isApprovedByManager = false;
        quotation.managerApprovedAt = undefined;

        // PRESERVE BASE PRICING: Do NOT let the client payload overwrite the pricing object
        // Do not reset baseFreightCharge and estimatedHandlingFee
        if (!quotation.pricing) quotation.pricing = {};

        quotation.itemizedCosts = [];
        quotation.totalAmount = 0;

        // Transition state
        quotation.status = 'PENDING_ADMIN_REVIEW';
        pushHistory(
            quotation,
            'PENDING_ADMIN_REVIEW',
            userId,
            `Customer requested revision (round ${quotation.revisionCount}): ${revisionNotes || 'No notes'}`
        );

        const saved = await quotation.save();

        // Notify admin/manager
        try {
            if (quotation.managerId) {
                await Notification.createNotification({
                    recipientId: quotation.managerId,
                    title: 'Customer Requested Revision',
                    message: `Customer has revised quotation ${saved.quotationId} (revision #${saved.revisionCount}). Please re-price.`,
                    type: 'warning',
                    category: 'quotation',
                    relatedId: saved._id,
                    relatedModel: 'Quotation',
                });
            }
        } catch (notifErr) {
            console.error('Notification error (non-fatal):', notifErr.message);
        }

        return res.json({
            message: 'Revision submitted successfully. Quotation is back with admin for re-pricing.',
            quotation: saved,
            revisionCount: saved.revisionCount,
        });
    } catch (error) {
        console.error('customerReviseQuotation Error:', error);
        return res.status(400).json({
            message: 'Failed to submit revision',
            error: error.message,
            details: error.errors,
        });
    }
};

// ----------------------------------------------------------------
// 4. CUSTOMER ACCEPT QUOTATION  (Customer — Phase 4)
//    Customer accepts the base price and provides exact fulfillmentDetails.
//    Guard:  status must be PENDING_CUSTOMER_APPROVAL
//    Result: isLocked = true,  status → AWAITING_FINAL_CHARGE_SHEET
// ----------------------------------------------------------------
exports.customerAcceptQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { fulfillmentDetails } = req.body;

        const quotation = await Quotation.findById(id);
        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // --- Ownership check ---
        if (quotation.clientId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Not authorized',
                error: 'You can only accept your own quotations',
            });
        }

        // --- State guard ---
        if (quotation.status !== 'PENDING_CUSTOMER_APPROVAL') {
            return res.status(400).json({
                message: 'Invalid state transition',
                error: `customerAcceptQuotation can only be called when status is PENDING_CUSTOMER_APPROVAL. Current status: ${quotation.status}`,
                currentStatus: quotation.status,
                allowedFrom: ['PENDING_CUSTOMER_APPROVAL'],
            });
        }

        // --- Expiry check ---
        if (quotation.validUntil && new Date(quotation.validUntil) < new Date()) {
            return res.status(400).json({
                message: 'Cannot accept an expired quotation',
                error: 'This quotation has passed its validity date. Please request a new quote.',
                validUntil: quotation.validUntil,
                expired: true,
            });
        }

        // --- Validate fulfillmentDetails minimum required fields ---
        if (!fulfillmentDetails) {
            return res.status(400).json({
                message: 'fulfillmentDetails is required when accepting a quotation',
                hint: 'Provide exact pickup/delivery addresses, pickupType, and deliveryType',
            });
        }
        const missingFields = [];
        if (!fulfillmentDetails.pickupType) missingFields.push('fulfillmentDetails.pickupType');
        if (!fulfillmentDetails.deliveryType) missingFields.push('fulfillmentDetails.deliveryType');
        if (!fulfillmentDetails.pickupCity) missingFields.push('fulfillmentDetails.pickupCity');
        if (!fulfillmentDetails.deliveryCity) missingFields.push('fulfillmentDetails.deliveryCity');
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'Incomplete fulfillmentDetails',
                missingFields,
            });
        }

        const validPickupTypes = ['HOME_PICKUP', 'WAREHOUSE_DROP'];
        const validDeliveryTypes = ['HOME_DELIVERY', 'WAREHOUSE_PICKUP'];
        if (!validPickupTypes.includes(fulfillmentDetails.pickupType)) {
            return res.status(400).json({
                message: `Invalid pickupType: ${fulfillmentDetails.pickupType}`,
                allowed: validPickupTypes,
            });
        }
        if (!validDeliveryTypes.includes(fulfillmentDetails.deliveryType)) {
            return res.status(400).json({
                message: `Invalid deliveryType: ${fulfillmentDetails.deliveryType}`,
                allowed: validDeliveryTypes,
            });
        }

        // --- Apply state changes ---
        quotation.fulfillmentDetails = fulfillmentDetails;
        quotation.isAcceptedByClient = true;
        quotation.clientAcceptedAt = new Date();
        quotation.isLocked = true;
        quotation.status = 'AWAITING_FINAL_CHARGE_SHEET';

        pushHistory(
            quotation,
            'AWAITING_FINAL_CHARGE_SHEET',
            userId,
            'Customer accepted base quotation and provided fulfillment details'
        );

        const saved = await quotation.save();

        // Notify admin/manager to issue final charge sheet
        try {
            await Notification.createNotification({
                recipientId: quotation.managerId || null,
                title: 'Quotation Accepted — Issue Final Charge Sheet',
                message: `Customer accepted quotation ${saved.quotationId}. Please add first/last mile charges and issue the final charge sheet.`,
                type: 'success',
                category: 'quotation',
                relatedId: saved._id,
                relatedModel: 'Quotation',
            });
        } catch (notifErr) {
            console.error('Notification error (non-fatal):', notifErr.message);
        }

        return res.json({
            message: 'Quotation accepted. Admin will now issue the final charge sheet.',
            quotation: saved,
            isLocked: saved.isLocked,
        });
    } catch (error) {
        console.error('customerAcceptQuotation Error:', error);
        return res.status(400).json({
            message: 'Failed to accept quotation',
            error: error.message,
            details: error.errors,
        });
    }
};

// ----------------------------------------------------------------
// 5. ADMIN FINALIZE CHARGE SHEET  (Admin/Manager — Phase 5)
//    Adds firstMileCharge and lastMileCharge.
//    Recalculates grand totalAmount.
//    Guard:  status must be AWAITING_FINAL_CHARGE_SHEET
//    Result: status → PAYMENT_PENDING
// ----------------------------------------------------------------
exports.adminFinalizeChargeSheet = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstMileCharge, lastMileCharge, additionalNotes, internalNotes } = req.body;

        const quotation = await Quotation.findById(id)
            .populate('clientId', 'fullName email');

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // --- State guard ---
        if (quotation.status !== 'AWAITING_FINAL_CHARGE_SHEET') {
            return res.status(400).json({
                message: 'Invalid state transition',
                error: `adminFinalizeChargeSheet can only be called when status is AWAITING_FINAL_CHARGE_SHEET. Current status: ${quotation.status}`,
                currentStatus: quotation.status,
                allowedFrom: ['AWAITING_FINAL_CHARGE_SHEET'],
            });
        }

        // --- Lock guard: should always be locked at this point, but double-check ---
        if (!quotation.isLocked) {
            return res.status(409).json({
                message: 'Quotation integrity error',
                error: 'Quotation must be locked before finalizing the charge sheet. The customer must first accept the base quote.',
            });
        }

        // --- Validate mile charge inputs ---
        const parsedFirstMile = Number(firstMileCharge ?? 0);
        const parsedLastMile = Number(lastMileCharge ?? 0);

        if (isNaN(parsedFirstMile) || parsedFirstMile < 0) {
            return res.status(400).json({ message: 'firstMileCharge must be a non-negative number' });
        }
        if (isNaN(parsedLastMile) || parsedLastMile < 0) {
            return res.status(400).json({ message: 'lastMileCharge must be a non-negative number' });
        }

        // --- Business rule: firstMileCharge should only be > 0 when pickupType is HOME_PICKUP ---
        const pickupType = quotation.fulfillmentDetails?.pickupType;
        const deliveryType = quotation.fulfillmentDetails?.deliveryType;

        if (parsedFirstMile > 0 && pickupType === 'WAREHOUSE_DROP') {
            return res.status(400).json({
                message: 'Business rule violation',
                error: 'firstMileCharge must be 0 when pickupType is WAREHOUSE_DROP (customer is dropping off at warehouse).',
                pickupType,
            });
        }
        if (parsedLastMile > 0 && deliveryType === 'WAREHOUSE_PICKUP') {
            return res.status(400).json({
                message: 'Business rule violation',
                error: 'lastMileCharge must be 0 when deliveryType is WAREHOUSE_PICKUP (recipient collects from warehouse).',
                deliveryType,
            });
        }

        // --- Apply charge sheet values ---
        quotation.firstMileCharge = parsedFirstMile;
        quotation.lastMileCharge = parsedLastMile;
        if (additionalNotes !== undefined) quotation.additionalNotes = additionalNotes;
        if (internalNotes !== undefined) quotation.internalNotes = internalNotes;

        // Transition — pre-save will call calculateTotals() which incorporates the new mile charges
        quotation.status = 'PAYMENT_PENDING';
        pushHistory(
            quotation,
            'PAYMENT_PENDING',
            req.user.id,
            `Admin finalized charge sheet. First-mile: ${parsedFirstMile} ${quotation.currency}, Last-mile: ${parsedLastMile} ${quotation.currency}`
        );

        const saved = await quotation.save();

        // Notify customer that the final bill is ready
        try {
            await Notification.createNotification({
                recipientId: quotation.clientId._id || quotation.clientId,
                title: 'Final Charge Sheet Ready — Payment Due',
                message: `The final charge sheet for quotation ${saved.quotationId} is ready. Total: ${saved.totalAmount} ${saved.currency}. Please proceed with payment.`,
                type: 'info',
                category: 'quotation',
                relatedId: saved._id,
                relatedModel: 'Quotation',
            });
        } catch (notifErr) {
            console.error('Notification error (non-fatal):', notifErr.message);
        }

        return res.json({
            message: 'Final charge sheet issued. Quotation is now awaiting payment.',
            quotation: saved,
            chargeBreakdown: {
                baseFreightCharge: saved.pricing?.baseFreightCharge || 0,
                estimatedHandlingFee: saved.pricing?.estimatedHandlingFee || 0,
                firstMileCharge: saved.firstMileCharge,
                lastMileCharge: saved.lastMileCharge,
                tax: saved.tax,
                discount: saved.discount,
                totalAmount: saved.totalAmount,
                currency: saved.currency,
            },
        });
    } catch (error) {
        console.error('adminFinalizeChargeSheet Error:', error);
        return res.status(400).json({
            message: 'Failed to finalize charge sheet',
            error: error.message,
            details: error.errors,
        });
    }
};
