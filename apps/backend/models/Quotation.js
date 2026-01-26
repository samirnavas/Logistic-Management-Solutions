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
        enum: ['General', 'Special', 'Harmful', 'Explosive', 'Freight', 'Insurance', 'Packaging', 'Handling', 'Tax', 'Other', 'freight', 'insurance', 'handling', 'other'], // Added lowercase for compatibility
        default: 'General',
    },
    isHazardous: {
        type: Boolean,
        default: false,
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

const addressSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
        type: String,
        trim: true,
    },
    addressLine: {
        type: String,
        trim: true,
        maxlength: [200, 'Address line cannot exceed 200 characters'],
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
    },
    state: {
        type: String,
        trim: true,
        default: '',
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
    },
    zip: {
        type: String,
        trim: true,
    },
    addressType: {
        type: String,
        trim: true,
        default: '',
    },
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

    // --- Shipment Details ---
    origin: {
        type: addressSchema,
        required: [true, 'Origin address is required'],
    },
    destination: {
        type: addressSchema,
        required: [true, 'Destination address is required'],
    },
    pickupDate: {
        type: Date,
    },
    deliveryDate: {
        type: Date,
    },
    cargoType: {
        type: String,
        required: [true, 'Cargo type is required'],
        default: 'General Cargo'
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

    // --- Product Photos (Cloudinary URLs) ---
    productPhotos: {
        type: [String],
        default: [],
        validate: {
            validator: function (v) {
                return v.length <= 5;
            },
            message: 'Maximum 5 product photos allowed',
        },
    },

    // --- Financial Details ---
    items: {
        type: [lineItemSchema],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'At least one line item is required',
        },
    },
    subtotal: {
        type: Number,
        default: 0,
        min: [0, 'Subtotal cannot be negative'],
    },
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
    totalAmount: {
        type: Number,
        default: 0,
        min: [0, 'Total amount cannot be negative'],
    },
    currency: {
        type: String,
        default: 'USD',
        enum: {
            values: ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'AED', 'INR'],
            message: 'Invalid currency',
        },
    },

    // --- Approval Workflow ---
    isApprovedByManager: {
        type: Boolean,
        default: false,
        index: true,
    },
    managerApprovedAt: {
        type: Date,
    },
    isAcceptedByClient: {
        type: Boolean,
        default: false,
    },
    clientAcceptedAt: {
        type: Date,
    },
    isRejectedByClient: {
        type: Boolean,
        default: false,
    },
    clientRejectedAt: {
        type: Date,
    },
    clientRejectionReason: {
        type: String,
        trim: true,
        default: '',
    },

    // --- Validity ---
    validUntil: {
        type: Date,
    },

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

    // --- Status ---
    status: {
        type: String,
        enum: {
            values: ['request_sent', 'approved', 'details_submitted', 'cost_calculated', 'rejected', 'ready_for_pickup', 'shipped', 'delivered', 'sent', 'accepted'],
            message: 'Invalid quotation status',
        },
        default: 'request_sent',
        index: true,
    },

    // --- Revision Tracking ---
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
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            // Hide internal notes from client app responses
            delete ret.internalNotes;
        }
    },
    toObject: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});

// ============================================
// Indexes for Performance
// ============================================
// Note: Single-field indexes are defined in field definitions
// Only compound indexes defined here
// quotationSchema.index({ requestId: 1, status: 1 });
quotationSchema.index({ clientId: 1, status: 1 });
quotationSchema.index({ managerId: 1, createdAt: -1 });
quotationSchema.index({ validUntil: 1 });
quotationSchema.index({ isApprovedByManager: 1, status: 1 });

// ============================================
// Virtual Fields
// ============================================

/**
 * Check if quotation is expired
 */
quotationSchema.virtual('isExpired').get(function () {
    return new Date() > this.validUntil;
});

/**
 * Check if quotation is visible to client app
 * client app only sees price if approved by manager
 */
quotationSchema.virtual('isVisibleToClient').get(function () {
    return this.isApprovedByManager && ['approved', 'sent', 'accepted', 'rejected'].includes(this.status);
});

/**
 * Days until expiry
 */
quotationSchema.virtual('daysUntilExpiry').get(function () {
    const now = new Date();
    const expiry = new Date(this.validUntil);
    const diffTime = expiry - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ============================================
// Pre-save Middleware
// ============================================

/**
 * Auto-generate quotation number and calculate totals
 */
quotationSchema.pre('save', async function () {
    // Generate quotation number (legacy)
    if (this.isNew && !this.quotationNumber) {
        this.quotationNumber = await generateQuotationNumber();
    }

    // Generate quotation ID (New Format: QT-YYYYMMDD-Random)
    if (this.isNew && !this.quotationId) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.quotationId = `QT-${dateStr}-${randomSuffix}`;
    }

    // Recalculate totals if items changed
    if (this.isModified('items') || this.isModified('taxRate') || this.isModified('discount')) {
        this.calculateTotals();
    }
});

// ============================================
// Instance Methods
// ============================================

/**
 * Calculate subtotal, tax, and total from line items
 */
quotationSchema.methods.calculateTotals = function () {
    // Calculate subtotal from items
    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);

    // Calculate tax
    this.tax = (this.subtotal * this.taxRate) / 100;

    // Calculate total
    this.totalAmount = this.subtotal + this.tax - this.discount;

    // Ensure total is not negative
    if (this.totalAmount < 0) {
        this.totalAmount = 0;
    }
};

/**
 * Approve quotation by manager
 */
quotationSchema.methods.approveByManager = async function () {
    this.isApprovedByManager = true;
    this.managerApprovedAt = new Date();
    this.status = 'approved';
    return this.save();
};

/**
 * Send quotation to client
 */
quotationSchema.methods.sendToClient = async function () {
    if (!this.isApprovedByManager) {
        throw new Error('Quotation must be approved by manager before sending to client');
    }
    this.status = 'sent';
    return this.save();
};

/**
 * Client accepts quotation
 */
quotationSchema.methods.acceptByClient = async function () {
    if (this.isExpired) {
        throw new Error('Cannot accept an expired quotation');
    }
    this.isAcceptedByClient = true;
    this.clientAcceptedAt = new Date();
    this.status = 'accepted';
    return this.save();
};

/**
 * Client rejects quotation
 * @param {string} reason - Rejection reason
 */
quotationSchema.methods.rejectByClient = async function (reason = '') {
    this.isRejectedByClient = true;
    this.clientRejectedAt = new Date();
    this.clientRejectionReason = reason;
    this.status = 'rejected';
    return this.save();
};

/**
 * Check if quotation can be edited
 * @returns {boolean}
 */
quotationSchema.methods.canBeEdited = function () {
    return ['Draft', 'Pending Approval'].includes(this.status);
};

/**
 * Get client-safe version (hides sensitive data if not approved)
 * @returns {Object}
 */
quotationSchema.methods.toClientJSON = function () {
    const obj = this.toJSON();
    const status = this.status;

    // Define statuses where price/details are ALWAYS visible to client
    // This overrides any other flags like isApprovedByManager
    const alwaysVisibleStatuses = [
        'sent',
        'accepted',
        'approved',
        'ready_for_pickup',
        'shipped',
        'delivered',
        'Sent', 'Accepted', 'Approved' // Safety for legacy/mixed case
    ];

    if (alwaysVisibleStatuses.includes(status)) {
        return obj;
    }

    // For other statuses (request_sent, cost_calculated, details_submitted), 
    // hide details if not explicitly approved or if it's a draft

    // Check if price should be hidden
    // Hide if NOT approved by manager 
    if (!this.isApprovedByManager) {
        // Hide pricing details for unapproved quotations
        obj.items = [];
        obj.subtotal = null;
        obj.tax = null;
        obj.totalAmount = null;
        obj.discount = null;

        // Also mask status so client doesn't see "cost_calculated" or other internal statuses
        if (obj.status === 'cost_calculated') {
            obj.status = 'request_sent';
        }
    }

    return obj;
};

// ============================================
// Static Methods
// ============================================

/**
 * Find quotations for a specific request
 * @param {ObjectId} requestId - Request ID
 * @returns {Promise<Quotation[]>}
 */
quotationSchema.statics.findByRequest = function (requestId) {
    return this.find({ requestId })
        .populate('managerId', 'fullName email')
        .sort({ revisionNumber: -1 });
};

/**
 * Find quotations visible to client
 * @param {ObjectId} clientId - client ID
 * @returns {Promise<Quotation[]>}
 */
quotationSchema.statics.findVisibleToClient = function (clientId) {
    return this.find({
        clientId,
        isApprovedByManager: true,
        status: { $in: ['Approved', 'Sent', 'Accepted', 'Rejected'] }
    })
        .populate('requestId', 'requestNumber itemName mode')
        .sort({ createdAt: -1 });
};

/**
 * Find pending quotations for manager
 * @param {ObjectId} managerId - Manager ID (optional, for all if not provided)
 * @returns {Promise<Quotation[]>}
 */
quotationSchema.statics.findPendingApproval = function (managerId = null) {
    const query = { status: 'Pending Approval' };
    if (managerId) {
        query.managerId = managerId;
    }
    return this.find(query)
        .populate('requestId', 'requestNumber itemName')
        .populate('clientId', 'fullName email customerCode')
        .sort({ createdAt: -1 });
};

// ============================================
// Helper Functions
// ============================================

/**
 * Generate unique quotation number
 * @returns {Promise<string>} - Generated quotation number (e.g., "QUO-20260114-001234")
 */
async function generateQuotationNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Get count of quotations created today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await mongoose.model('Quotation').countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const sequenceNumber = String(count + 1).padStart(6, '0');
    return `QUO-${dateStr}-${sequenceNumber}`;
}

module.exports = mongoose.model('Quotation', quotationSchema);
