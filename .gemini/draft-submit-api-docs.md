# Draft & Submit Quotation API Implementation

## Summary
Successfully implemented dedicated endpoints for saving quotation drafts and submitting them for review, with proper validation and audit logging.

---

## 📍 New Endpoints

### 1. **Save as Draft**
- **Route:** `POST /api/quotations/draft`
- **Authentication:** Required (protected by auth middleware)
- **Access:** Client users only

**Purpose:** Allows clients to save partial quotation data as drafts without full validation.

**Key Features:**
- ✅ Accepts the same data structure as `createQuotation`
- ✅ **Status is STRICTLY set to 'DRAFT'** regardless of input
- ✅ Allows partial/incomplete data (no strict validation)
- ✅ Only requires `clientId` (derived from authenticated user)
- ✅ Initializes audit log with draft creation entry

**Request Body (all optional except auth):**
```json
{
  "origin": { "city": "Mumbai", "country": "India", "addressLine": "..." },
  "destination": { "city": "Dubai", "country": "UAE", "addressLine": "..." },
  "items": [
    {
      "description": "Electronics",
      "quantity": 10,
      "weight": 50
    }
  ],
  "pickupDate": "2026-02-15",
  "deliveryDate": "2026-02-20",
  "cargoType": "General Cargo",
  "serviceType": "Express",
  "specialInstructions": "Handle with care",
  "productPhotos": ["url1", "url2"],
  "validUntil": "2026-03-01",
  "termsAndConditions": "...",
  "additionalNotes": "..."
}
```

**Response:**
```json
{
  "message": "Draft saved successfully",
  "quotation": {
    "_id": "...",
    "status": "DRAFT",
    "clientId": "...",
    "statusHistory": [
      {
        "status": "DRAFT",
        "changedBy": "userId",
        "reason": "Draft created by client",
        "timestamp": "2026-01-31T..."
      }
    ],
    ...
  }
}
```

---

### 2. **Submit Quotation**
- **Route:** `PUT /api/quotations/:id/submit`
- **Authentication:** Required (protected by auth middleware)
- **Access:** Client users (must own the quotation)

**Purpose:** Transitions a DRAFT quotation to PENDING_REVIEW status with full validation.

**Validation Checks:**
1. ✅ **Ownership:** Only the client who created the draft can submit it
2. ✅ **Current Status:** Must be 'DRAFT' (cannot submit already submitted quotations)
3. ✅ **Required Fields:**
   - Origin address (city and country required)
   - Destination address (city and country required)
   - At least one item
   - Cargo type

**State Transition:**
```
DRAFT → PENDING_REVIEW
```

**Request:**
```http
PUT /api/quotations/60abc123def456/submit
Authorization: Bearer <token>
```

**Success Response:**
```json
{
  "message": "Quotation submitted successfully",
  "quotation": {
    "_id": "60abc123def456",
    "status": "PENDING_REVIEW",
    "statusHistory": [
      {
        "status": "DRAFT",
        "changedBy": "userId",
        "reason": "Draft created by client",
        "timestamp": "2026-01-31T..."
      },
      {
        "status": "PENDING_REVIEW",
        "changedBy": "userId",
        "reason": "Client submitted quotation for review",
        "timestamp": "2026-01-31T..."
      }
    ],
    ...
  },
  "status": "PENDING_REVIEW"
}
```

**Error Response (Validation Failed):**
```json
{
  "message": "Quotation validation failed",
  "errors": [
    "Origin address is incomplete (city and country required)",
    "Destination address is incomplete (city and country required)",
    "At least one item is required",
    "Cargo type is required"
  ],
  "hint": "Please complete all required fields before submitting"
}
```

**Error Response (Invalid Status):**
```json
{
  "message": "Cannot submit this quotation",
  "error": "Current status is PENDING_REVIEW. Only drafts can be submitted.",
  "currentStatus": "PENDING_REVIEW"
}
```

**Error Response (Not Authorized):**
```json
{
  "message": "Not authorized to submit this quotation",
  "error": "You can only submit your own quotations"
}
```

---

## 🔄 Workflow Example

### Typical User Flow:

1. **Client saves partial data as draft:**
   ```http
   POST /api/quotations/draft
   {
     "origin": { "city": "Mumbai", "country": "India" },
     "items": [{ "description": "Laptop", "quantity": 1 }]
   }
   ```
   → Status: `DRAFT`

2. **Client continues editing (can save multiple times):**
   ```http
   PUT /api/quotations/:id
   {
     "destination": { "city": "Dubai", "country": "UAE" },
     "cargoType": "Electronics"
   }
   ```
   → Status: Still `DRAFT`

3. **Client submits when ready:**
   ```http
   PUT /api/quotations/:id/submit
   ```
   → Status: `PENDING_REVIEW`
   → Manager receives notification
   → Full validation ensures all required fields are present

---

## 📝 Status History (Audit Log)

Every status change is tracked in the `statusHistory` array:

```javascript
statusHistory: [
  {
    status: "DRAFT",
    changedBy: ObjectId("userId"),
    reason: "Draft created by client",
    timestamp: ISODate("2026-01-31T...")
  },
  {
    status: "PENDING_REVIEW",
    changedBy: ObjectId("userId"),
    reason: "Client submitted quotation for review",
    timestamp: ISODate("2026-01-31T...")
  }
]
```

---

## 🔐 Security Features

1. **Authentication Required:** Both endpoints require a valid JWT token
2. **Ownership Verification:** Users can only submit their own drafts
3. **Status Validation:** Prevents invalid state transitions
4. **Audit Trail:** All changes are logged with user ID and timestamp

---

## 🧪 Testing Recommendations

### Test Case 1: Save Draft with Minimal Data
```bash
POST /api/quotations/draft
Authorization: Bearer <token>
Content-Type: application/json

{
  "cargoType": "General Cargo"
}
```
Expected: ✅ 201 Created, status = 'DRAFT'

### Test Case 2: Submit Incomplete Draft
```bash
PUT /api/quotations/:id/submit
Authorization: Bearer <token>
```
Expected: ❌ 400 Bad Request with validation errors

### Test Case 3: Submit Complete Draft
```bash
PUT /api/quotations/:id/submit
Authorization: Bearer <token>
```
(After completing all required fields)
Expected: ✅ 200 OK, status = 'PENDING_REVIEW'

### Test Case 4: Submit Non-Draft Quotation
```bash
PUT /api/quotations/:id/submit
```
(Where status is already 'PENDING_REVIEW')
Expected: ❌ 400 Bad Request, "Only drafts can be submitted"

### Test Case 5: Submit Another User's Draft
```bash
PUT /api/quotations/:id/submit
Authorization: Bearer <different_user_token>
```
Expected: ❌ 403 Forbidden, "You can only submit your own quotations"

---

## 📂 Files Modified

1. **`/apps/backend/controllers/quotationController.js`**
   - Added `saveAsDraft` function (lines 1057-1122)
   - Added `submitQuotation` function (lines 1124-1193)

2. **`/apps/backend/routes/quotationRoutes.js`**
   - Added `POST /draft` route (line 14-15)
   - Added `PUT /:id/submit` route (line 17-18)

---

## 🎯 Key Implementation Details

### `saveAsDraft` Function:
- Extracts user ID from `req.user.id` (populated by auth middleware)
- Creates new Quotation document with `status: 'DRAFT'`
- **CRUCIAL:** Status is hardcoded to 'DRAFT' regardless of request body
- Only adds fields that are present in request (conditional assignment)
- Initializes `statusHistory` with creation entry
- No strict validation - allows partial data

### `submitQuotation` Function:
- Verifies quotation exists and belongs to current user
- Checks current status is 'DRAFT'
- Validates all required fields:
  - Origin (city + country)
  - Destination (city + country)
  - Items array (non-empty)
  - Cargo type
- Returns detailed error messages for missing fields
- Updates status to 'PENDING_REVIEW'
- Adds audit log entry
- Optional notification to managers (placeholder for future enhancement)

---

## ✅ Implementation Complete

Both endpoints are now live and ready for use! The draft system allows clients to:
- Save work in progress without pressure
- Submit only when all information is ready
- Have full audit trail of all changes
- Receive clear validation feedback
