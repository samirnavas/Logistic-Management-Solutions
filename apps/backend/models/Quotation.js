const mongoose = require('mongoose');

// ============================================
// Line Item Sub-Schema (Embedded Document)
// ============================================
const lineItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Product Name is required'],
        trim: true,
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
    },
    weight: {
        type: Number,
        default: 0,
        min: [0, 'Weight cannot be negative'],
    },
    dimensions: {
        type: mongoose.Schema.Types.Mixed, // Can be String "LxWxH" or Object { L, W, H }
        default: 'N/A',
    },
    images: {
        type: [String], // Array of image URLs
        default: [],
    },
    category: {
        type: String,
        enum: ['General', 'Special', 'Harmful', 'Explosive', 'Freight', 'Insurance', 'Packaging', 'Handling', 'Tax', 'Other', 'freight', 'insurance', 'handling', 'other'],
        default: 'General',
    },
    isHazardous: {
        type: Boolean,
        default: false,
    },
    hsCode: {
        type: String,
        trim: true,
    },
    videoUrl: {
        type: String,
        trim: true,
    },
    targetRate: {
        type: Number, // Client's expected price
        min: [0, 'Target rate cannot be negative'],
    },
    packingVolume: {
        type: Number, // CBM
    },
    priority: {
        type: String,
        enum: ['Standard', 'Express'],
        default: 'Standard',
    },
    // Financial fields (populated by Manager)
    declaredValue: {
        type: Number,
        default: 0,
        min: [0, 'Declared value cannot be negative'],
    },
    // Admin-set shipping charge for this specific line item
    shippingCharge: {
        type: Number,
        default: 0,
        min: [0, 'Shipping charge cannot be negative'],
    },
    // Legacy fields kept for backward compatibility
    unitPrice: {
        type: Number,
        default: 0,
        min: [0, 'Unit price cannot be negative'],
    },
    amount: {
        type: Number,
        default: 0,
        min: [0, 'Amount cannot be negative'],
    },
}, { _id: false });

// ============================================
// Itemized Cost Sub-Schema
// Links a price breakdown to a specific line item (by description / index)
// ============================================
const itemizedCostSchema = new mongoose.Schema({
    /**
     * Reference to the line item by its description (human-readable).
     * Using description rather than ObjectId since lineItems use { _id: false }.
     */
    lineItemDescription: {
        type: String,
        required: [true, 'Line item description reference is required'],
        trim: true,
    },
    freightCharge: {
        type: Number,
        default: 0,
        min: [0, 'Freight charge cannot be negative'],
    },
    handlingFee: {
        type: Number,
        default: 0,
        min: [0, 'Handling fee cannot be negative'],
    },
}, { _id: false });

// ============================================
// Routing Data Sub-Schema  (Phase 1 — region/city strings only)
// Collected at the time the customer first submits the quote request.
// ============================================
const routingDataSchema = new mongoose.Schema({
    sourceRegion: {
        type: String,
        trim: true,
        maxlength: [100, 'Source region cannot exceed 100 characters'],
    },
    sourceCity: {
        type: String,
        trim: true,
        maxlength: [100, 'Source city cannot exceed 100 characters'],
    },
    destinationRegion: {
        type: String,
        trim: true,
        maxlength: [100, 'Destination region cannot exceed 100 characters'],
    },
    destinationCity: {
        type: String,
        trim: true,
        maxlength: [100, 'Destination city cannot exceed 100 characters'],
    },
}, { _id: false });

// ============================================
// Fulfillment Details Sub-Schema  (Phase 4 — exact addresses + logistics type)
// Collected after the customer accepts the base quote.
// ============================================
const fulfillmentDetailsSchema = new mongoose.Schema({
    // --- Origin / Pickup ---
    pickupAddressLine: {
        type: String,
        trim: true,
        maxlength: [250, 'Pickup address line cannot exceed 250 characters'],
    },
    pickupCity: {
        type: String,
        trim: true,
    },
    pickupState: {
        type: String,
        trim: true,
        default: '',
    },
    pickupCountry: {
        type: String,
        trim: true,
    },
    pickupZip: {
        type: String,
        trim: true,
    },
    pickupCoordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
    },
    /**
     * How the goods originate for first-mile logistics.
     * HOME_PICKUP  → agent collects from customer's address (triggers firstMileCharge).
     * WAREHOUSE_DROP → customer drops goods at our warehouse (no first-mile).
     */
    pickupType: {
        type: String,
        enum: {
            values: ['HOME_PICKUP', 'WAREHOUSE_DROP'],
            message: 'pickupType must be HOME_PICKUP or WAREHOUSE_DROP',
        },
    },

    // --- Destination / Delivery ---
    deliveryAddressLine: {
        type: String,
        trim: true,
        maxlength: [250, 'Delivery address line cannot exceed 250 characters'],
    },
    deliveryCity: {
        type: String,
        trim: true,
    },
    deliveryState: {
        type: String,
        trim: true,
        default: '',
    },
    deliveryCountry: {
        type: String,
        trim: true,
    },
    deliveryZip: {
        type: String,
        trim: true,
    },
    deliveryCoordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
    },
    /**
     * How the goods are handed over at the destination end.
     * HOME_DELIVERY    → agent delivers to recipient's address (triggers lastMileCharge).
     * WAREHOUSE_PICKUP → recipient collects from our warehouse (no last-mile).
     */
    deliveryType: {
        type: String,
        enum: {
            values: ['HOME_DELIVERY', 'WAREHOUSE_PICKUP'],
            message: 'deliveryType must be HOME_DELIVERY or WAREHOUSE_PICKUP',
        },
    },

    // Contact details for first/last mile handover
    senderName: { type: String, trim: true },
    senderPhone: { type: String, trim: true },
    recipientName: { type: String, trim: true },
    recipientPhone: { type: String, trim: true },
}, { _id: false });

// ============================================
// Quotation Schema
// ============================================
const quotationSchema = new mongoose.Schema({
    // --- Relations ---
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'client ID is required'],
        index: true,
    },

    // --- Quotation Reference ---
    quotationNumber: {
        type: String,
        unique: true,
        index: true,
    },
    quotationId: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },

    // ============================================================
    // PHASE 1 — Routing Data (customer-supplied, region/city only)
    // ============================================================
    routingData: {
        type: routingDataSchema,
        default: () => ({}),
    },

    // ============================================================
    // PHASE 4 — Fulfillment Details (exact addresses, post-acceptance)
    // Populated only after isLocked === true (customer accepted base quote).
    // ============================================================
    fulfillmentDetails: {
        type: fulfillmentDetailsSchema,
        default: null,
    },

    // --- Legacy address fields (kept for backward compatibility) ---
    origin: {
        type: new mongoose.Schema({
            name: { type: String, trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
            phone: { type: String, trim: true },
            addressLine: { type: String, trim: true, maxlength: [200, 'Address line cannot exceed 200 characters'] },
            city: { type: String, trim: true },
            state: { type: String, trim: true, default: '' },
            country: { type: String, trim: true },
            zip: { type: String, trim: true },
            addressType: { type: String, trim: true, default: '' },
        }, { _id: false }),
    },
    destination: {
        type: new mongoose.Schema({
            name: { type: String, trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
            phone: { type: String, trim: true },
            addressLine: { type: String, trim: true, maxlength: [200, 'Address line cannot exceed 200 characters'] },
            city: { type: String, trim: true },
            state: { type: String, trim: true, default: '' },
            country: { type: String, trim: true },
            zip: { type: String, trim: true },
            addressType: { type: String, trim: true, default: '' },
        }, { _id: false }),
    },

    // --- Shipment / Cargo Details ---
    pickupDate: { type: Date },
    deliveryDate: { type: Date },
    cargoType: {
        type: String,
        required: [function () { return this.status !== 'DRAFT'; }, 'Cargo type is required'],
        default: 'General Cargo',
    },
    serviceMode: {
        type: String,
        enum: ['door_to_door', 'door_to_warehouse', 'warehouse_to_door', 'warehouse_to_warehouse'],
        default: 'door_to_door',
    },
    serviceType: {
        type: String,
        enum: ['Standard', 'Express', 'Economy', 'Priority'],
        default: 'Standard',
    },
    specialInstructions: {
        type: String,
        trim: true,
        maxlength: [500, 'Instructions cannot exceed 500 characters'],
        default: '',
    },

    // --- Handover Method ---
    handoverMethod: {
        type: String,
        enum: ['PICKUP', 'DROP_OFF'],
        default: 'PICKUP',
    },
    warehouseDropOffLocation: {
        type: String,
        trim: true,
    },

    // --- Product Photos (Cloudinary URLs) ---
    productPhotos: {
        type: [String],
        default: [],
        validate: {
            validator: function (v) { return v.length <= 5; },
            message: 'Maximum 5 product photos allowed',
        },
    },

    // ============================================================
    // LINE ITEMS
    // ============================================================
    items: {
        type: [lineItemSchema],
        validate: {
            validator: function (v) {
                if (this.status === 'DRAFT') return true;
                return v && v.length > 0;
            },
            message: 'At least one line item is required',
        },
    },

    // ============================================================
    // PRICING / LEDGER  (Phase 3 → Phase 5 progressive population)
    // ============================================================

    /**
     * Per-item cost breakdown. Each entry links to a line item by description
     * and carries that item's freight charge + handling fee.
     */
    itemizedCosts: {
        type: [itemizedCostSchema],
        default: [],
    },

    /**
     * Aggregate base freight charge across all items + route (admin-set, Phase 3).
     */
    baseFreightCharge: {
        type: Number,
        default: 0,
        min: [0, 'Base freight charge cannot be negative'],
    },

    /**
     * Aggregate estimated handling fee (admin-set, Phase 3).
     */
    estimatedHandlingFee: {
        type: Number,
        default: 0,
        min: [0, 'Estimated handling fee cannot be negative'],
    },

    /**
     * First-mile charge — cost of collecting goods from customer's pickup address.
     * Only applicable when fulfillmentDetails.pickupType === 'HOME_PICKUP'.
     * Set during Phase 5 (final charge sheet), BEFORE PAYMENT_PENDING.
     *
     * Validation: REQUIRED when transitioning to PAYMENT_PENDING or beyond.
     * Not required during PENDING_ADMIN_REVIEW.
     */
    firstMileCharge: {
        type: Number,
        default: 0,
        min: [0, 'First-mile charge cannot be negative'],
        validate: {
            validator: function (v) {
                // If status is PAYMENT_PENDING or CONVERTED_TO_SHIPMENT,
                // firstMileCharge must be explicitly set (>= 0 is always true,
                // but we treat null/undefined as a violation at those stages).
                const requiresChargeSheet = [
                    'PAYMENT_PENDING',
                    'CONVERTED_TO_SHIPMENT',
                ].includes(this.status);

                if (requiresChargeSheet && (v === null || v === undefined)) {
                    return false;
                }
                return true;
            },
            message: 'firstMileCharge must be set before the quote reaches PAYMENT_PENDING',
        },
    },

    /**
     * Last-mile charge — cost of delivering goods to recipient's door.
     * Only applicable when fulfillmentDetails.deliveryType === 'HOME_DELIVERY'.
     * Set during Phase 5 (final charge sheet), BEFORE PAYMENT_PENDING.
     *
     * Validation: REQUIRED when transitioning to PAYMENT_PENDING or beyond.
     * Not required during PENDING_ADMIN_REVIEW.
     */
    lastMileCharge: {
        type: Number,
        default: 0,
        min: [0, 'Last-mile charge cannot be negative'],
        validate: {
            validator: function (v) {
                const requiresChargeSheet = [
                    'PAYMENT_PENDING',
                    'CONVERTED_TO_SHIPMENT',
                ].includes(this.status);

                if (requiresChargeSheet && (v === null || v === undefined)) {
                    return false;
                }
                return true;
            },
            message: 'lastMileCharge must be set before the quote reaches PAYMENT_PENDING',
        },
    },

    /**
     * Grand total: baseFreightCharge + estimatedHandlingFee + firstMileCharge
     * + lastMileCharge + any other ad-hoc charges, minus discounts.
     * Recalculated on every save when the pricing fields change.
     */
    totalAmount: {
        type: Number,
        default: 0,
        min: [0, 'Total amount cannot be negative'],
    },

    // Supporting financial meta-fields (retained for UI / PDF generation)
    taxRate: {
        type: Number,
        default: 0,
        min: [0, 'Tax rate cannot be negative'],
        max: [100, 'Tax rate cannot exceed 100%'],
    },
    tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative'],
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
    },
    discountReason: {
        type: String,
        trim: true,
        default: '',
    },
    currency: {
        type: String,
        default: 'USD',
        enum: {
            values: ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'AED', 'INR'],
            message: 'Invalid currency',
        },
    },

    // ============================================================
    // WORKFLOW / NEGOTIATION STATE
    // ============================================================

    /**
     * How many times the quote has bounced between admin and customer.
     * Incremented each time the admin re-sends a revised quote to the customer.
     */
    revisionCount: {
        type: Number,
        default: 0,
        min: [0, 'Revision count cannot be negative'],
    },

    /**
     * Locked once the customer formally accepts the base quote (Phase 4).
     * When true, core pricing can no longer be changed — only firstMileCharge
     * and lastMileCharge remain editable as part of the final charge sheet.
     */
    isLocked: {
        type: Boolean,
        default: false,
        index: true,
    },

    // --- Approval Workflow ---
    isApprovedByManager: {
        type: Boolean,
        default: false,
        index: true,
    },
    managerApprovedAt: { type: Date },
    isAcceptedByClient: {
        type: Boolean,
        default: false,
    },
    clientAcceptedAt: { type: Date },
    isRejectedByClient: {
        type: Boolean,
        default: false,
    },
    clientRejectedAt: { type: Date },
    clientRejectionReason: {
        type: String,
        trim: true,
        default: '',
    },

    // --- Validity ---
    validUntil: { type: Date },

    // --- Documents ---
    pdfUrl: {
        type: String,
        trim: true,
        default: '',
    },

    // --- Notes ---
    internalNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Internal notes cannot exceed 1000 characters'],
        default: '',
    },
    additionalNotes: {
        type: String,
        trim: true,
        maxlength: [2000, 'Additional notes cannot exceed 2000 characters'],
        default: '',
    },
    termsAndConditions: {
        type: String,
        trim: true,
        default: 'Standard shipping terms and conditions apply. Payment due within 30 days.',
    },

    // ============================================================
    // STATUS  (Iterative Quotation state machine)
    // ============================================================
    /**
     * State machine for the Iterative Quotation workflow:
     *
     *  DRAFT
     *    → customer saves a quote request but hasn't submitted yet.
     *
     *  PENDING_ADMIN_REVIEW
     *    → customer submits (Phase 1). Admin reviews routing data & items.
     *
     *  PENDING_CUSTOMER_APPROVAL
     *    → admin prices the base quote (Phase 3) and sends it to the customer.
     *      revisionCount increments each time the quote bounces back here.
     *
     *  AWAITING_FINAL_CHARGE_SHEET
     *    → customer accepts base quote (Phase 4), isLocked = true.
     *      Admin adds firstMileCharge + lastMileCharge and issues final charge sheet.
     *
     *  PAYMENT_PENDING
     *    → final charge sheet accepted; customer must complete payment.
     *      firstMileCharge & lastMileCharge MUST be set at this point.
     *
     *  CONVERTED_TO_SHIPMENT
     *    → payment confirmed; a Shipment document is created.
     *
     *  REJECTED
     *    → either party has terminated the negotiation.
     */
    status: {
        type: String,
        enum: {
            values: [
                'DRAFT',
                'PENDING_ADMIN_REVIEW',
                'PENDING_CUSTOMER_APPROVAL',
                'AWAITING_FINAL_CHARGE_SHEET',
                'PAYMENT_PENDING',
                'CONVERTED_TO_SHIPMENT',
                'REJECTED',
            ],
            message: 'Invalid quotation status: {VALUE}',
        },
        default: 'DRAFT',
        index: true,
    },

    // --- Audit Log ---
    statusHistory: [{
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        timestamp: { type: Date, default: Date.now },
    }],

    // --- Negotiation ---
    negotiation: {
        clientNotes: { type: String },
        adminResponse: { type: String },
        isActive: { type: Boolean, default: false },
    },

    // --- Legacy revision tracking (kept for backward compatibility) ---
    revisionNumber: {
        type: Number,
        default: 1,
        min: [1, 'Revision number must be at least 1'],
    },
    previousVersionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quotation',
    },

}, {
    timestamps: true,  // createdAt + updatedAt
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            // Hide internal notes from client app responses
            delete ret.internalNotes;
        },
    },
    toObject: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        },
    },
});

// ============================================
// Indexes for Performance
// ============================================
quotationSchema.index({ clientId: 1, status: 1 });
quotationSchema.index({ managerId: 1, createdAt: -1 });
quotationSchema.index({ validUntil: 1 });
quotationSchema.index({ isApprovedByManager: 1, status: 1 });
quotationSchema.index({ isLocked: 1, status: 1 });

// ============================================
// Virtual Fields
// ============================================

/** Check if quotation is expired */
quotationSchema.virtual('isExpired').get(function () {
    return this.validUntil ? new Date() > this.validUntil : false;
});

/** Check if quotation is visible to the client app */
quotationSchema.virtual('isVisibleToClient').get(function () {
    return [
        'PENDING_CUSTOMER_APPROVAL',
        'AWAITING_FINAL_CHARGE_SHEET',
        'PAYMENT_PENDING',
        'CONVERTED_TO_SHIPMENT',
        'REJECTED',
    ].includes(this.status);
});

/** Days until expiry */
quotationSchema.virtual('daysUntilExpiry').get(function () {
    if (!this.validUntil) return null;
    const now = new Date();
    const expiry = new Date(this.validUntil);
    const diffTime = expiry - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Convenience: whether the final charge sheet charges are populated.
 * True when both firstMileCharge and lastMileCharge have been explicitly set.
 */
quotationSchema.virtual('isFinalChargeSheetReady').get(function () {
    return (
        typeof this.firstMileCharge === 'number' &&
        typeof this.lastMileCharge === 'number'
    );
});

// ============================================
// Pre-save Middleware
// ============================================

/**
 * Auto-generate quotation number / ID and recalculate totals.
 */
quotationSchema.pre('save', async function () {
    // Generate quotation number (legacy sequential format)
    if (this.isNew && !this.quotationNumber) {
        this.quotationNumber = await generateQuotationNumber();
    }

    // Generate quotation ID (QT-YYYYMMDD-XXXX format)
    if (this.isNew && !this.quotationId) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.quotationId = `QT-${dateStr}-${randomSuffix}`;
    }

    // Recalculate totals whenever any pricing field changes
    const pricingFields = [
        'items',
        'taxRate',
        'discount',
        'itemizedCosts',
        'baseFreightCharge',
        'estimatedHandlingFee',
        'firstMileCharge',
        'lastMileCharge',
    ];
    if (pricingFields.some(f => this.isModified(f))) {
        this.calculateTotals();
    }
});

// ============================================
// Instance Methods
// ============================================

/**
 * Recalculate totalAmount from the structured pricing fields.
 *
 * Formula:
 *   totalAmount = baseFreightCharge
 *               + estimatedHandlingFee
 *               + firstMileCharge
 *               + lastMileCharge
 *               + tax (derived from subtotal × taxRate)
 *               − discount
 *
 * `subtotal` here is the sum of all lineItem.amount values and is used purely
 * as the basis for tax calculation — it is NOT stored separately any more.
 */
quotationSchema.methods.calculateTotals = function () {
    // Sum of per-item shipping charges (admin-set) — falls back to legacy 'amount' for old data
    const itemsSubtotal = (this.items || []).reduce((sum, item) =>
        sum + (item.shippingCharge || item.amount || 0), 0);

    // Tax on items subtotal
    this.tax = (itemsSubtotal * (this.taxRate || 0)) / 100;

    // Grand total
    const rawTotal =
        (this.baseFreightCharge || 0) +
        (this.estimatedHandlingFee || 0) +
        (this.firstMileCharge || 0) +
        (this.lastMileCharge || 0) +
        itemsSubtotal +
        this.tax -
        (this.discount || 0);

    this.totalAmount = Math.max(0, rawTotal);
};

/**
 * Approve quotation by manager and transition to PENDING_CUSTOMER_APPROVAL.
 */
quotationSchema.methods.approveByManager = async function () {
    this.isApprovedByManager = true;
    this.managerApprovedAt = new Date();
    this.status = 'PENDING_CUSTOMER_APPROVAL';
    this.revisionCount = (this.revisionCount || 0) + 1;
    return this.save();
};

/**
 * Send / re-send quotation to client (sets status to PENDING_CUSTOMER_APPROVAL).
 */
quotationSchema.methods.sendToClient = async function () {
    if (!this.isApprovedByManager) {
        throw new Error('Quotation must be approved by manager before sending to client');
    }
    this.status = 'PENDING_CUSTOMER_APPROVAL';
    return this.save();
};

/**
 * Client accepts the base quote → lock it and await final charge sheet (Phase 4).
 */
quotationSchema.methods.acceptByClient = async function () {
    if (this.isExpired) {
        throw new Error('Cannot accept an expired quotation');
    }
    this.isAcceptedByClient = true;
    this.clientAcceptedAt = new Date();
    this.isLocked = true;
    this.status = 'AWAITING_FINAL_CHARGE_SHEET';
    return this.save();
};

/**
 * Client rejects quotation.
 * @param {string} reason - Rejection reason
 */
quotationSchema.methods.rejectByClient = async function (reason = '') {
    this.isRejectedByClient = true;
    this.clientRejectedAt = new Date();
    this.clientRejectionReason = reason;
    this.status = 'REJECTED';
    return this.save();
};

/**
 * Admin issues the final charge sheet (Phase 5 — adds first/last mile charges).
 * Transitions to PAYMENT_PENDING.
 * @param {number} firstMile - First-mile charge amount
 * @param {number} lastMile  - Last-mile charge amount
 */
quotationSchema.methods.issueFinalChargeSheet = async function (firstMile = 0, lastMile = 0) {
    if (!this.isLocked) {
        throw new Error('Cannot issue a final charge sheet on an unlocked quotation. Customer must first accept the base quote.');
    }
    this.firstMileCharge = firstMile;
    this.lastMileCharge = lastMile;
    this.status = 'PAYMENT_PENDING';
    return this.save();
};

/**
 * Mark as converted to shipment (post-payment).
 */
quotationSchema.methods.convertToShipment = async function () {
    if (this.status !== 'PAYMENT_PENDING') {
        throw new Error('Quotation must be in PAYMENT_PENDING state before converting to a shipment');
    }
    this.status = 'CONVERTED_TO_SHIPMENT';
    return this.save();
};

/**
 * Check if quotation core pricing can still be edited (not locked).
 * @returns {boolean}
 */
quotationSchema.methods.canBeEdited = function () {
    return ['DRAFT', 'PENDING_ADMIN_REVIEW'].includes(this.status) && !this.isLocked;
};

/**
 * Get client-safe version of the quotation.
 * Hides pricing until the quote reaches PENDING_CUSTOMER_APPROVAL.
 * @returns {Object}
 */
quotationSchema.methods.toClientJSON = function () {
    const obj = this.toJSON();
    const status = this.status;

    // Statuses where pricing details are fully visible to the client
    const pricingVisibleStatuses = [
        'PENDING_CUSTOMER_APPROVAL',
        'AWAITING_FINAL_CHARGE_SHEET',
        'PAYMENT_PENDING',
        'CONVERTED_TO_SHIPMENT',
        'REJECTED',
    ];

    if (pricingVisibleStatuses.includes(status)) {
        return obj;
    }

    // For DRAFT / PENDING_ADMIN_REVIEW — hide all pricing details
    if (!this.isApprovedByManager) {
        obj.items = [];
        obj.itemizedCosts = [];
        obj.baseFreightCharge = null;
        obj.estimatedHandlingFee = null;
        obj.firstMileCharge = null;
        obj.lastMileCharge = null;
        obj.totalAmount = null;
        obj.discount = null;
        obj.tax = null;
    }

    return obj;
};

// ============================================
// Static Methods
// ============================================

/**
 * Find quotations for a specific request.
 * @param {ObjectId} requestId
 */
quotationSchema.statics.findByRequest = function (requestId) {
    return this.find({ requestId })
        .populate('managerId', 'fullName email')
        .sort({ revisionCount: -1 });
};

/**
 * Find quotations visible to the client (pricing approved by manager).
 * @param {ObjectId} clientId
 */
quotationSchema.statics.findVisibleToClient = function (clientId) {
    return this.find({
        clientId,
        isApprovedByManager: true,
        status: {
            $in: [
                'PENDING_CUSTOMER_APPROVAL',
                'AWAITING_FINAL_CHARGE_SHEET',
                'PAYMENT_PENDING',
                'CONVERTED_TO_SHIPMENT',
                'REJECTED',
            ],
        },
    })
        .populate('requestId', 'requestNumber itemName mode')
        .sort({ createdAt: -1 });
};

/**
 * Find quotations pending admin review / pricing.
 * @param {ObjectId} [managerId] - Optional; if omitted, returns all pending.
 */
quotationSchema.statics.findPendingApproval = function (managerId = null) {
    const query = {
        status: {
            $in: ['PENDING_ADMIN_REVIEW', 'AWAITING_FINAL_CHARGE_SHEET'],
        },
    };
    if (managerId) {
        query.managerId = managerId;
    }
    return this.find(query)
        .populate('clientId', 'fullName email customerCode')
        .sort({ createdAt: -1 });
};

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique sequential quotation number.
 * Format: QUO-YYYYMMDD-NNNNNN
 * @returns {Promise<string>}
 */
async function generateQuotationNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await mongoose.model('Quotation').countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    let attempt = count + 1;
    let quotationNumber;
    let isUnique = false;
    const maxAttempts = 100;

    while (!isUnique && attempt < count + maxAttempts) {
        const sequenceNumber = String(attempt).padStart(6, '0');
        quotationNumber = `QUO-${dateStr}-${sequenceNumber}`;

        const existing = await mongoose.model('Quotation').findOne({ quotationNumber });
        if (!existing) {
            isUnique = true;
        } else {
            attempt++;
        }
    }

    if (!isUnique) {
        // Fallback: timestamp ensures uniqueness
        quotationNumber = `QUO-${dateStr}-${Date.now()}`;
    }

    return quotationNumber;
}

module.exports = mongoose.model('Quotation', quotationSchema);
