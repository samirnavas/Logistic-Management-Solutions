const express = require('express');
const router = express.Router();
const shipmentRequestController = require('../controllers/shipmentRequestController');

// ============================================
// Client Routes
// ============================================

// Create new shipment request
router.post('/', shipmentRequestController.createRequest);

// Get requests for a specific client
router.get('/client/:clientId', shipmentRequestController.getClientRequests);

// Cancel a request (client)
router.patch('/:id/cancel', shipmentRequestController.cancelRequest);

// ============================================
// Manager Routes
// ============================================

// Get all requests (manager view)
router.get('/', shipmentRequestController.getAllRequests);

// Get pending requests count (for dashboard)
router.get('/pending/count', shipmentRequestController.getPendingCount);

// Mark request as quoted
router.patch('/:id/quote', shipmentRequestController.markAsQuoted);

// Approve request
router.patch('/:id/approve', shipmentRequestController.approveRequest);

// Reject request
router.patch('/:id/reject', shipmentRequestController.rejectRequest);

// ============================================
// Common Routes
// ============================================

// Get single request by ID
router.get('/:id', shipmentRequestController.getRequest);

// Update request (only pending)
router.put('/:id', shipmentRequestController.updateRequest);

// Delete request (admin only)
router.delete('/:id', shipmentRequestController.deleteRequest);

module.exports = router;
