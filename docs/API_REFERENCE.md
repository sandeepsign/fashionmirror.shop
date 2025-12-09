# Mirror.Me Widget API Reference

## Overview

The Mirror.Me Widget API allows e-commerce platforms to integrate virtual try-on capabilities into their websites. This document provides complete API documentation for merchants integrating the widget.

## Base URL

```
Production: https://api.fashionmirror.shop
Development: http://localhost:5000
```

## Authentication

All widget API endpoints require authentication using a merchant API key. Include the key in the `X-Merchant-Key` header:

```http
X-Merchant-Key: mk_test_your_api_key_here
```

### Key Types

| Key Type | Prefix | Usage |
|----------|--------|-------|
| Test Key | `mk_test_` | Development and testing. Allows localhost domains. |
| Live Key | `mk_live_` | Production. Only allows whitelisted domains. |

## Rate Limits

| Limit Type | Requests | Window |
|------------|----------|--------|
| Per Merchant | 100 | 1 minute |
| Per IP | 20 | 1 minute |
| Try-on per Session | 3 | Session lifetime |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Widget Endpoints

### Create Session

Initialize a new try-on session for a product.

```http
POST /api/widget/session
```

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| X-Merchant-Key | Yes | Your merchant API key |
| Content-Type | Yes | `application/json` |
| Origin | Recommended | Your website origin for CORS |

#### Request Body

```json
{
  "product": {
    "id": "prod_123",
    "name": "Summer Floral Dress",
    "image": "https://example.com/dress.jpg",
    "category": "dress",
    "price": 89.99,
    "currency": "USD"
  },
  "user": {
    "id": "user_456"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| product.id | string | Yes | Unique product identifier |
| product.name | string | Yes | Product display name |
| product.image | string | Yes | Product image URL (must be accessible) |
| product.category | string | No | Product category (dress, top, bottom, etc.) |
| product.price | number | No | Product price |
| product.currency | string | No | Currency code (USD, EUR, etc.) |
| user.id | string | No | Your user identifier for analytics |

#### Response

```json
{
  "success": true,
  "data": {
    "sessionId": "ses_abc123xyz",
    "expiresAt": "2024-01-15T12:00:00Z",
    "maxTryOns": 3,
    "widgetUrl": "https://api.fashionmirror.shop/widget/try-on?session=ses_abc123xyz"
  }
}
```

---

### Get Session

Retrieve the current status of a session.

```http
GET /api/widget/session/:sessionId
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "ses_abc123xyz",
    "status": "pending",
    "tryOnCount": 0,
    "maxTryOns": 3,
    "product": {
      "id": "prod_123",
      "name": "Summer Floral Dress",
      "image": "https://example.com/dress.jpg"
    },
    "expiresAt": "2024-01-15T12:00:00Z"
  }
}
```

#### Session Status

| Status | Description |
|--------|-------------|
| `pending` | Session created, waiting for user photo |
| `processing` | Try-on generation in progress |
| `completed` | Try-on completed, result available |
| `failed` | Try-on generation failed |
| `expired` | Session has expired |

---

### Submit Try-On

Submit a user photo to generate the virtual try-on.

```http
POST /api/widget/session/:sessionId/try-on
```

#### Option 1: URL-based

```json
{
  "userPhotoUrl": "https://example.com/user-photo.jpg"
}
```

#### Option 2: Base64

```json
{
  "userPhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

#### Option 3: Form Upload

```http
Content-Type: multipart/form-data
```

| Field | Type | Description |
|-------|------|-------------|
| userPhoto | file | User photo file (JPG, PNG) |

#### Response

```json
{
  "success": true,
  "data": {
    "sessionId": "ses_abc123xyz",
    "status": "processing",
    "tryOnCount": 1,
    "message": "Try-on generation started"
  }
}
```

---

### Get Result

Retrieve the try-on result.

```http
GET /api/widget/session/:sessionId/result
```

#### Response (Completed)

```json
{
  "success": true,
  "data": {
    "status": "completed",
    "resultImage": "https://api.fashionmirror.shop/media/results/result_abc123.jpg",
    "resultImageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "generatedAt": "2024-01-15T11:30:00Z"
  }
}
```

#### Response (Processing)

```json
{
  "success": true,
  "data": {
    "status": "processing",
    "message": "Try-on is being generated. Please check back shortly."
  }
}
```

---

### Poll Result (Server-Sent Events)

Stream real-time updates for try-on status.

```http
GET /api/widget/session/:sessionId/poll
Accept: text/event-stream
```

#### Events

```
event: status
data: {"status": "processing", "progress": 50}

event: completed
data: {"status": "completed", "resultImage": "https://..."}

event: error
data: {"status": "failed", "error": "PROCESSING_FAILED"}
```

---

## Merchant API Endpoints

### Authentication

#### Register

```http
POST /api/merchants/auth/register
```

```json
{
  "email": "merchant@example.com",
  "password": "securePassword123!",
  "businessName": "Example Store"
}
```

#### Login

```http
POST /api/merchants/auth/login
```

```json
{
  "email": "merchant@example.com",
  "password": "securePassword123!"
}
```

#### Logout

```http
POST /api/merchants/auth/logout
```

---

### Profile Management

#### Get Profile

```http
GET /api/merchants/profile
```

Requires session authentication.

#### Update Profile

```http
PUT /api/merchants/profile
```

```json
{
  "businessName": "Updated Store Name",
  "webhookUrl": "https://example.com/webhook"
}
```

---

### API Key Management

#### Regenerate Keys

```http
POST /api/merchants/keys/regenerate
```

```json
{
  "type": "test"
}
```

| type | Description |
|------|-------------|
| `test` | Regenerate test key only |
| `live` | Regenerate live key only |
| `both` | Regenerate both keys |

---

### Domain Management

#### List Domains

```http
GET /api/merchants/domains
```

#### Add Domain

```http
POST /api/merchants/domains
```

```json
{
  "domain": "*.example.com"
}
```

Supports wildcard subdomains: `*.example.com`

#### Remove Domain

```http
DELETE /api/merchants/domains/:domain
```

---

### Webhook Configuration

#### Update Webhook URL

```http
PUT /api/merchants/webhook
```

```json
{
  "url": "https://example.com/webhook"
}
```

#### Test Webhook

```http
POST /api/merchants/webhook/test
```

Sends a test event to your configured webhook URL.

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Technical error description",
    "userMessage": "User-friendly error message",
    "details": {},
    "requestId": "req_abc123"
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_MERCHANT_KEY` | 401 | API key is invalid or revoked |
| `DOMAIN_NOT_ALLOWED` | 403 | Origin not in allowed domains |
| `MERCHANT_SUSPENDED` | 403 | Account suspended |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `QUOTA_EXCEEDED` | 402 | Monthly try-on limit reached |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `SESSION_NOT_FOUND` | 404 | Session doesn't exist |
| `SESSION_EXPIRED` | 410 | Session has expired |
| `INVALID_USER_IMAGE` | 400 | User photo couldn't be processed |
| `INVALID_PRODUCT_IMAGE` | 400 | Product image couldn't be loaded |
| `PROCESSING_FAILED` | 500 | AI generation failed |

---

## Webhooks

### Events

| Event | Description |
|-------|-------------|
| `session.created` | New try-on session started |
| `try-on.processing` | Try-on generation started |
| `try-on.completed` | Try-on successfully generated |
| `try-on.failed` | Try-on generation failed |
| `test` | Test event for webhook verification |

### Payload Format

```json
{
  "event": "try-on.completed",
  "timestamp": 1705320600,
  "data": {
    "sessionId": "ses_abc123xyz",
    "merchantId": 1,
    "product": {
      "id": "prod_123",
      "name": "Summer Dress"
    },
    "resultImage": "https://..."
  }
}
```

### Signature Verification

Verify webhook signatures using the `X-Webhook-Signature` header:

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret, timestamp) {
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = `sha256=${crypto
    .createHash('sha256')
    .update(signedPayload)
    .update(secret)
    .digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Retry Policy

Failed webhook deliveries are retried with exponential backoff:
- 1st retry: 1 second
- 2nd retry: 5 seconds
- 3rd retry: 30 seconds

---

## SDK Examples

### JavaScript/TypeScript

```typescript
const MERCHANT_KEY = 'mk_test_your_key';
const API_BASE = 'https://api.fashionmirror.shop';

async function createTryOnSession(product: Product) {
  const response = await fetch(`${API_BASE}/api/widget/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Merchant-Key': MERCHANT_KEY,
    },
    body: JSON.stringify({ product }),
  });

  return response.json();
}

async function submitTryOn(sessionId: string, photoUrl: string) {
  const response = await fetch(
    `${API_BASE}/api/widget/session/${sessionId}/try-on`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Merchant-Key': MERCHANT_KEY,
      },
      body: JSON.stringify({ userPhotoUrl: photoUrl }),
    }
  );

  return response.json();
}

async function pollResult(sessionId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(
      `${API_BASE}/api/widget/session/${sessionId}/poll`
    );

    eventSource.addEventListener('completed', (e) => {
      const data = JSON.parse(e.data);
      resolve(data.resultImage);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e) => {
      reject(new Error('Try-on failed'));
      eventSource.close();
    });
  });
}
```

### Python

```python
import requests
import hmac
import hashlib

MERCHANT_KEY = 'mk_test_your_key'
API_BASE = 'https://api.fashionmirror.shop'

def create_session(product):
    response = requests.post(
        f'{API_BASE}/api/widget/session',
        json={'product': product},
        headers={'X-Merchant-Key': MERCHANT_KEY}
    )
    return response.json()

def verify_webhook(payload, signature, secret, timestamp):
    signed_payload = f'{timestamp}.{payload}'
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)
```

---

## Support

For technical support or questions:
- Email: support@fashionmirror.shop
- Documentation: https://docs.fashionmirror.shop
- Status: https://status.fashionmirror.shop
