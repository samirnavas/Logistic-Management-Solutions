const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');

// ============================================
// Manager Routes
// ============================================

// Create new quotation
router.post('/', quotationController.createQuotation);

// Get all quotations (manager view)
router.get('/', quotationController.getAllQuotations);

// Update quotation
router.put('/:id', quotationController.updateQuotation);

// Approve quotation (manager)
router.patch('/:id/approve', quotationController.approveByManager);

// Send quotation to client
router.patch('/:id/send', quotationController.sendToClient);

// Get quotations for a specific request
router.get('/request/:requestId', quotationController.getByRequest);

// ============================================
// Client Routes
// ============================================

// Get quotations for a specific client
router.get('/client/:clientId', quotationController.getClientQuotations);

// Get single quotation for client (with visibility check)
router.get('/client/:clientId/:id', quotationController.getClientQuotation);

// Accept quotation (client)
router.patch('/:id/accept', quotationController.acceptByClient);

// Reject quotation (client)
router.patch('/:id/reject', quotationController.rejectByClient);

// Confirm address and proceed (client)
router.put('/:id/confirm-address', quotationController.confirmAddress);

// ============================================
// Common Routes
// ============================================

// Get single quotation by ID
router.get('/:id', quotationController.getQuotation);

// Delete quotation (admin only)
router.delete('/:id', quotationController.deleteQuotation);

module.exports = router;
