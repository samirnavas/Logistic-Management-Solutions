const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { protect } = require('../middleware/auth');

// ============================================
// Standard CRUD
// ============================================

// Create new quotation (Standard creation)
router.post('/', protect, quotationController.createQuotation);

// Get list of quotations
// Note: Controller differentiates between Manager (all) and Client (own) via query or separate endpoints usually,
// but here we map root GET to getAllQuotations as requested.
router.get('/', protect, quotationController.getAllQuotations);

// Get quotation details by ID
router.get('/:id', protect, quotationController.getQuotation);


// ============================================
// The "Perfect Flow" Actions (New Logic)
// ============================================

// Save as Draft (Client: Save without submitting)
router.post('/draft', protect, quotationController.saveAsDraft);

// Submit Quotation (Transition DRAFT -> PENDING_REVIEW)
// Added to ensure the draft workflow can be completed
router.put('/:id/submit', protect, quotationController.submitQuotation);

// Mark as Verified (Admin: Ops check)
router.put('/:id/verify', protect, quotationController.markAsVerified);

// Request Clarification (Admin: Ask for info)
// Note: Added :id parameter as controller expects req.params.id
router.post('/:id/request-clarification', protect, quotationController.requestClarification);

// Submit Clarification (Client: Respond to info request)
router.put('/:id/submit-clarification', protect, quotationController.submitClarification);

// Request Revision (Client: Negotiate price)
router.put('/:id/request-revision', protect, quotationController.requestRevision);

// Accept Quotation (Client: Finalize & Book)
router.post('/:id/accept', protect, quotationController.acceptByClient);

// Reject Quotation (Mapping to rejectQuotation as requested)
// Note: This endpoint maps to the manager rejection logic based on the requested function name.
router.put('/:id/reject', protect, quotationController.rejectQuotation);


// ============================================
// Client Specific Routes (Legacy/Helper Support)
// ============================================

// Get quotations for a specific client
router.get('/client/:clientId', protect, quotationController.getClientQuotations);

// Get single quotation for client (with visibility check)
router.get('/client/:clientId/:id', protect, quotationController.getClientQuotation);

// Update address details
router.put('/:id/address', protect, quotationController.updateAddress);

// Confirm address and proceed
router.put('/:id/confirm-address', protect, quotationController.confirmAddress);

// Approve request (manager - initial approval)
router.put('/:id/approve', protect, quotationController.approveRequest);

// Approve quotation (manager - final approval)
router.patch('/:id/approve', protect, quotationController.approveByManager);

// Send quotation to client app
router.patch('/:id/send', protect, quotationController.sendToClient);


module.exports = router;
