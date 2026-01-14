const mongoose = require('mongoose');

// ============================================
// Line Item Sub-Schema (Embedded Document)
// ============================================
const lineItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Line item description is required'],
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    quantity: {
        type: Number,
        default: 1,
        min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
        type: Number,
        required: [true, 'Unit price is required'],
        min: [0, 'Unit price cannot be negative'],
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative'],
    },
    category: {
        type: String,
        enum: ['freight', 'handling', 'customs', 'insurance', 'surcharge', 'other'],
        default: 'other',
    },
}, { _id: false });

// ============================================
// Quotation Schema
// ============================================
const quotationSchema = new mongoose.Schema({
    // --- Relations ---
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShipmentRequest',
        required: [true, 'Request ID is required'],
        index: true,
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Manager ID is required'],
        index: true,
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Client ID is required'],
        index: true,
    },

    // --- Quotation Reference ---
    quotationNumber: {
        type: String,
        unique: true,
        index: true,
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
        required: [true, 'Subtotal is required'],
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
        required: [true, 'Total amount is required'],
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
        required: [true, 'Validity date is required'],
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
    termsAndConditions: {
        type: String,
        trim: true,
        default: 'Standard shipping terms and conditions apply. Payment due within 30 days.',
    },

    // --- Status ---
    status: {
        type: String,
        enum: {
            values: ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Cancelled', 'Ready for Pickup'],
            message: 'Invalid quotation status',
        },
        default: 'Draft',
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
            // Hide internal notes from client responses
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
quotationSchema.index({ requestId: 1, status: 1 });
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
 * Check if quotation is visible to client
 * Client only sees price if approved by manager
 */
quotationSchema.virtual('isVisibleToClient').get(function () {
    return this.isApprovedByManager && ['Approved', 'Sent', 'Accepted', 'Rejected'].includes(this.status);
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
quotationSchema.pre('save', async function (next) {
    // Generate quotation number
    if (this.isNew && !this.quotationNumber) {
        this.quotationNumber = await generateQuotationNumber();
    }

    // Recalculate totals if items changed
    if (this.isModified('items') || this.isModified('taxRate') || this.isModified('discount')) {
        this.calculateTotals();
    }

    next();
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
    this.status = 'Approved';
    return this.save();
};

/**
 * Send quotation to client
 */
quotationSchema.methods.sendToClient = async function () {
    if (!this.isApprovedByManager) {
        throw new Error('Quotation must be approved by manager before sending to client');
    }
    this.status = 'Sent';
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
    this.status = 'Accepted';
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
    this.status = 'Rejected';
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

    if (!this.isApprovedByManager) {
        // Hide pricing details for unapproved quotations
        obj.items = [];
        obj.subtotal = null;
        obj.tax = null;
        obj.totalAmount = null;
        obj.discount = null;
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
 * @param {ObjectId} clientId - Client ID
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
