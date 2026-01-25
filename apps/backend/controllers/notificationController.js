const Notification = require('../models/Notification');

// ============================================
// Get notifications for a user (paginated)
// ============================================
exports.getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const result = await Notification.getForUser(userId, parseInt(page), parseInt(limit));

        res.json(result);
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
};

// ============================================
// Get unread notifications
// ============================================
exports.getUnread = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;

        const notifications = await Notification.getUnread(userId, parseInt(limit));

        res.json({ notifications });
    } catch (error) {
        console.error('Get Unread Error:', error);
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
};

// ============================================
// Get unread count (for badge)
// ============================================
exports.getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;

        const count = await Notification.getUnreadCount(userId);

        res.json({ count });
    } catch (error) {
        console.error('Get Unread Count Error:', error);
        res.status(500).json({ message: 'Failed to get count', error: error.message });
    }
};

// ============================================
// Mark single notification as read
// ============================================
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.markAsRead();

        res.json({
            message: 'Notification marked as read',
            notification,
        });
    } catch (error) {
        console.error('Mark As Read Error:', error);
        res.status(500).json({ message: 'Failed to update notification', error: error.message });
    }
};

// ============================================
// Mark all notifications as read
// ============================================
exports.markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await Notification.markAllAsRead(userId);

        res.json({
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error('Mark All As Read Error:', error);
        res.status(500).json({ message: 'Failed to update notifications', error: error.message });
    }
};

// ============================================
// Create notification (internal/admin use)
// ============================================
exports.createNotification = async (req, res) => {
    try {
        const {
            recipientId,
            title,
            message,
            type,
            category,
            relatedId,
            relatedModel,
            actionUrl,
        } = req.body;

        if (!recipientId || !title || !message) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['recipientId', 'title', 'message']
            });
        }

        const notification = await Notification.createNotification({
            recipientId,
            title,
            message,
            type: type || 'info',
            category: category || 'system',
            relatedId,
            relatedModel,
            actionUrl,
        });

        res.status(201).json({
            message: 'Notification created successfully',
            notification,
        });
    } catch (error) {
        console.error('Create Notification Error:', error);
        res.status(400).json({ message: 'Failed to create notification', error: error.message });
    }
};

// ============================================
// Delete a notification
// ============================================
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Delete Notification Error:', error);
        res.status(500).json({ message: 'Failed to delete notification', error: error.message });
    }
};

// ============================================
// Clear all notifications for a user
// ============================================
exports.clearAll = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await Notification.deleteMany({ recipientId: userId });

        res.json({
            message: 'All notifications cleared',
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('Clear All Error:', error);
        res.status(500).json({ message: 'Failed to clear notifications', error: error.message });
    }
};

// ============================================
// Get notifications by category
// ============================================
exports.getByCategory = async (req, res) => {
    try {
        const { userId, category } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find({ recipientId: userId, category })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Notification.countDocuments({ recipientId: userId, category })
        ]);

        res.json({
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + notifications.length < total,
            }
        });
    } catch (error) {
        console.error('Get By Category Error:', error);
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
};
