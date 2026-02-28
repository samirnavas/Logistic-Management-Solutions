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

// Get quotation statistics (Dashboard) - MUST be before /:id
router.get('/stats', protect, quotationController.getStats);

// Get quotation details by ID
router.get('/:id', protect, quotationController.getQuotation);

// Update quotation details (Generic update)
router.put('/:id', protect, quotationController.updateQuotation);

// Delete quotation (Admin/Client)
router.delete('/:id', protect, quotationController.deleteQuotation);


// ============================================
// The "Perfect Flow" Actions (New Logic)
// ============================================

// Save as Draft (Client: Save without submitting)
router.post('/draft', protect, quotationController.saveAsDraft);

// Submit Quotation (Transition DRAFT -> PENDING_ADMIN_REVIEW)
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

// Update quotation price (admin - pricing details)
router.put('/:id/update-price', protect, quotationController.updateQuotePrice);

// Send quotation to client app
router.patch('/:id/send', protect, quotationController.sendToClient);

// Send warehouse drop-off details to client (Admin only)
router.put('/:id/warehouse-details', protect, quotationController.sendWarehouseDetails);


// ============================================
// Iterative Quotation Workflow  (New State Machine)
// ============================================

/**
 * Phase 1 — Customer submits a new inquiry with routingData.
 * Creates the quotation and sets status to PENDING_ADMIN_REVIEW.
 * Replaces the old POST / for the new workflow; old POST / is still active for legacy clients.
 *
 * POST /api/quotations/workflow/inquire
 * Body: { routingData, items?, cargoType?, serviceType?, specialInstructions? }
 */
router.post('/workflow/inquire', protect, quotationController.createDraftQuotation);

/**
 * Phase 3 — Admin prices the base quote and sends it to the customer.
 * Guard: status must be PENDING_ADMIN_REVIEW.
 * Result: status → PENDING_CUSTOMER_APPROVAL.
 *
 * PATCH /api/quotations/:id/workflow/price
 * Body: { baseFreightCharge, itemizedCosts?, estimatedHandlingFee?, taxRate?, discount?, validUntil? }
 */
router.patch('/:id/workflow/price', protect, quotationController.adminPriceQuotation);

/**
 * Phase 3 (bounce-back) — Customer requests changes and sends the quote back.
 * Guard: status must be PENDING_CUSTOMER_APPROVAL AND isLocked must be false.
 * Result: revisionCount++, status → PENDING_ADMIN_REVIEW.
 *
 * PATCH /api/quotations/:id/workflow/revise
 * Body: { items?, specialInstructions?, additionalNotes?, revisionNotes? }
 */
router.patch('/:id/workflow/revise', protect, quotationController.customerReviseQuotation);

/**
 * Phase 4 — Customer accepts the base price and provides exact fulfillment addresses.
 * Guard: status must be PENDING_CUSTOMER_APPROVAL.
 * Result: isLocked = true, status → AWAITING_FINAL_CHARGE_SHEET.
 *
 * PATCH /api/quotations/:id/workflow/accept
 * Body: { fulfillmentDetails: { pickupType, deliveryType, pickupCity, deliveryCity, ... } }
 */
router.patch('/:id/workflow/accept', protect, quotationController.customerAcceptQuotation);

/**
 * Phase 5 — Admin adds first/last mile charges and issues the final charge sheet.
 * Guard: status must be AWAITING_FINAL_CHARGE_SHEET.
 * Result: calculateTotals() recalculates grand total, status → PAYMENT_PENDING.
 *
 * PATCH /api/quotations/:id/workflow/finalize-charges
 * Body: { firstMileCharge, lastMileCharge, additionalNotes?, internalNotes? }
 */
router.patch('/:id/workflow/finalize-charges', protect, quotationController.adminFinalizeChargeSheet);


module.exports = router;
