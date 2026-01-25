const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');

// ============================================
// client app Routes
// ============================================

// Get shipments for a specific client
router.get('/client/:clientId', shipmentController.getClientShipments);

// Get active shipments for a client
router.get('/client/:clientId/active', shipmentController.getActiveShipments);

// Get shipment statistics for a client
router.get('/client/:clientId/stats', shipmentController.getClientStats);

// ============================================
// Tracking Routes
// ============================================

// Track by tracking number
router.get('/track/:trackingNumber', shipmentController.getShipmentByTracking);

// Get shipment timeline
router.get('/:id/timeline', shipmentController.getTimeline);

// ============================================
// Manager Routes
// ============================================

// Get all shipments (paginated)
router.get('/', shipmentController.getShipments);

// Get shipments by status
router.get('/status/:status', shipmentController.getShipmentsByStatus);

// Get shipments requiring attention
router.get('/attention/required', shipmentController.getRequiringAttention);

// Create shipment
router.post('/', shipmentController.createShipment);

// ============================================
// Status Update Routes
// ============================================

// Update status with timeline event
router.patch('/:id/status', shipmentController.updateStatus);

// Mark as picked up
router.patch('/:id/pickup', shipmentController.markPickedUp);

// Mark as delivered
router.patch('/:id/delivered', shipmentController.markDelivered);

// Mark as exception
router.patch('/:id/exception', shipmentController.markException);

// Add timeline event
router.post('/:id/timeline', shipmentController.addTimelineEvent);

// ============================================
// Common Routes
// ============================================

// Get single shipment by ID
router.get('/:id', shipmentController.getShipment);

// Update shipment details
router.put('/:id', shipmentController.updateShipment);

// Delete shipment
router.delete('/:id', shipmentController.deleteShipment);

module.exports = router;
