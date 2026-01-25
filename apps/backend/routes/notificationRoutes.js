const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// ============================================
// User Notification Routes
// ============================================

// Get all notifications for a user (paginated)
router.get('/user/:userId', notificationController.getNotifications);

// Get unread notifications
router.get('/user/:userId/unread', notificationController.getUnread);

// Get unread count (for badge)
router.get('/user/:userId/unread/count', notificationController.getUnreadCount);

// Mark all as read
router.patch('/user/:userId/read-all', notificationController.markAllAsRead);

// Clear all notifications
router.delete('/user/:userId/clear', notificationController.clearAll);

// Get notifications by category
router.get('/user/:userId/category/:category', notificationController.getByCategory);

// ============================================
// Individual Notification Routes
// ============================================

// Mark single notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Delete a notification
router.delete('/:id', notificationController.deleteNotification);

// ============================================
// Admin Routes
// ============================================

// Create notification (admin/system use)
router.post('/', notificationController.createNotification);

module.exports = router;
