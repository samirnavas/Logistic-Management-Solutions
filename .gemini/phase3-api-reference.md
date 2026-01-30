# Phase 3 API Reference

## New Endpoints

### 1. Mark Quotation as Verified
**Endpoint:** `PUT /api/quotations/:id/verify`

**Description:** Operations team marks a quotation request as verified, confirming the job can be done.

**Authorization:** Required (Admin/Manager only)

**Request:**
```http
PUT /api/quotations/65abc123def456/verify HTTP/1.1
Host: localhost:5000
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "message": "Quotation request verified",
  "quotation": {
    "_id": "65abc123def456",
    "quotationNumber": "QUO-20260131-000001",
    "status": "VERIFIED",
    "statusHistory": [
      {
        "status": "VERIFIED",
        "changedBy": "65xyz789abc123",
        "reason": "Request verified by operations",
        "timestamp": "2026-01-31T02:19:08.000Z"
      }
    ],
    // ... other quotation fields
  }
}
```

**Response (Error - 404):**
```json
{
  "message": "Quotation not found"
}
```

**Response (Error - 403):**
```json
{
  "message": "Not authorized to verify requests"
}
```

---

### 2. Send Quotation to Client (Updated with Validations)
**Endpoint:** `PATCH /api/quotations/:id/send`

**Description:** Generates PDF and sends quotation to client. Now includes validation checks.

**Authorization:** Required (Admin/Manager only)

**New Validation Checks:**
1. ❌ Cannot send if status is `EXPIRED`
2. ❌ Cannot send if `totalAmount` is 0
3. ✅ Must have valid pricing before sending

**Request:**
```http
PATCH /api/quotations/65abc123def456/send HTTP/1.1
Host: localhost:5000
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "message": "Quotation generated, uploaded, and sent to client app",
  "quotation": {
    "_id": "65abc123def456",
    "status": "QUOTATION_SENT",
    "pdfUrl": "https://res.cloudinary.com/..."
  },
  "pdfUrl": "https://res.cloudinary.com/..."
}
```

**Response (Error - 400 - Expired):**
```json
{
  "message": "Cannot send an expired quotation to client",
  "error": "Quotation has already expired. Please create a new quotation."
}
```

**Response (Error - 400 - Zero Amount):**
```json
{
  "message": "Cannot send quotation with zero amount",
  "error": "Please calculate the quotation price before sending to client"
}
```

---

### 3. Check Expiry (Background Job)
**Function:** `quotationController.checkExpiry()`

**Description:** Automatically finds and expires quotations past their validity date.

**Usage:**
```javascript
// Call this function via cron job or manually
await quotationController.checkExpiry();
```

**Logic:**
- Finds all quotations with status `QUOTATION_SENT` and `validUntil < now`
- Updates status to `EXPIRED`
- Adds audit log entry

**Recommended Cron Schedule:**
```javascript
// Every hour
cron.schedule('0 * * * *', async () => {
    await quotationController.checkExpiry();
});

// Or every 30 minutes for more frequent checks
cron.schedule('*/30 * * * *', async () => {
    await quotationController.checkExpiry();
});
```

---

## Complete Workflow Example

### Step-by-Step: From Request to Sent

```javascript
// 1. Client creates quotation request
POST /api/quotations
{
  "origin": {...},
  "destination": {...},
  "items": [...],
  "cargoType": "General Cargo"
}
// Status: DRAFT

// 2. Operations verifies the request (NEW - Phase 3)
PUT /api/quotations/65abc123def456/verify
// Status: DRAFT → VERIFIED

// 3. Sales team calculates pricing
PUT /api/quotations/65abc123def456/update-price
{
  "items": [
    {
      "description": "Product A",
      "quantity": 10,
      "unitPrice": 100,
      "amount": 1000
    }
  ],
  "taxRate": 10,
  "discount": 50,
  "validUntil": "2026-02-15T00:00:00.000Z"
}
// Status: VERIFIED → QUOTATION_GENERATED
// totalAmount: 1000 + 100 - 50 = 1050

// 4. Sales sends to client (NEW VALIDATIONS - Phase 3)
PATCH /api/quotations/65abc123def456/send
// ✅ Validates: status !== 'EXPIRED'
// ✅ Validates: totalAmount > 0
// PDF generated and uploaded
// Status: QUOTATION_GENERATED → QUOTATION_SENT

// 5. Background job checks expiry (NEW - Phase 3)
// Runs automatically via cron
checkExpiry()
// If validUntil = 2026-02-15 and today = 2026-02-16
// Status: QUOTATION_SENT → EXPIRED
```

---

## Testing with cURL

### Test 1: Verify a Quotation
```bash
curl -X PUT http://localhost:5000/api/quotations/65abc123def456/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 2: Try to Send Expired Quotation (Should Fail)
```bash
# First, manually set a quotation to EXPIRED status in DB
# Then try to send it:
curl -X PATCH http://localhost:5000/api/quotations/65abc123def456/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Expected Response:
# {
#   "message": "Cannot send an expired quotation to client",
#   "error": "Quotation has already expired. Please create a new quotation."
# }
```

### Test 3: Try to Send Zero-Amount Quotation (Should Fail)
```bash
# Create a quotation with totalAmount = 0
# Then try to send it:
curl -X PATCH http://localhost:5000/api/quotations/65abc123def456/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Expected Response:
# {
#   "message": "Cannot send quotation with zero amount",
#   "error": "Please calculate the quotation price before sending to client"
# }
```

### Test 4: Successfully Send Valid Quotation
```bash
# Quotation with:
# - status !== 'EXPIRED'
# - totalAmount > 0
curl -X PATCH http://localhost:5000/api/quotations/65abc123def456/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Expected Response:
# {
#   "message": "Quotation generated, uploaded, and sent to client app",
#   "quotation": { ... },
#   "pdfUrl": "https://res.cloudinary.com/..."
# }
```

---

## Frontend Integration

### Example: Verify Button (Operations Dashboard)

```javascript
const verifyQuotation = async (quotationId) => {
  try {
    const response = await fetch(`/api/quotations/${quotationId}/verify`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Quotation verified:', data.quotation);
    
    // Update UI to show verified status
    updateQuotationStatus(quotationId, 'VERIFIED');
    showSuccessMessage('Quotation verified successfully');
    
  } catch (error) {
    console.error('Verification failed:', error);
    showErrorMessage(error.message);
  }
};
```

### Example: Send Button with Error Handling

```javascript
const sendQuotation = async (quotationId) => {
  try {
    const response = await fetch(`/api/quotations/${quotationId}/send`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific validation errors
      if (error.message.includes('expired')) {
        showErrorMessage('This quotation has expired. Please create a new one.');
      } else if (error.message.includes('zero amount')) {
        showErrorMessage('Please calculate pricing before sending.');
      } else {
        showErrorMessage(error.message);
      }
      
      return;
    }

    const data = await response.json();
    console.log('Quotation sent:', data);
    
    // Update UI
    updateQuotationStatus(quotationId, 'QUOTATION_SENT');
    showSuccessMessage('Quotation sent to client successfully');
    
  } catch (error) {
    console.error('Send failed:', error);
    showErrorMessage('Failed to send quotation');
  }
};
```

---

## Status Codes Reference

| Status Code | Meaning                        | When It Occurs                          |
|-------------|--------------------------------|----------------------------------------|
| 200         | OK                             | Successful operation                   |
| 400         | Bad Request                    | Validation failed (expired, zero amt)  |
| 403         | Forbidden                      | User not authorized                    |
| 404         | Not Found                      | Quotation doesn't exist                |
| 500         | Internal Server Error          | Server-side error                      |

---

## Important Notes

1. **Authorization:** All endpoints require valid JWT token in Authorization header
2. **Role-Based Access:** Only Admin and Manager can verify/send quotations
3. **Audit Trail:** All status changes are logged in `statusHistory`
4. **Expiry Automation:** Set up cron job for `checkExpiry()` function
5. **Validation Order:** Checks run in order: Expired → Zero Amount → (Optional) Verification

---

## Common Errors and Solutions

### Error: "Not authorized to verify requests"
**Solution:** Ensure user role is 'admin' or 'manager'

### Error: "Cannot send an expired quotation to client"
**Solution:** Create a new quotation or extend the validity date

### Error: "Cannot send quotation with zero amount"
**Solution:** Use `PUT /api/quotations/:id/update-price` to add pricing

### Error: "Quotation not found"
**Solution:** Check if quotation ID is correct and exists in database
