const mongoose = require('mongoose');

// ============================================
// Location Sub-Schema (Embedded Document)
// ============================================
const locationSchema = new mongoose.Schema({
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
    },
    code: {
        type: String,
        trim: true,
        uppercase: true,
        default: '',
    },
    address: {
        type: String,
        trim: true,
        default: '',
    },
    coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
    },
}, { _id: false });

// ============================================
// Timeline Event Sub-Schema (Embedded Document)
// ============================================
const timelineEventSchema = new mongoose.Schema({
    status: {
        type: String,
        required: [true, 'Event status is required'],
        trim: true,
    },
    location: {
        type: String,
        trim: true,
        default: '',
    },
    timestamp: {
        type: Date,
        required: [true, 'Event timestamp is required'],
        default: Date.now,
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: '',
    },
    isNotified: {
        type: Boolean,
        default: false,
    },
}, { _id: true }); // Keep _id for individual event tracking

// ============================================
// Shipment Schema
// ============================================
const shipmentSchema = new mongoose.Schema({
    // --- Relations ---
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShipmentRequest',
        index: true,
    },
    quotationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quotation',
        index: true,
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Client ID is required'],
        index: true,
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },

    // --- Tracking Information ---
    trackingNumber: {
        type: String,
        required: [true, 'Tracking number is required'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    carrierTrackingNumber: {
        type: String,
        trim: true,
        default: '',
    },
    carrier: {
        type: String,
        trim: true,
        default: '',
    },

    // --- Shipment Details ---
    mode: {
        type: String,
        enum: {
            values: ['Air', 'Sea', 'Land', 'Rail', 'Multimodal'],
            message: 'Invalid shipping mode',
        },
        default: 'Air',
    },
    serviceType: {
        type: String,
        enum: ['Standard', 'Express', 'Economy', 'Priority'],
        default: 'Standard',
    },

    // --- Route Information ---
    origin: {
        type: locationSchema,
        required: [true, 'Origin is required'],
    },
    destination: {
        type: locationSchema,
        required: [true, 'Destination is required'],
    },
    currentLocation: {
        type: locationSchema,
    },

    // --- Package Details ---
    packageCount: {
        type: Number,
        default: 1,
        min: [1, 'Package count must be at least 1'],
    },
    totalWeight: {
        type: Number,
        min: [0, 'Weight cannot be negative'],
        default: 0,
    },
    weightUnit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg',
    },
    totalCbm: {
        type: Number,
        min: [0, 'CBM cannot be negative'],
        default: 0,
    },
    itemDescription: {
        type: String,
        trim: true,
        default: '',
    },

    // --- Status Management ---
    status: {
        type: String,
        enum: {
            values: [
                'Processing',
                'Picked Up',
                'In Transit',
                'Customs',
                'Customs Cleared',
                'Arrived at Hub',
                'Out for Delivery',
                'Delivered',
                'Exception',
                'Returned',
                'Cancelled'
            ],
            message: 'Invalid shipment status',
        },
        default: 'Processing',
        index: true,
    },
    statusDetails: {
        type: String,
        trim: true,
        default: '',
    },

    // --- Timeline/History ---
    timeline: {
        type: [timelineEventSchema],
        default: [],
    },

    // --- Dates ---
    estimatedDelivery: {
        type: Date,
    },
    actualDelivery: {
        type: Date,
    },
    pickupDate: {
        type: Date,
    },
    departureDate: {
        type: Date,
    },
    arrivalDate: {
        type: Date,
    },

    // --- Customs Information ---
    customsStatus: {
        type: String,
        enum: ['Not Required', 'Pending', 'In Progress', 'Cleared', 'Hold', 'Rejected'],
        default: 'Not Required',
    },
    customsDeclarationNumber: {
        type: String,
        trim: true,
        default: '',
    },
    hsCode: {
        type: String,
        trim: true,
        default: '',
    },

    // --- Financial ---
    declaredValue: {
        type: Number,
        min: [0, 'Declared value cannot be negative'],
        default: 0,
    },
    declaredValueCurrency: {
        type: String,
        default: 'USD',
    },
    shippingCost: {
        type: Number,
        min: [0, 'Shipping cost cannot be negative'],
        default: 0,
    },
    isPaid: {
        type: Boolean,
        default: false,
    },

    // --- Delivery Information ---
    signatureRequired: {
        type: Boolean,
        default: false,
    },
    deliveryInstructions: {
        type: String,
        trim: true,
        maxlength: [500, 'Delivery instructions cannot exceed 500 characters'],
        default: '',
    },
    recipientName: {
        type: String,
        trim: true,
        default: '',
    },
    recipientSignatureUrl: {
        type: String,
        trim: true,
        default: '',
    },

    // --- Documents ---
    documents: [{
        name: { type: String, trim: true },
        type: { type: String, enum: ['invoice', 'packing_list', 'customs', 'pod', 'other'] },
        url: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
    }],

    // --- Flags ---
    isInsured: {
        type: Boolean,
        default: false,
    },
    isFragile: {
        type: Boolean,
        default: false,
    },
    requiresRefrigeration: {
        type: Boolean,
        default: false,
    },
    isHazardous: {
        type: Boolean,
        default: false,
    },

    // --- Notes ---
    internalNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Internal notes cannot exceed 1000 characters'],
        default: '',
    },

}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.internalNotes; // Hide from client responses
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
shipmentSchema.index({ trackingNumber: 1 }, { unique: true });
shipmentSchema.index({ clientId: 1, status: 1 });
shipmentSchema.index({ status: 1, createdAt: -1 });
shipmentSchema.index({ estimatedDelivery: 1 });
shipmentSchema.index({ 'origin.country': 1, 'destination.country': 1 });
shipmentSchema.index({ carrier: 1, status: 1 });

// ============================================
// Virtual Fields
// ============================================

/**
 * Check if shipment is active
 */
shipmentSchema.virtual('isActive').get(function () {
    return !['Delivered', 'Returned', 'Cancelled'].includes(this.status);
});

/**
 * Check if shipment is delivered
 */
shipmentSchema.virtual('isDelivered').get(function () {
    return this.status === 'Delivered';
});

/**
 * Get days in transit
 */
shipmentSchema.virtual('daysInTransit').get(function () {
    const startDate = this.pickupDate || this.createdAt;
    const endDate = this.actualDelivery || new Date();
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Get latest status from timeline
 */
shipmentSchema.virtual('latestEvent').get(function () {
    if (!this.timeline || this.timeline.length === 0) {
        return null;
    }
    return this.timeline[this.timeline.length - 1];
});

/**
 * Route summary string
 */
shipmentSchema.virtual('routeSummary').get(function () {
    const origin = this.origin?.code || this.origin?.city || 'Unknown';
    const destination = this.destination?.code || this.destination?.city || 'Unknown';
    return `${origin} → ${destination}`;
});

// ============================================
// Pre-save Middleware
// ============================================

/**
 * Auto-generate tracking number if not provided
 */
shipmentSchema.pre('save', async function () {
    if (this.isNew && !this.trackingNumber) {
        this.trackingNumber = await generateTrackingNumber();
    }
});

// ============================================
// Instance Methods
// ============================================

/**
 * Add a new event to the timeline
 * @param {Object} event - Event object { status, location, description }
 * @returns {Promise<Shipment>}
 */
shipmentSchema.methods.addTimelineEvent = async function (event) {
    this.timeline.push({
        status: event.status,
        location: event.location || '',
        description: event.description || '',
        timestamp: event.timestamp || new Date(),
        isNotified: false,
    });

    // Update current status if event has a status
    if (event.updateStatus !== false) {
        this.status = event.status;
    }

    // Update current location if provided
    if (event.location) {
        this.currentLocation = this.currentLocation || {};
        this.currentLocation.city = event.location;
    }

    return this.save();
};

/**
 * Update shipment status with timeline entry
 * @param {string} newStatus - New status
 * @param {string} location - Location of status change
 * @param {string} description - Description of status change
 * @returns {Promise<Shipment>}
 */
shipmentSchema.methods.updateStatus = async function (newStatus, location = '', description = '') {
    return this.addTimelineEvent({
        status: newStatus,
        location,
        description,
    });
};

/**
 * Mark as picked up
 * @param {string} location - Pickup location
 * @returns {Promise<Shipment>}
 */
shipmentSchema.methods.markPickedUp = async function (location = '') {
    this.pickupDate = new Date();
    return this.updateStatus('Picked Up', location, 'Package picked up from sender');
};

/**
 * Mark as delivered
 * @param {string} recipientName - Name of recipient who signed
 * @returns {Promise<Shipment>}
 */
shipmentSchema.methods.markDelivered = async function (recipientName = '') {
    this.actualDelivery = new Date();
    if (recipientName) {
        this.recipientName = recipientName;
    }
    return this.updateStatus('Delivered', this.destination?.city || '', 'Package delivered successfully');
};

/**
 * Mark as exception
 * @param {string} reason - Exception reason
 * @param {string} location - Location of exception
 * @returns {Promise<Shipment>}
 */
shipmentSchema.methods.markException = async function (reason, location = '') {
    this.statusDetails = reason;
    return this.updateStatus('Exception', location, reason);
};

/**
 * Check if delivery is on time
 * @returns {boolean}
 */
shipmentSchema.methods.isOnTime = function () {
    if (!this.estimatedDelivery) return true;

    if (this.isDelivered) {
        return this.actualDelivery <= this.estimatedDelivery;
    }

    return new Date() <= this.estimatedDelivery;
};

// ============================================
// Static Methods
// ============================================

/**
 * Find by tracking number
 * @param {string} trackingNumber - Tracking number
 * @returns {Promise<Shipment|null>}
 */
shipmentSchema.statics.findByTracking = function (trackingNumber) {
    return this.findOne({ trackingNumber: trackingNumber.toUpperCase() })
        .populate('clientId', 'fullName email phone')
        .populate('requestId', 'requestNumber itemName');
};

/**
 * Find active shipments for a client
 * @param {ObjectId} clientId - Client ID
 * @returns {Promise<Shipment[]>}
 */
shipmentSchema.statics.findActiveByClient = function (clientId) {
    return this.find({
        clientId,
        status: { $nin: ['Delivered', 'Returned', 'Cancelled'] }
    }).sort({ createdAt: -1 });
};

/**
 * Find all shipments for a client
 * @param {ObjectId} clientId - Client ID
 * @returns {Promise<Shipment[]>}
 */
shipmentSchema.statics.findByClient = function (clientId) {
    return this.find({ clientId })
        .sort({ createdAt: -1 });
};

/**
 * Find shipments requiring attention (exceptions, delayed)
 * @returns {Promise<Shipment[]>}
 */
shipmentSchema.statics.findRequiringAttention = function () {
    const now = new Date();
    return this.find({
        $or: [
            { status: 'Exception' },
            {
                status: { $nin: ['Delivered', 'Returned', 'Cancelled'] },
                estimatedDelivery: { $lt: now }
            }
        ]
    })
        .populate('clientId', 'fullName email')
        .sort({ estimatedDelivery: 1 });
};

/**
 * Get shipment statistics for a client
 * @param {ObjectId} clientId - Client ID
 * @returns {Promise<Object>}
 */
shipmentSchema.statics.getClientStats = async function (clientId) {
    const stats = await this.aggregate([
        { $match: { clientId: new mongoose.Types.ObjectId(clientId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const result = {
        total: 0,
        active: 0,
        delivered: 0,
        inTransit: 0,
        exceptions: 0,
    };

    stats.forEach(s => {
        result.total += s.count;
        if (s._id === 'Delivered') {
            result.delivered = s.count;
        } else if (s._id === 'In Transit') {
            result.inTransit = s.count;
        } else if (s._id === 'Exception') {
            result.exceptions = s.count;
        } else if (!['Returned', 'Cancelled'].includes(s._id)) {
            result.active += s.count;
        }
    });

    return result;
};

// ============================================
// Helper Functions
// ============================================

/**
 * Generate unique tracking number
 * @returns {Promise<string>} - Generated tracking number (e.g., "LMS1234567890")
 */
async function generateTrackingNumber() {
    const prefix = 'LMS';
    let trackingNumber;
    let isUnique = false;

    while (!isUnique) {
        // Generate a 10-digit random number
        const randomPart = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        trackingNumber = `${prefix}${randomPart}`;

        const existing = await mongoose.model('Shipment').findOne({ trackingNumber });
        if (!existing) {
            isUnique = true;
        }
    }

    return trackingNumber;
}

module.exports = mongoose.model('Shipment', shipmentSchema);
