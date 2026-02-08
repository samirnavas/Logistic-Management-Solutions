const mongoose = require('mongoose');

// ============================================
// Notification Schema
// ============================================
const notificationSchema = new mongoose.Schema({
    // --- Recipient ---
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient ID is required'],
        index: true,
    },

    // --- Content ---
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        trim: true,
        maxlength: [500, 'Message cannot exceed 500 characters'],
    },

    // --- Type & Styling ---
    type: {
        type: String,
        enum: {
            values: ['info', 'success', 'warning', 'error'],
            message: 'Type must be info, success, warning, or error',
        },
        default: 'info',
        index: true,
    },

    // --- Category for grouping ---
    category: {
        type: String,
        enum: ['shipment', 'quotation', 'request', 'account', 'system', 'promotion'],
        default: 'system',
    },

    // --- Related Entity ---
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel',
    },
    relatedModel: {
        type: String,
        enum: ['Shipment', 'Quotation', 'User'],
    },

    // --- Action URL (for deep linking in the app) ---
    actionUrl: {
        type: String,
        trim: true,
        default: '',
    },

    // --- Status ---
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
    readAt: {
        type: Date,
    },

    // --- Delivery Status ---
    isPushSent: {
        type: Boolean,
        default: false,
    },
    pushSentAt: {
        type: Date,
    },
    isEmailSent: {
        type: Boolean,
        default: false,
    },
    emailSentAt: {
        type: Date,
    },

    // --- Expiry (auto-delete old notifications) ---
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },

}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
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
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, type: 1, isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// ============================================
// Virtual Fields
// ============================================

/**
 * Get time ago string
 */
notificationSchema.virtual('timeAgo').get(function () {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return created.toLocaleDateString();
});

// ============================================
// Instance Methods
// ============================================

/**
 * Mark notification as read
 * @returns {Promise<Notification>}
 */
notificationSchema.methods.markAsRead = async function () {
    if (!this.isRead) {
        this.isRead = true;
        this.readAt = new Date();
        return this.save();
    }
    return this;
};

/**
 * Mark notification as unread
 * @returns {Promise<Notification>}
 */
notificationSchema.methods.markAsUnread = async function () {
    if (this.isRead) {
        this.isRead = false;
        this.readAt = null;
        return this.save();
    }
    return this;
};

// ============================================
// Static Methods
// ============================================

/**
 * Get unread notifications for a user
 * @param {ObjectId} recipientId - User ID
 * @param {number} limit - Maximum notifications to return
 * @returns {Promise<Notification[]>}
 */
notificationSchema.statics.getUnread = function (recipientId, limit = 50) {
    return this.find({ recipientId, isRead: false })
        .sort({ createdAt: -1 })
        .limit(limit);
};

/**
 * Get all notifications for a user (paginated)
 * @param {ObjectId} recipientId - User ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Notifications per page
 * @returns {Promise<{notifications: Notification[], total: number, hasMore: boolean}>}
 */
notificationSchema.statics.getForUser = async function (recipientId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
        this.find({ recipientId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        this.countDocuments({ recipientId })
    ]);

    return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + notifications.length < total,
    };
};

/**
 * Get unread count for a user
 * @param {ObjectId} recipientId - User ID
 * @returns {Promise<number>}
 */
notificationSchema.statics.getUnreadCount = function (recipientId) {
    return this.countDocuments({ recipientId, isRead: false });
};

/**
 * Mark all notifications as read for a user
 * @param {ObjectId} recipientId - User ID
 * @returns {Promise<{modifiedCount: number}>}
 */
notificationSchema.statics.markAllAsRead = function (recipientId) {
    return this.updateMany(
        { recipientId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
    );
};

/**
 * Create a notification for a user
 * @param {Object} data - Notification data
 * @returns {Promise<Notification>}
 */
notificationSchema.statics.createNotification = async function ({
    recipientId,
    title,
    message,
    type = 'info',
    category = 'system',
    relatedId = null,
    relatedModel = null,
    actionUrl = '',
}) {
    const notification = new this({
        recipientId,
        title,
        message,
        type,
        category,
        relatedId,
        relatedModel,
        actionUrl,
    });

    return notification.save();
};

/**
 * Create shipment status notification
 * @param {ObjectId} recipientId - User ID
 * @param {Object} shipment - Shipment object
 * @param {string} status - New status
 * @returns {Promise<Notification>}
 */
notificationSchema.statics.createShipmentNotification = function (recipientId, shipment, status) {
    const statusMessages = {
        'Picked Up': { title: 'Shipment Picked Up', type: 'success' },
        'In Transit': { title: 'Shipment In Transit', type: 'info' },
        'Customs': { title: 'At Customs', type: 'warning' },
        'Customs Cleared': { title: 'Customs Cleared', type: 'success' },
        'Out for Delivery': { title: 'Out for Delivery', type: 'info' },
        'Delivered': { title: 'Shipment Delivered', type: 'success' },
        'Exception': { title: 'Delivery Exception', type: 'error' },
    };

    const config = statusMessages[status] || { title: 'Shipment Update', type: 'info' };

    return this.createNotification({
        recipientId,
        title: config.title,
        message: `Your shipment ${shipment.trackingNumber} is now "${status}"`,
        type: config.type,
        category: 'shipment',
        relatedId: shipment._id,
        relatedModel: 'Shipment',
        actionUrl: `/shipments/${shipment._id}`,
    });
};

/**
 * Create quotation notification
 * @param {ObjectId} recipientId - User ID
 * @param {Object} quotation - Quotation object
 * @param {string} event - Event type ('approved', 'sent', 'expired')
 * @returns {Promise<Notification>}
 */
notificationSchema.statics.createQuotationNotification = function (recipientId, quotation, event) {
    const eventMessages = {
        'approved': {
            title: 'Quotation Ready',
            message: `Your quotation ${quotation.quotationNumber} has been approved and is ready for review`,
            type: 'success',
        },
        'sent': {
            title: 'New Quotation',
            message: `A new quotation ${quotation.quotationNumber} is available for your review`,
            type: 'info',
        },
        'expired': {
            title: 'Quotation Expired',
            message: `Your quotation ${quotation.quotationNumber} has expired`,
            type: 'warning',
        },
    };

    const config = eventMessages[event] || {
        title: 'Quotation Update',
        message: `Quotation ${quotation.quotationNumber} has been updated`,
        type: 'info',
    };

    return this.createNotification({
        recipientId,
        title: config.title,
        message: config.message,
        type: config.type,
        category: 'quotation',
        relatedId: quotation._id,
        relatedModel: 'Quotation',
        actionUrl: `/quotations/${quotation._id}`,
    });
};

/**
 * Delete old read notifications
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {Promise<{deletedCount: number}>}
 */
notificationSchema.statics.deleteOldRead = function (daysOld = 30) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    return this.deleteMany({
        isRead: true,
        createdAt: { $lt: cutoffDate }
    });
};

module.exports = mongoose.model('Notification', notificationSchema);
