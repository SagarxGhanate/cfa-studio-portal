# CFA Studio — API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Authentication

### POST `/auth/login`

Login with email and password.

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "name": "Admin",
      "email": "admin@example.com"
    }
  }
}
```

**Errors:** `401` Invalid credentials, `400` Validation error

---

### POST `/auth/register`

Create a new admin account.

**Body:**
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "min6chars"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": { "token": "...", "user": { ... } }
}
```

**Errors:** `400` Email already exists, `400` Validation error

---

### POST `/auth/google-login`

Login or register via Google OAuth.

**Body:**
```json
{
  "credential": "google-id-token-from-frontend"
}
```

**Response (200):** Same as login response.

---

### GET `/auth/me` 🔒

Get current authenticated user.

**Response (200):**
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "Admin", "email": "admin@example.com" }
}
```

---

### PATCH `/auth/change-password` 🔒

Change the authenticated user's password.

**Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response (200):**
```json
{ "success": true, "message": "Password changed successfully" }
```

---

### POST `/auth/logout`

Logout (client-side token removal).

**Response (200):**
```json
{ "success": true, "message": "Logged out successfully" }
```

---

## Members

All member routes require authentication (🔒).

### GET `/members` 🔒

List members with pagination, search, and filters.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `search` | string | — | Search by name or phone |
| `status` | string | — | `active` or `inactive` |
| `classType` | string | — | `PERSONAL` or `GROUP` |
| `category` | string | — | `KIDS`, `TODDLERS`, or `ADULTS` |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "uuid",
        "name": "John Doe",
        "phone": "9876543210",
        "age": 25,
        "location": "Mumbai",
        "society": "Lodha Palava",
        "avatar": "data:image/jpeg;base64,...",
        "joiningDate": "2024-01-15T00:00:00.000Z",
        "isActive": true,
        "classType": "GROUP",
        "category": "ADULTS",
        "guardianName": null,
        "guardianPhone": null,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  }
}
```

---

### GET `/members/:id` 🔒

Get a single member by ID.

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Errors:** `404` Member not found

---

### POST `/members` 🔒

Create a new member.

**Body:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "age": 25,
  "location": "Mumbai",
  "society": "Lodha Palava",
  "avatar": "data:image/jpeg;base64,...",
  "joiningDate": "2024-01-15",
  "classType": "GROUP",
  "category": "ADULTS",
  "isActive": true,
  "guardianName": "Jane Doe",
  "guardianPhone": "9876543211"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | |
| `phone` | string | ✅ | |
| `age` | integer | ✅ | Must be > 0 |
| `location` | string | ✅ | |
| `society` | string | ❌ | |
| `avatar` | string | ❌ | Base64 encoded image |
| `joiningDate` | ISO8601 | ✅ | |
| `classType` | enum | ✅ | `PERSONAL` or `GROUP` |
| `category` | enum | ✅ | `KIDS`, `TODDLERS`, `ADULTS` |
| `isActive` | boolean | ❌ | Default: `true` |
| `guardianName` | string | ❌ | |
| `guardianPhone` | string | ❌ | |

**Response (201):**
```json
{ "success": true, "data": { ... } }
```

---

### PUT `/members/:id` 🔒

Update an existing member. All fields are optional.

**Body:** Same fields as create (all optional).

**Response (200):**
```json
{ "success": true, "data": { ... } }
```

---

### DELETE `/members/:id` 🔒

Delete a single member.

**Response (200):**
```json
{ "success": true, "message": "Member deleted successfully" }
```

---

### PATCH `/members/:id/status` 🔒

Toggle a member's active/inactive status.

**Response (200):**
```json
{
  "success": true,
  "data": { "id": "uuid", "isActive": false, ... }
}
```

---

### POST `/members/bulk` 🔒

Bulk import members from an array.

**Body:**
```json
{
  "members": [
    {
      "name": "John Doe",
      "phone": "9876543210",
      "age": 25,
      "location": "Mumbai",
      "joiningDate": "2024-01-15T00:00:00.000Z",
      "classType": "GROUP",
      "category": "ADULTS"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Imported 10 members (2 skipped)",
  "data": {
    "created": 10,
    "skipped": 2,
    "errors": ["Row 3: Name is required", "Row 7: Invalid class type"]
  }
}
```

---

### DELETE `/members/all` 🔒

Delete ALL members for the authenticated admin. **Irreversible.**

**Response (200):**
```json
{ "success": true, "message": "All members deleted successfully" }
```

---

### GET `/members/societies` 🔒

Get a list of unique society names (for autocomplete).

**Response (200):**
```json
{
  "success": true,
  "data": ["Lodha Palava", "Hiranandani Gardens", "Oberoi Sky City"]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": ["Field-level error 1", "Field-level error 2"]
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (invalid/missing token) |
| `404` | Not Found |
| `429` | Too Many Requests (rate limited) |
| `500` | Server Error |

---

## Rate Limiting

- **Login endpoint:** 10 requests per 15 minutes per IP
- All other endpoints: No rate limit (configurable in `index.js`)
