# Phase 3: Pricing & Expiry Engine - Implementation Summary

## Date: 2026-01-31
## Objective: Separate "Verify" step from "Price" step and handle expired quotes

---

## ✅ Implemented Features

### 1. **markAsVerified Endpoint** (Admin/Dispatcher/Manager Role)
**Location:** `apps/backend/controllers/quotationController.js` (Line 872-906)

**Purpose:** Allows Operations team to verify that a job can be done before the Sales team prices it.

**Features:**
- Updates quotation status to `'VERIFIED'`
- Adds audit log entry to `statusHistory` with:
  - Status: 'VERIFIED'
  - Changed by: Current user ID
  - Reason: 'Request verified by operations'
  - Timestamp: Current date/time
- Permission check: Only Admin and Manager roles can verify
- Returns updated quotation object

**HTTP Endpoint:** `PUT /api/quotations/:id/verify`

**Request:**
```json
{
  // No body required
}
```

**Response:**
```json
{
  "message": "Quotation request verified",
  "quotation": { /* quotation object */ }
}
```

---

### 2. **Updated sendToClient Endpoint** 
**Location:** `apps/backend/controllers/quotationController.js` (Line 377-533)

**New Validation Checks:**

#### Check 1: Prevent Expired Quotations
```javascript
if (quotation.status === 'EXPIRED') {
    return res.status(400).json({ 
        message: 'Cannot send an expired quotation to client',
        error: 'Quotation has already expired. Please create a new quotation.'
    });
}
```

#### Check 2: Prevent Zero Amount Quotations
```javascript
if (quotation.totalAmount === 0) {
    return res.status(400).json({ 
        message: 'Cannot send quotation with zero amount',
        error: 'Please calculate the quotation price before sending to client'
    });
}
```

#### Optional Check 3: Verification Enforcement (Commented)
```javascript
// Uncomment to enforce verification before sending
// if (quotation.status !== 'VERIFIED' && quotation.status !== 'QUOTATION_GENERATED') {
//     return res.status(400).json({ 
//         message: 'Quotation must be verified before sending to client',
//         currentStatus: quotation.status
//     });
// }
```

**Status Update:**
- The quotation model's `sendToClient()` method already sets status to `'QUOTATION_SENT'`
- This is the correct status as per the updated schema

---

### 3. **checkExpiry Function** (Middleware/Job)
**Location:** `apps/backend/controllers/quotationController.js` (Line 911-942)

**Purpose:** Automated job to find and expire quotations past their validity date

**Logic:**
1. Find all quotations where:
   - `status === 'QUOTATION_SENT'`
   - `validUntil < Date.now()`
2. For each expired quotation:
   - Update status to `'EXPIRED'`
   - Add audit log entry to `statusHistory`:
     - Status: 'EXPIRED'
     - Changed by: null (System)
     - Reason: 'Validity date passed'
     - Timestamp: Current date/time
3. Save the quotation

**Usage:**
```javascript
// Call this function periodically (e.g., via cron job)
await quotationController.checkExpiry();
```

**Note:** The function is ready to be attached to a cron job. Currently, it just performs the logic without scheduling.

---

## 📊 Status Flow

```
DRAFT → PENDING_REVIEW → VERIFIED → QUOTATION_GENERATED → QUOTATION_SENT → ACCEPTED/REJECTED
                ↓                                              ↓
         INFO_REQUIRED                                    EXPIRED
```

### Status Definitions:
- **DRAFT**: Initial state when quotation is created
- **PENDING_REVIEW**: Waiting for operations review
- **INFO_REQUIRED**: Admin requested clarification from client
- **VERIFIED**: Operations confirmed the job can be done (✅ NEW)
- **QUOTATION_GENERATED**: Pricing has been calculated
- **QUOTATION_SENT**: PDF generated and sent to client
- **EXPIRED**: Quotation validity date has passed (✅ ENFORCED)
- **ACCEPTED**: Client accepted the quotation
- **REJECTED**: Client/Manager rejected the quotation

---

## 🔐 Permission Matrix

| Endpoint           | Admin | Manager | Dispatcher | Client |
|-------------------|-------|---------|------------|--------|
| markAsVerified    | ✅    | ✅      | ❌*        | ❌     |
| sendToClient      | ✅    | ✅      | ❌         | ❌     |
| checkExpiry       | System (Automated) |      |            |        |

*Note: Dispatcher role can be added by modifying the permission check on line 881

---

## 🔄 Workflow Example

### Scenario: New Quotation Request to Sent

1. **Client creates request**
   - Status: `DRAFT` → `PENDING_REVIEW`

2. **Operations verifies feasibility** (✅ NEW)
   ```
   PUT /api/quotations/:id/verify
   ```
   - Status: `PENDING_REVIEW` → `VERIFIED`
   - Audit log entry created

3. **Sales team calculates price**
   ```
   PUT /api/quotations/:id/price
   ```
   - Status: `VERIFIED` → `QUOTATION_GENERATED`
   - `totalAmount` > 0

4. **Sales sends to client** (✅ VALIDATION ADDED)
   ```
   POST /api/quotations/:id/send
   ```
   - Validates: status !== 'EXPIRED'
   - Validates: totalAmount > 0
   - Generates PDF
   - Uploads to Cloudinary
   - Status: `QUOTATION_GENERATED` → `QUOTATION_SENT`

5. **Background job checks expiry** (✅ NEW)
   ```
   Cron job runs checkExpiry()
   ```
   - If `validUntil < now`: Status → `EXPIRED`
   - Audit log entry created

---

## 🧪 Testing Recommendations

### 1. Test markAsVerified
```bash
# Verify a quotation
curl -X PUT http://localhost:5000/api/quotations/:id/verify \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json"

# Expected: Status changes from PENDING_REVIEW to VERIFIED
# Expected: statusHistory has new entry
```

### 2. Test sendToClient with Validations
```bash
# Try to send expired quotation
# Expected: 400 error - "Cannot send an expired quotation"

# Try to send zero-amount quotation
# Expected: 400 error - "Cannot send quotation with zero amount"

# Send valid quotation
# Expected: Success, PDF generated, status = QUOTATION_SENT
```

### 3. Test checkExpiry
```javascript
// In your test file or console
const quotationController = require('./controllers/quotationController');
await quotationController.checkExpiry();
// Check database: QUOTATION_SENT items past validUntil should now be EXPIRED
```

---

## 📝 Next Steps

### To Complete Phase 3:

1. **Add Cron Job for checkExpiry** (Recommended)
   ```javascript
   // In your main server file or jobs/scheduler.js
   const cron = require('node-cron');
   
   // Run every hour
   cron.schedule('0 * * * *', async () => {
       await quotationController.checkExpiry();
   });
   ```

2. **Add Dispatcher Role** (Optional)
   - Update User model to add 'dispatcher' role
   - Modify line 881 in quotationController.js:
     ```javascript
     if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'dispatcher')
     ```

3. **Update API Routes** (If not already done)
   ```javascript
   // In routes/quotationRoutes.js
   router.put('/:id/verify', authMiddleware, quotationController.markAsVerified);
   ```

4. **Add Client Notifications** (Enhancement)
   - When quotation expires, notify client
   - When quotation is verified, notify sales team

5. **Frontend Updates**
   - Add "Verify" button for operations team
   - Show verification status in quotation list
   - Disable "Send" button if not verified (if enforcing verification)
   - Show expiry warnings near validity date

---

## 💡 Business Logic Notes

- **Free Services:** Currently, all zero-amount quotations are blocked. If you have legitimate free services, add a flag like `isFreeService` and modify the check on line 430.

- **Verification Enforcement:** The optional verification check (line 448-453) is commented out. Uncomment if you want to strictly enforce that quotations must be verified before sending.

- **Expiry Notifications:** The checkExpiry function currently just updates the status. Consider adding notifications to inform clients/managers about expiration.

---

## 🎯 Summary

Phase 3 implementation successfully:
1. ✅ Separates verification from pricing workflow
2. ✅ Prevents sending expired quotations
3. ✅ Prevents sending unpiced (zero-amount) quotations
4. ✅ Provides automated expiry detection and status update
5. ✅ Maintains complete audit trail via statusHistory

The system now has a robust three-step workflow:
**Verify → Price → Send**

with proper validation at each stage.
