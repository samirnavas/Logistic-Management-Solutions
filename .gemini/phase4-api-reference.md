# Phase 4 API Reference - Client Negotiation & Booking

## Quick Reference

### New Endpoint

#### Request Revision
```http
POST /api/quotations/:id/request-revision
Authorization: Bearer <client-token>
Content-Type: application/json
```

### Updated Endpoint

#### Accept Quotation (with strict validation)
```http
PATCH /api/quotations/:id/accept
Authorization: Bearer <client-token>
```

---

## 1. Request Revision Endpoint

### Purpose
Allow clients to request price revisions or negotiate terms on sent quotations.

### Authentication
Required - Client must be authenticated

### Request

**Method:** `POST`  
**Endpoint:** `/api/quotations/:id/request-revision`

**Headers:**
```
Authorization: Bearer <client-token>
Content-Type: application/json
```

**Body:**
```json
{
  "reason": "Price is too high for our budget. Can you offer a 10% discount?"
}
```

**Parameters:**
| Field  | Type   | Required | Description                              |
|--------|--------|----------|------------------------------------------|
| reason | string | Yes      | Explanation for revision request         |

### Response

#### Success (200 OK)
```json
{
  "message": "Revision request submitted successfully",
  "quotation": {
    "_id": "65abc123def456",
    "quotationNumber": "QUO-20260131-000001",
    "status": "NEGOTIATION_REQUESTED",
    "totalAmount": 1000,
    "validUntil": "2026-02-15T00:00:00.000Z",
    "statusHistory": [
      {
        "status": "NEGOTIATION_REQUESTED",
        "changedBy": "65client789",
        "reason": "Client requested revision: Price is too high...",
        "timestamp": "2026-01-31T02:25:11.000Z"
      }
    ]
  },
  "negotiation": {
    "clientNotes": "Price is too high for our budget. Can you offer a 10% discount?",
    "adminResponse": "",
    "isActive": true
  }
}
```

#### Error Responses

**404 Not Found**
```json
{
  "message": "Quotation not found"
}
```

**400 Bad Request - Invalid Status**
```json
{
  "message": "Cannot request revision for this quotation",
  "error": "Current status is BOOKED. Revision can only be requested for sent quotations.",
  "currentStatus": "BOOKED"
}
```

**400 Bad Request - Missing Reason**
```json
{
  "message": "Reason is required",
  "error": "Please provide a reason for the revision request"
}
```

**500 Internal Server Error**
```json
{
  "message": "Failed to request revision",
  "error": "Database connection error"
}
```

### Business Rules

✅ **Can Request Revision When:**
- Status is `QUOTATION_SENT`
- Reason is provided and not empty

❌ **Cannot Request Revision When:**
- Status is NOT `QUOTATION_SENT` (e.g., DRAFT, ACCEPTED, BOOKED, EXPIRED)
- No reason provided
- Quotation doesn't exist

### Side Effects

1. **Status Change:** `QUOTATION_SENT` → `NEGOTIATION_REQUESTED`
2. **Negotiation Update:** 
   - `clientNotes` = provided reason
   - `isActive` = true
3. **Audit Log:** Entry added to `statusHistory`
4. **Notification:** Admin/Manager notified via system notification

---

## 2. Accept Quotation Endpoint (Updated)

### Purpose
Client accepts quotation, triggering automatic shipment creation and booking finalization.

### Authentication
Required - Client must be authenticated

### Request

**Method:** `PATCH`  
**Endpoint:** `/api/quotations/:id/accept`

**Headers:**
```
Authorization: Bearer <client-token>
```

**Body:** None required

### Response

#### Success (200 OK)
```json
{
  "message": "Quotation accepted, shipment created, and booking confirmed",
  "quotation": {
    "_id": "65abc123def456",
    "quotationNumber": "QUO-20260131-000001",
    "status": "BOOKED",
    "isAcceptedByClient": true,
    "clientAcceptedAt": "2026-01-31T02:25:11.000Z",
    "totalAmount": 1000,
    "statusHistory": [
      {
        "status": "ACCEPTED",
        "changedBy": "65client789",
        "reason": "Client accepted quotation",
        "timestamp": "2026-01-31T02:25:11.000Z"
      },
      {
        "status": "BOOKED",
        "changedBy": null,
        "reason": "Shipment created: SHP-20260131-ABC123",
        "timestamp": "2026-01-31T02:25:12.000Z"
      }
    ]
  },
  "trackingNumber": "SHP-20260131-ABC123",
  "shipmentId": "65xyz789def456",
  "status": "BOOKED"
}
```

#### Error Responses

**404 Not Found**
```json
{
  "message": "Quotation not found"
}
```

**400 Bad Request - Wrong Status**
```json
{
  "message": "Cannot accept this quotation",
  "error": "Current status is DRAFT. Only sent quotations can be accepted.",
  "currentStatus": "DRAFT"
}
```

**400 Bad Request - Expired**
```json
{
  "message": "Cannot accept an expired quotation",
  "error": "This quotation has passed its validity date. Please contact us for a new quote.",
  "validUntil": "2026-01-25T00:00:00.000Z",
  "expired": true
}
```

**500 Internal Server Error**
```json
{
  "message": "Failed to accept quotation",
  "error": "Shipment creation failed"
}
```

### Business Rules

✅ **Can Accept When:**
- Status is exactly `QUOTATION_SENT`
- `validUntil` date has NOT passed (or not set)

❌ **Cannot Accept When:**
- Status is NOT `QUOTATION_SENT`
- `validUntil` date has passed
- Quotation doesn't exist

### Validation Flow

```
1. Check quotation exists ──────────────→ 404 if not found
2. Check status = QUOTATION_SENT ──────→ 400 if wrong status
3. Check validUntil > now ─────────────→ 400 if expired
4. Update to ACCEPTED
5. Create shipment
6. Update to BOOKED
7. Return success response
```

### State Transitions

```
QUOTATION_SENT → ACCEPTED → BOOKED
                    ↓           ↓
            (Shipment     (Permanently
             Created)       Locked)
```

### Side Effects

1. **First Status Change:** `QUOTATION_SENT` → `ACCEPTED`
   - `isAcceptedByClient` = true
   - `clientAcceptedAt` = current timestamp
   - Audit log entry added

2. **Shipment Creation:**
   - New shipment document created
   - Package count calculated from items
   - Origin/destination mapped from quotation
   - Shipment status = `Processing`
   - Tracking number auto-generated

3. **Final Status Change:** `ACCEPTED` → `BOOKED`
   - Quotation permanently locked
   - Cannot be modified or negotiated
   - Audit log entry with tracking number
   - Changed by: `null` (System)

4. **Notification:**
   - Manager notified of acceptance and booking
   - Notification includes tracking number

---

## Complete Workflow Examples

### Example 1: Direct Acceptance

```javascript
// Step 1: Client views quotation
GET /api/quotations/client/65client123/65quote456

// Response:
{
  "quotationNumber": "QUO-20260131-000001",
  "status": "QUOTATION_SENT",
  "totalAmount": 1000,
  "validUntil": "2026-02-15T00:00:00.000Z",
  "pdfUrl": "https://..."
}

// Step 2: Client accepts
PATCH /api/quotations/65quote456/accept
Authorization: Bearer <client-token>

// Response:
{
  "message": "Quotation accepted, shipment created, and booking confirmed",
  "trackingNumber": "SHP-20260131-ABC123",
  "shipmentId": "65xyz789",
  "status": "BOOKED"
}

// Result: Booking complete, shipment in progress
```

---

### Example 2: Negotiation Flow

```javascript
// Step 1: Client views quotation
GET /api/quotations/client/65client123/65quote456

// Response: totalAmount = 1000

// Step 2: Client requests revision
POST /api/quotations/65quote456/request-revision
Authorization: Bearer <client-token>
Body: {
  "reason": "Price too high. Budget is $800. Can you match?"
}

// Response:
{
  "message": "Revision request submitted successfully",
  "quotation": {
    "status": "NEGOTIATION_REQUESTED",
    "negotiation": {
      "clientNotes": "Price too high. Budget is $800. Can you match?",
      "isActive": true
    }
  }
}

// Step 3: Admin reviews and updates (manual process)
// Admin goes to admin panel, sees negotiation request
// Admin updates pricing:
PUT /api/quotations/65quote456/update-price
Authorization: Bearer <admin-token>
Body: {
  "discount": 200,
  "status": "QUOTATION_GENERATED"
}

// Step 4: Admin re-sends quotation
PATCH /api/quotations/65quote456/send
Authorization: Bearer <admin-token>

// Response: status = QUOTATION_SENT, totalAmount = 800

// Step 5: Client views revised quotation
GET /api/quotations/client/65client123/65quote456

// Response: totalAmount = 800 (updated)

// Step 6: Client accepts revised quotation
PATCH /api/quotations/65quote456/accept
Authorization: Bearer <client-token>

// Response:
{
  "message": "Quotation accepted, shipment created, and booking confirmed",
  "trackingNumber": "SHP-20260131-ABC123",
  "status": "BOOKED"
}

// Result: Booking complete at negotiated price
```

---

### Example 3: Expired Quotation (Error Handling)

```javascript
// Step 1: Client views old quotation
GET /api/quotations/client/65client123/65quote456

// Response:
{
  "quotationNumber": "QUO-20260115-000001",
  "status": "EXPIRED",  // OR still QUOTATION_SENT if job hasn't run
  "totalAmount": 1000,
  "validUntil": "2026-01-25T00:00:00.000Z"  // Past date
}

// Step 2: Client tries to accept
PATCH /api/quotations/65quote456/accept
Authorization: Bearer <client-token>

// Response: 400 Bad Request
{
  "message": "Cannot accept an expired quotation",
  "error": "This quotation has passed its validity date. Please contact us for a new quote.",
  "validUntil": "2026-01-25T00:00:00.000Z",
  "expired": true
}

// Frontend should show:
// "This quote has expired. Please contact us for a new quotation."
```

---

## Frontend Integration Examples

### React Example - Request Revision

```javascript
import React, { useState } from 'react';

function NegotiationButton({ quotationId, status }) {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const requestRevision = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for your revision request');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/quotations/${quotationId}/request-revision`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const data = await response.json();
      console.log('Revision requested:', data);
      
      alert('Revision request submitted successfully!');
      setShowDialog(false);
      setReason('');
      
      // Refresh quotation data
      window.location.reload();
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Failed to request revision: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Only show button if status is QUOTATION_SENT
  if (status !== 'QUOTATION_SENT') return null;

  return (
    <>
      <button 
        onClick={() => setShowDialog(true)}
        className="btn-negotiate"
      >
        Request Better Price
      </button>

      {showDialog && (
        <div className="modal">
          <div className="modal-content">
            <h3>Request Revision</h3>
            <p>Tell us why you'd like a different price:</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Price is above budget, competitor quoted lower..."
              rows={4}
            />
            <div className="modal-actions">
              <button 
                onClick={requestRevision}
                disabled={loading || !reason.trim()}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button onClick={() => setShowDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

### React Example - Accept with Validation

```javascript
function AcceptButton({ quotation }) {
  const [loading, setLoading] = useState(false);
  
  const isExpired = new Date(quotation.validUntil) < new Date();
  const canAccept = quotation.status === 'QUOTATION_SENT' && !isExpired;

  const acceptQuotation = async () => {
    if (!canAccept) return;

    const confirm = window.confirm(
      `Are you sure you want to accept this quotation for $${quotation.totalAmount}? ` +
      `A shipment will be created immediately.`
    );

    if (!confirm) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/quotations/${quotation._id}/accept`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        
        // Handle specific error cases
        if (error.expired) {
          alert(
            'This quotation has expired. ' +
            'Please contact us for a new quote.'
          );
        } else if (error.currentStatus) {
          alert(
            `Cannot accept: ${error.error}`
          );
        } else {
          throw new Error(error.message);
        }
        return;
      }

      const data = await response.json();
      console.log('Quotation accepted:', data);
      
      // Show success message with tracking number
      alert(
        `Booking confirmed! ✓\n\n` +
        `Tracking Number: ${data.trackingNumber}\n` +
        `Shipment ID: ${data.shipmentId}\n\n` +
        `Your shipment is now being processed.`
      );
      
      // Redirect to shipment tracking page
      window.location.href = `/shipments/${data.shipmentId}`;
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Failed to accept quotation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={acceptQuotation}
        disabled={!canAccept || loading}
        className={canAccept ? 'btn-primary' : 'btn-disabled'}
      >
        {loading ? 'Processing...' : 
         isExpired ? 'Expired' :
         quotation.status !== 'QUOTATION_SENT' ? 'Not Available' :
         'Accept & Book Now'}
      </button>
      
      {isExpired && (
        <p className="error-text">
          This quotation expired on {new Date(quotation.validUntil).toLocaleDateString()}.
          Please contact us for a new quote.
        </p>
      )}
      
      {quotation.status === 'NEGOTIATION_REQUESTED' && (
        <p className="info-text">
          Awaiting admin response to your revision request...
        </p>
      )}
      
      {quotation.status === 'BOOKED' && (
        <p className="success-text">
          ✓ Booking confirmed! Tracking: {quotation.trackingNumber}
        </p>
      )}
    </div>
  );
}
```

---

## Status Codes Summary

| Code | Meaning              | When                                    |
|------|----------------------|-----------------------------------------|
| 200  | OK                   | Successful operation                    |
| 400  | Bad Request          | Invalid status, expired, missing reason |
| 404  | Not Found            | Quotation doesn't exist                 |
| 500  | Internal Error       | Server/database error                   |

---

## Common Error Scenarios & Solutions

### Error: "Cannot request revision for this quotation"
**Cause:** Status is not QUOTATION_SENT  
**Solution:** Only sent quotations can be negotiated

### Error: "Reason is required"
**Cause:** Empty or missing reason field  
**Solution:** Provide a meaningful reason for revision

### Error: "Cannot accept this quotation"
**Cause:** Status is not QUOTATION_SENT  
**Solution:** Quotation must be in sent status to accept

### Error: "Cannot accept an expired quotation"
**Cause:** validUntil date has passed  
**Solution:** Contact admin for new quotation with updated pricing

### Error: "Failed to accept quotation"
**Cause:** Server error during shipment creation  
**Solution:** Retry or contact support

---

## Best Practices

### Client Side
1. ✅ Check quotation status before showing action buttons
2. ✅ Display expiry date prominently
3. ✅ Validate reason text before submitting
4. ✅ Show loading states during API calls
5. ✅ Handle all error responses gracefully

### Backend
1. ✅ Always validate status before state transitions
2. ✅ Check expiry dates for time-sensitive operations
3. ✅ Maintain complete audit trail in statusHistory
4. ✅ Send notifications for all major state changes
5. ✅ Use atomic operations for multi-step processes

---

## Phase 4 Complete! 🎉

Your quotation system now supports:
- ✅ Client-initiated negotiations
- ✅ Strict validation for acceptance
- ✅ Automatic shipment creation
- ✅ Permanent booking locks
- ✅ Complete audit trails
