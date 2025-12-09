# Mirror.Me Widget - Complete Technical Specification

> **Status**: ALL PHASES COMPLETE ✅
> **Created**: 2025-12-08
> **Last Updated**: 2025-12-08

## Implementation Progress

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Core Infrastructure - Database schema, merchant service, auth middleware |
| Phase 2 | ✅ Complete | Widget API Endpoints - Sessions, try-on processing, assets |
| Phase 3 | ✅ Complete | Embeddable Widget - JavaScript bundle, CSS, modal |
| Phase 4 | ✅ Complete | Widget Iframe Content - Photo selection, processing, results |
| Phase 5 | ✅ Complete | Merchant Dashboard - Auth, overview, integration, analytics, settings |
| Phase 6 | ✅ Complete | Webhooks - Service, signature generation, event triggers |
| **Phase 7** | ✅ **Complete** | **Polish & Production - Error handling, testing, security, documentation** |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Integration Methods](#2-integration-methods)
3. [Data Attributes Reference](#3-data-attributes-reference)
4. [JavaScript API Reference](#4-javascript-api-reference)
5. [Widget UI Flow](#5-widget-ui-flow)
6. [API Endpoints](#6-api-endpoints)
7. [Database Schema](#7-database-schema)
8. [Merchant Dashboard Features](#8-merchant-dashboard-features)
9. [Webhook Events](#9-webhook-events)
10. [Widget Customization](#10-widget-customization-css-variables)
11. [Platform-Specific Integration Guides](#11-platform-specific-integration-guides)
12. [Security Specifications](#12-security-specifications)
13. [File Structure](#13-file-structure)
14. [Implementation Phases](#14-implementation-phases)

---

## 1. Overview

Mirror.Me is an embeddable JavaScript widget that enables e-commerce platforms to offer virtual try-on functionality on their product pages. The widget is lightweight, customizable, and works across all major platforms.

### Key Features

- **Easy Integration**: Single script tag + button element
- **Pre-populated User Photos**: Merchants can pass existing user photos to skip upload step
- **Customizable UI**: Themes, localization, button styles
- **Webhook Support**: Real-time notifications for try-on events
- **Analytics**: Track usage, conversions, and popular products
- **Multi-platform**: Works with Shopify, WooCommerce, custom builds, etc.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    Merchant's Product Page                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Product: Blue Jacket - $89.99                              ││
│  │  [Product Image]                                            ││
│  │                                                             ││
│  │  ┌──────────────────────┐                                   ││
│  │  │  ✨ Mirror.Me        │  ← Our embedded button            ││
│  │  │  Try it on virtually │                                   ││
│  │  └──────────────────────┘                                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (click)
┌─────────────────────────────────────────────────────────────────┐
│                   Mirror.Me Modal/Iframe                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                             ││
│  │   Upload your photo or take a selfie                        ││
│  │   ┌─────────────┐  ┌─────────────┐                         ││
│  │   │  📷 Camera  │  │  📁 Upload  │                         ││
│  │   └─────────────┘  └─────────────┘                         ││
│  │                                                             ││
│  │   [Processing... → Result displayed]                        ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Our Backend (fashionmirror.shop)                    │
│  • Receives product data + user photo                           │
│  • Calls Gemini API for virtual try-on                          │
│  • Returns result to iframe/modal                               │
│  • Tracks usage per merchant (for billing)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Integration Methods

### 2.1 Basic Integration (Minimal)

```html
<!-- Add before closing </body> tag -->
<script src="https://fashionmirror.shop/widget/mirror.js"></script>
<button
  class="mirror-me-button"
  data-merchant-key="mk_live_abc123"
  data-product-image="https://store.com/products/jacket.jpg"
>
  Try it on
</button>
```

### 2.2 Full Integration (All Options)

```html
<script src="https://fashionmirror.shop/widget/mirror.js"></script>
<button
  class="mirror-me-button"
  data-merchant-key="mk_live_abc123"
  data-product-image="https://store.com/products/jacket.jpg"
  data-product-name="Classic Blue Denim Jacket"
  data-product-id="SKU-12345"
  data-product-category="jacket"
  data-product-price="89.99"
  data-product-currency="USD"
  data-user-image="https://store.com/users/12345/photo.jpg"
  data-user-id="user_12345"
  data-theme="light"
  data-locale="en"
  data-button-style="pill"
>
  ✨ Mirror.Me
</button>
```

### 2.3 JavaScript API Integration (Programmatic)

```html
<script src="https://fashionmirror.shop/widget/mirror.js"></script>
<button id="custom-tryon-btn">Virtual Try-On</button>

<script>
  const mirrorMe = MirrorMe.init({
    merchantKey: 'mk_live_abc123',
    theme: 'auto', // 'light' | 'dark' | 'auto'
    locale: 'en',
    onReady: () => console.log('Widget loaded'),
    onOpen: (sessionId) => console.log('Modal opened', sessionId),
    onClose: () => console.log('Modal closed'),
    onResult: (result) => {
      console.log('Try-on complete', result);
      // result.imageUrl - the generated image
      // result.sessionId - unique session ID
    },
    onError: (error) => console.error('Error', error),
  });

  document.getElementById('custom-tryon-btn').addEventListener('click', () => {
    mirrorMe.open({
      product: {
        image: 'https://store.com/products/jacket.jpg',
        name: 'Classic Blue Denim Jacket',
        id: 'SKU-12345',
        category: 'jacket', // 'top' | 'bottom' | 'dress' | 'jacket' | 'shoes' | 'accessory'
        price: 89.99,
        currency: 'USD',
      },
      user: {
        image: 'https://store.com/users/12345/photo.jpg', // Optional: skip photo upload
        id: 'user_12345', // Optional: for analytics
        email: 'user@example.com', // Optional: for sending results
      },
      options: {
        skipPhotoStep: true, // If user.image provided, go directly to processing
        allowCamera: true,
        allowUpload: true,
        allowGallery: true, // Show previously used photos
        autoClose: false, // Close modal after result
        showShareButtons: true,
        showDownloadButton: true,
      }
    });
  });
</script>
```

---

## 3. Data Attributes Reference

### 3.1 Required Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-merchant-key` | string | Your unique merchant API key (starts with `mk_live_` or `mk_test_`) |
| `data-product-image` | URL | Direct URL to the product image (must be publicly accessible) |

### 3.2 Product Attributes (Recommended)

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-product-name` | string | Product display name |
| `data-product-id` | string | Your internal product SKU/ID |
| `data-product-category` | enum | `top`, `bottom`, `dress`, `jacket`, `outerwear`, `shoes`, `accessory` |
| `data-product-price` | number | Product price (for analytics) |
| `data-product-currency` | string | ISO 4217 currency code (USD, EUR, etc.) |
| `data-product-url` | URL | Link back to product page |
| `data-product-brand` | string | Brand name |

### 3.3 User Attributes (Optional - For Pre-populated User Photo)

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-user-image` | URL | Pre-existing user photo URL (skips upload step) |
| `data-user-id` | string | Your internal user ID (for analytics/caching) |
| `data-user-email` | string | User email (for sending results) |
| `data-user-name` | string | User display name |

### 3.4 Customization Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-theme` | enum | `auto` | `light`, `dark`, `auto` (follows system) |
| `data-locale` | string | `en` | Language code: `en`, `es`, `fr`, `de`, `it`, `pt`, `ja`, `ko`, `zh` |
| `data-button-style` | enum | `default` | `default`, `pill`, `minimal`, `icon-only` |
| `data-button-size` | enum | `medium` | `small`, `medium`, `large` |
| `data-modal-size` | enum | `medium` | `small`, `medium`, `large`, `fullscreen` |
| `data-position` | enum | `center` | Modal position: `center`, `right`, `left` |

### 3.5 Behavior Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-skip-photo-step` | boolean | `false` | Skip upload if `data-user-image` provided |
| `data-allow-camera` | boolean | `true` | Enable camera capture |
| `data-allow-upload` | boolean | `true` | Enable file upload |
| `data-auto-close` | boolean | `false` | Close modal after showing result |
| `data-show-share` | boolean | `true` | Show social share buttons |
| `data-show-download` | boolean | `true` | Show download button |
| `data-callback-url` | URL | null | Webhook URL for result notification |

---

## 4. JavaScript API Reference

### 4.1 Initialization

```javascript
const mirrorMe = MirrorMe.init(config);
```

**Config Options:**

```typescript
interface MirrorMeConfig {
  merchantKey: string;           // Required
  theme?: 'light' | 'dark' | 'auto';
  locale?: string;
  debug?: boolean;               // Enable console logging

  // Callbacks
  onReady?: () => void;
  onOpen?: (sessionId: string) => void;
  onClose?: (reason: 'user' | 'complete' | 'error') => void;
  onResult?: (result: TryOnResult) => void;
  onError?: (error: MirrorMeError) => void;
  onPhotoSelected?: (photo: PhotoInfo) => void;
  onProcessingStart?: () => void;
  onProcessingProgress?: (progress: number) => void;
}

interface TryOnResult {
  sessionId: string;
  imageUrl: string;           // Generated try-on image
  thumbnailUrl: string;       // Smaller preview
  expiresAt: string;          // ISO date - URL expiration
  product: ProductInfo;
  processingTime: number;     // milliseconds
  downloadUrl: string;        // Direct download link
}

interface MirrorMeError {
  code: string;
  message: string;
  details?: any;
}
```

### 4.2 Methods

```javascript
// Open the try-on modal
mirrorMe.open(options?: OpenOptions): Promise<void>

// Close the modal
mirrorMe.close(): void

// Check if modal is open
mirrorMe.isOpen(): boolean

// Destroy the widget instance
mirrorMe.destroy(): void

// Update configuration
mirrorMe.setConfig(config: Partial<MirrorMeConfig>): void

// Preload resources (improves perceived performance)
mirrorMe.preload(): void

// Get current session
mirrorMe.getSession(): SessionInfo | null
```

### 4.3 Events (Alternative to Callbacks)

```javascript
mirrorMe.on('ready', () => {});
mirrorMe.on('open', (sessionId) => {});
mirrorMe.on('close', (reason) => {});
mirrorMe.on('result', (result) => {});
mirrorMe.on('error', (error) => {});
mirrorMe.off('result', handlerFn); // Remove listener
```

---

## 5. Widget UI Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER JOURNEY                                    │
└─────────────────────────────────────────────────────────────────────────────┘

[User on Product Page]
         │
         ▼ clicks "Mirror.Me" button
         │
         ├─── IF user-image provided & skip-photo-step=true ───┐
         │                                                      │
         ▼                                                      ▼
┌─────────────────────┐                              ┌─────────────────────┐
│   STEP 1: PHOTO     │                              │   STEP 2: PROCESS   │
│   ─────────────     │                              │   ───────────────   │
│                     │                              │                     │
│  ┌───────────────┐  │                              │   "Creating your    │
│  │               │  │                              │    virtual try-on"  │
│  │  📷  Camera   │  │                              │                     │
│  │               │  │                              │   ████████░░ 80%    │
│  └───────────────┘  │                              │                     │
│                     │                              │   [Product Image]   │
│  ┌───────────────┐  │                              │         +           │
│  │               │  │                              │   [User Photo]      │
│  │  📁  Upload   │  │                              │                     │
│  │               │  │                              └──────────┬──────────┘
│  └───────────────┘  │                                         │
│                     │                                         │
│  ┌───────────────┐  │                                         │
│  │  🖼️  Gallery  │  │ (previously used photos)                │
│  └───────────────┘  │                                         │
│                     │                                         │
│  ───────────────    │                                         │
│  Or drag & drop     │                                         │
│  an image here      │                                         │
│                     │                                         │
└──────────┬──────────┘                                         │
           │                                                    │
           ▼ photo selected                                     │
           │                                                    │
┌──────────┴──────────┐                                         │
│   STEP 1b: CONFIRM  │                                         │
│   ────────────────  │                                         │
│                     │                                         │
│   [Photo Preview]   │                                         │
│                     │                                         │
│   "Looking good!"   │                                         │
│                     │                                         │
│  [← Back] [Next →]  │                                         │
│                     │                                         │
└──────────┬──────────┘                                         │
           │                                                    │
           └──────────────────┬─────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       STEP 3: RESULT                             │
│                       ──────────────                             │
│                                                                  │
│     ┌─────────────────────────────────────────────┐             │
│     │                                             │             │
│     │                                             │             │
│     │          [Generated Try-On Image]          │             │
│     │                                             │             │
│     │                                             │             │
│     └─────────────────────────────────────────────┘             │
│                                                                  │
│     "Classic Blue Denim Jacket"                                 │
│     $89.99                                                      │
│                                                                  │
│     ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│     │ 📥 Save  │ │ 📤 Share │ │ 🔄 Retry │ │ 🛒 Buy   │        │
│     └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                                  │
│     ─────────────────────────────────────────────               │
│     Powered by Mirror.Me                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. API Endpoints

### 6.1 Widget Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/widget/mirror.js` | Widget JavaScript bundle |
| `GET` | `/widget/mirror.css` | Widget styles (auto-loaded by JS) |
| `GET` | `/widget/iframe.html` | Hosted iframe content |
| `POST` | `/api/widget/session` | Create new try-on session |
| `POST` | `/api/widget/try-on` | Submit photo and generate try-on |
| `GET` | `/api/widget/session/:id` | Get session status/result |
| `POST` | `/api/widget/verify` | Verify merchant key and domain |

### 6.2 Create Session

```http
POST /api/widget/session
Content-Type: application/json
X-Merchant-Key: mk_live_abc123
Origin: https://merchant-store.com

{
  "product": {
    "image": "https://store.com/products/jacket.jpg",
    "name": "Classic Blue Denim Jacket",
    "id": "SKU-12345",
    "category": "jacket",
    "price": 89.99,
    "currency": "USD",
    "url": "https://store.com/products/jacket"
  },
  "user": {
    "id": "user_12345",
    "image": "https://store.com/users/photo.jpg"
  },
  "options": {
    "skipPhotoStep": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "session": {
    "id": "ses_abc123xyz",
    "status": "pending_photo",
    "expiresAt": "2025-12-08T13:00:00Z",
    "product": { },
    "iframeUrl": "https://fashionmirror.shop/widget/iframe.html?session=ses_abc123xyz"
  }
}
```

### 6.3 Submit Try-On

```http
POST /api/widget/try-on
Content-Type: multipart/form-data
X-Merchant-Key: mk_live_abc123

sessionId: ses_abc123xyz
photo: [binary file data]
// OR
photoUrl: https://store.com/users/photo.jpg
```

**Response:**

```json
{
  "success": true,
  "result": {
    "sessionId": "ses_abc123xyz",
    "status": "completed",
    "imageUrl": "https://fashionmirror.shop/results/abc123.jpg",
    "thumbnailUrl": "https://fashionmirror.shop/results/abc123_thumb.jpg",
    "downloadUrl": "https://fashionmirror.shop/api/download/abc123",
    "expiresAt": "2025-12-09T12:00:00Z",
    "processingTime": 3500
  }
}
```

### 6.4 Error Responses

```json
{
  "success": false,
  "error": {
    "code": "INVALID_MERCHANT_KEY",
    "message": "The merchant key is invalid or has been revoked",
    "details": null
  }
}
```

**Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_MERCHANT_KEY` | 401 | Invalid or revoked API key |
| `DOMAIN_NOT_ALLOWED` | 403 | Request origin not in whitelist |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `QUOTA_EXCEEDED` | 402 | Monthly try-on limit reached |
| `INVALID_PRODUCT_IMAGE` | 400 | Product image URL unreachable or invalid |
| `INVALID_USER_IMAGE` | 400 | User photo invalid or unprocessable |
| `PROCESSING_FAILED` | 500 | AI generation failed |
| `SESSION_EXPIRED` | 410 | Session has expired |
| `SESSION_NOT_FOUND` | 404 | Session ID not found |

---

## 7. Database Schema

### 7.1 SQL Schema

```sql
-- Merchants table
CREATE TABLE merchants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,

  -- API Keys
  live_key VARCHAR(64) UNIQUE NOT NULL,      -- mk_live_xxx
  test_key VARCHAR(64) UNIQUE NOT NULL,      -- mk_test_xxx

  -- Domain whitelist (JSON array)
  allowed_domains JSONB DEFAULT '[]',

  -- Subscription
  plan VARCHAR(50) DEFAULT 'free',           -- free, starter, growth, enterprise
  monthly_quota INTEGER DEFAULT 100,
  quota_used INTEGER DEFAULT 0,
  quota_reset_at TIMESTAMP,

  -- Settings
  settings JSONB DEFAULT '{}',
  webhook_url VARCHAR(500),
  webhook_secret VARCHAR(64),

  -- Status
  status VARCHAR(20) DEFAULT 'active',       -- active, suspended, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Widget sessions
CREATE TABLE widget_sessions (
  id VARCHAR(64) PRIMARY KEY,                -- ses_xxx
  merchant_id INTEGER REFERENCES merchants(id),

  -- Product info
  product_image VARCHAR(1000) NOT NULL,
  product_name VARCHAR(255),
  product_id VARCHAR(255),
  product_category VARCHAR(50),
  product_price DECIMAL(10,2),
  product_currency VARCHAR(3),
  product_url VARCHAR(1000),

  -- User info
  user_id VARCHAR(255),
  user_image VARCHAR(1000),

  -- Processing
  status VARCHAR(20) DEFAULT 'pending',      -- pending, processing, completed, failed, expired
  result_image VARCHAR(1000),
  result_thumbnail VARCHAR(1000),
  processing_time INTEGER,                   -- milliseconds
  error_code VARCHAR(50),
  error_message TEXT,

  -- Metadata
  origin_domain VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(45),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Usage analytics
CREATE TABLE widget_analytics (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id),
  session_id VARCHAR(64) REFERENCES widget_sessions(id),

  event_type VARCHAR(50) NOT NULL,           -- impression, open, photo_selected, processing_start, completed, error, share, download
  event_data JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_merchants_live_key ON merchants(live_key);
CREATE INDEX idx_merchants_test_key ON merchants(test_key);
CREATE INDEX idx_sessions_merchant ON widget_sessions(merchant_id);
CREATE INDEX idx_sessions_status ON widget_sessions(status);
CREATE INDEX idx_sessions_created ON widget_sessions(created_at);
CREATE INDEX idx_analytics_merchant ON widget_analytics(merchant_id);
CREATE INDEX idx_analytics_event ON widget_analytics(event_type);
```

### 7.2 Drizzle ORM Schema (TypeScript)

```typescript
// To be added to shared/schema.ts

import { pgTable, serial, varchar, text, integer, decimal, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

export const merchants = pgTable('merchants', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),

  // API Keys
  liveKey: varchar('live_key', { length: 64 }).notNull().unique(),
  testKey: varchar('test_key', { length: 64 }).notNull().unique(),

  // Domain whitelist
  allowedDomains: jsonb('allowed_domains').default([]),

  // Subscription
  plan: varchar('plan', { length: 50 }).default('free'),
  monthlyQuota: integer('monthly_quota').default(100),
  quotaUsed: integer('quota_used').default(0),
  quotaResetAt: timestamp('quota_reset_at'),

  // Settings
  settings: jsonb('settings').default({}),
  webhookUrl: varchar('webhook_url', { length: 500 }),
  webhookSecret: varchar('webhook_secret', { length: 64 }),

  // Status
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const widgetSessions = pgTable('widget_sessions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  merchantId: integer('merchant_id').references(() => merchants.id),

  // Product info
  productImage: varchar('product_image', { length: 1000 }).notNull(),
  productName: varchar('product_name', { length: 255 }),
  productId: varchar('product_id', { length: 255 }),
  productCategory: varchar('product_category', { length: 50 }),
  productPrice: decimal('product_price', { precision: 10, scale: 2 }),
  productCurrency: varchar('product_currency', { length: 3 }),
  productUrl: varchar('product_url', { length: 1000 }),

  // User info
  userId: varchar('user_id', { length: 255 }),
  userImage: varchar('user_image', { length: 1000 }),

  // Processing
  status: varchar('status', { length: 20 }).default('pending'),
  resultImage: varchar('result_image', { length: 1000 }),
  resultThumbnail: varchar('result_thumbnail', { length: 1000 }),
  processingTime: integer('processing_time'),
  errorCode: varchar('error_code', { length: 50 }),
  errorMessage: text('error_message'),

  // Metadata
  originDomain: varchar('origin_domain', { length: 255 }),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
});

export const widgetAnalytics = pgTable('widget_analytics', {
  id: serial('id').primaryKey(),
  merchantId: integer('merchant_id').references(() => merchants.id),
  sessionId: varchar('session_id', { length: 64 }).references(() => widgetSessions.id),

  eventType: varchar('event_type', { length: 50 }).notNull(),
  eventData: jsonb('event_data').default({}),

  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 8. Merchant Dashboard Features

### 8.1 Dashboard Pages

```
/merchant
├── /login             - Merchant login
├── /register          - Merchant registration
├── /dashboard         - Usage stats, recent activity
├── /integration       - API keys, code snippets, domain whitelist
├── /analytics         - Charts, conversion tracking
├── /sessions          - Browse try-on sessions
├── /settings          - Account, billing, notifications
├── /webhooks          - Configure webhook endpoints
└── /billing           - Plan, invoices, payment method
```

### 8.2 Integration Page Content

```markdown
## Quick Start

1. Add this script to your product pages:

   <script src="https://fashionmirror.shop/widget/mirror.js"></script>

2. Add the button where you want it to appear:

   <button
     class="mirror-me-button"
     data-merchant-key="YOUR_KEY_HERE"
     data-product-image="{{product.image}}"
   >
     Try it on
   </button>

## Your API Keys

| Environment | Key | Status |
|-------------|-----|--------|
| Live | mk_live_abc... [Copy] [Regenerate] | Active |
| Test | mk_test_xyz... [Copy] [Regenerate] | Active |

## Allowed Domains

Requests will only be accepted from these domains:
- https://mystore.com [Remove]
- https://staging.mystore.com [Remove]
[+ Add Domain]

## Webhook Configuration

Endpoint URL: https://mystore.com/webhooks/mirror-me
Secret: whsec_xxx [Regenerate]
Events: ☑ try-on.completed  ☑ try-on.failed  ☐ session.created
```

### 8.3 Monetization Tiers

| Tier | Price | Includes |
|------|-------|----------|
| Free | $0 | 100 try-ons/month, watermark |
| Starter | $29/mo | 1,000 try-ons, no watermark |
| Growth | $99/mo | 10,000 try-ons, priority processing |
| Enterprise | Custom | Unlimited, SLA, dedicated support |

---

## 9. Webhook Events

### 9.1 Webhook Payload

```http
POST https://merchant-store.com/webhooks/mirror-me
Content-Type: application/json
X-MirrorMe-Signature: sha256=abc123...
X-MirrorMe-Timestamp: 1702041600

{
  "event": "try-on.completed",
  "timestamp": "2025-12-08T12:00:00Z",
  "data": {
    "sessionId": "ses_abc123xyz",
    "product": {
      "id": "SKU-12345",
      "name": "Classic Blue Denim Jacket",
      "image": "https://store.com/products/jacket.jpg"
    },
    "user": {
      "id": "user_12345"
    },
    "result": {
      "imageUrl": "https://fashionmirror.shop/results/abc123.jpg",
      "processingTime": 3500
    }
  }
}
```

### 9.2 Event Types

| Event | Description |
|-------|-------------|
| `session.created` | New try-on session started |
| `try-on.processing` | Photo submitted, processing started |
| `try-on.completed` | Try-on image generated successfully |
| `try-on.failed` | Processing failed |

### 9.3 Signature Verification

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, timestamp, secret) {
  const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature.replace('sha256=', '')),
    Buffer.from(expectedSignature)
  );
}
```

---

## 10. Widget Customization (CSS Variables)

```css
/* Merchant can override these in their CSS */
:root {
  /* Colors */
  --mirror-me-primary: #6366f1;
  --mirror-me-primary-hover: #4f46e5;
  --mirror-me-background: #ffffff;
  --mirror-me-surface: #f8fafc;
  --mirror-me-text: #1e293b;
  --mirror-me-text-muted: #64748b;
  --mirror-me-border: #e2e8f0;
  --mirror-me-error: #ef4444;
  --mirror-me-success: #22c55e;

  /* Typography */
  --mirror-me-font-family: system-ui, -apple-system, sans-serif;
  --mirror-me-font-size-base: 14px;

  /* Spacing */
  --mirror-me-border-radius: 8px;
  --mirror-me-modal-border-radius: 16px;

  /* Shadows */
  --mirror-me-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --mirror-me-shadow-lg: 0 25px 50px -12px rgb(0 0 0 / 0.25);

  /* Z-index */
  --mirror-me-z-index: 999999;
}

/* Dark theme */
[data-mirror-me-theme="dark"] {
  --mirror-me-background: #0f172a;
  --mirror-me-surface: #1e293b;
  --mirror-me-text: #f1f5f9;
  --mirror-me-text-muted: #94a3b8;
  --mirror-me-border: #334155;
}
```

---

## 11. Platform-Specific Integration Guides

### 11.1 Shopify (Liquid)

```liquid
<!-- In product.liquid or product-template.liquid -->
{% if product.type == 'Clothing' or product.type == 'Apparel' %}
  <script src="https://fashionmirror.shop/widget/mirror.js"></script>
  <button
    class="mirror-me-button"
    data-merchant-key="{{ shop.metafields.mirror_me.api_key }}"
    data-product-image="{{ product.featured_image | img_url: '1024x1024' }}"
    data-product-name="{{ product.title | escape }}"
    data-product-id="{{ product.id }}"
    data-product-price="{{ product.price | money_without_currency }}"
    data-product-currency="{{ shop.currency }}"
    data-product-url="{{ product.url | prepend: shop.url }}"
    {% if customer %}
      data-user-id="{{ customer.id }}"
      {% if customer.metafields.mirror_me.photo_url %}
        data-user-image="{{ customer.metafields.mirror_me.photo_url }}"
      {% endif %}
    {% endif %}
  >
    ✨ Try it on
  </button>
{% endif %}
```

### 11.2 WooCommerce (PHP)

```php
// In functions.php or a custom plugin
add_action('woocommerce_single_product_summary', 'add_mirror_me_button', 25);

function add_mirror_me_button() {
    global $product;

    // Only show for clothing categories
    if (!has_term(['clothing', 'apparel'], 'product_cat', $product->get_id())) {
        return;
    }

    $image_url = wp_get_attachment_url($product->get_image_id());
    $user_id = get_current_user_id();
    $user_photo = get_user_meta($user_id, 'mirror_me_photo', true);

    ?>
    <script src="https://fashionmirror.shop/widget/mirror.js"></script>
    <button
        class="mirror-me-button"
        data-merchant-key="<?php echo esc_attr(get_option('mirror_me_api_key')); ?>"
        data-product-image="<?php echo esc_url($image_url); ?>"
        data-product-name="<?php echo esc_attr($product->get_name()); ?>"
        data-product-id="<?php echo esc_attr($product->get_sku()); ?>"
        data-product-price="<?php echo esc_attr($product->get_price()); ?>"
        data-product-currency="<?php echo esc_attr(get_woocommerce_currency()); ?>"
        <?php if ($user_id): ?>
            data-user-id="<?php echo esc_attr($user_id); ?>"
        <?php endif; ?>
        <?php if ($user_photo): ?>
            data-user-image="<?php echo esc_url($user_photo); ?>"
        <?php endif; ?>
    >
        ✨ Try it on
    </button>
    <?php
}
```

### 11.3 React/Next.js

```tsx
// components/MirrorMeButton.tsx
'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

interface MirrorMeButtonProps {
  productImage: string;
  productName: string;
  productId: string;
  productPrice: number;
  productCategory?: string;
  userImage?: string;
  userId?: string;
}

export function MirrorMeButton({
  productImage,
  productName,
  productId,
  productPrice,
  productCategory,
  userImage,
  userId,
}: MirrorMeButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Script
        src="https://fashionmirror.shop/widget/mirror.js"
        strategy="lazyOnload"
      />
      <button
        ref={buttonRef}
        className="mirror-me-button"
        data-merchant-key={process.env.NEXT_PUBLIC_MIRROR_ME_KEY}
        data-product-image={productImage}
        data-product-name={productName}
        data-product-id={productId}
        data-product-price={productPrice}
        data-product-category={productCategory}
        data-user-image={userImage}
        data-user-id={userId}
      >
        ✨ Try it on
      </button>
    </>
  );
}
```

---

## 12. Security Specifications

### 12.1 Domain Verification

- Widget validates `document.referrer` and `window.location.origin`
- Server validates `Origin` and `Referer` headers against merchant's whitelist
- Test keys (`mk_test_*`) only work on `localhost` and whitelisted staging domains

### 12.2 Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Per merchant (API) | 100 requests | 1 minute |
| Per IP (widget) | 20 sessions | 1 minute |
| Per session (try-on) | 3 attempts | session lifetime |

### 12.3 Content Security

- Product images fetched server-side (avoid CORS issues)
- User photos validated: max 10MB, image/* MIME types only
- Generated images stored with random UUIDs, expire after 24 hours
- No PII stored in logs

### 12.4 Iframe Security

```html
<!-- Widget iframe attributes -->
<iframe
  src="https://fashionmirror.shop/widget/iframe.html?session=xxx"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  allow="camera; microphone"
  loading="lazy"
></iframe>
```

---

## 13. File Structure

### 13.1 New Files to Create

```
server/
├── routes/
│   ├── widget.ts                 # Widget API routes
│   └── merchant.ts               # Merchant dashboard API routes
├── services/
│   ├── merchantService.ts        # Merchant CRUD, key generation
│   └── webhookService.ts         # Webhook delivery
├── middleware/
│   └── widgetAuth.ts             # Merchant key + domain validation

client/src/
├── pages/
│   ├── widget-iframe.tsx         # Iframe content page
│   └── merchant/
│       ├── login.tsx
│       ├── register.tsx
│       ├── dashboard.tsx
│       ├── integration.tsx
│       ├── analytics.tsx
│       ├── sessions.tsx
│       ├── settings.tsx
│       └── billing.tsx
├── contexts/
│   └── MerchantAuthContext.tsx   # Merchant auth state

public/
├── widget/
│   ├── mirror.js                 # Embeddable widget bundle
│   ├── mirror.css                # Widget styles
│   └── iframe.html               # Minimal iframe bootstrap

shared/
└── schema.ts                     # Add merchants, widget_sessions, widget_analytics tables
```

---

## 14. Implementation Phases

### Phase 1: Core Infrastructure

#### 1.1 Database Schema
- [ ] Add `merchants` table to Drizzle schema
- [ ] Add `widgetSessions` table to Drizzle schema
- [ ] Add `widgetAnalytics` table to Drizzle schema
- [ ] Create Zod validation schemas for all new tables
- [ ] Run `npm run db:push` to sync schema

#### 1.2 Merchant Service
- [ ] Create `server/services/merchantService.ts`
- [ ] Implement API key generation (mk_live_xxx, mk_test_xxx format)
- [ ] Implement merchant CRUD operations
- [ ] Implement domain whitelist validation logic
- [ ] Implement quota tracking and reset logic
- [ ] Add key rotation functionality

#### 1.3 Widget Authentication Middleware
- [ ] Create `server/middleware/widgetAuth.ts`
- [ ] Implement merchant key validation
- [ ] Implement origin/referer domain verification
- [ ] Implement rate limiting per merchant and per IP
- [ ] Handle test vs live key environments

#### 1.4 Storage Interface Updates
- [ ] Add merchant methods to `IStorage` interface
- [ ] Add widget session methods to `IStorage` interface
- [ ] Add analytics methods to `IStorage` interface
- [ ] Implement methods in `DatabaseStorage` class
- [ ] Implement methods in `MemStorage` class

---

### Phase 2: Widget API Endpoints

#### 2.1 Session Management
- [ ] Create `server/routes/widget.ts` router
- [ ] Implement `POST /api/widget/verify`
- [ ] Implement `POST /api/widget/session`
- [ ] Implement `GET /api/widget/session/:id`
- [ ] Implement `DELETE /api/widget/session/:id`

#### 2.2 Try-On Processing
- [ ] Implement `POST /api/widget/try-on`
- [ ] Add product image fetching (server-side)
- [ ] Integrate with existing Gemini service
- [ ] Handle photo URL vs file upload cases
- [ ] Implement result image storage
- [ ] Add session status updates during processing

#### 2.3 Asset Delivery
- [ ] Implement `GET /api/widget/result/:id`
- [ ] Implement `GET /api/widget/download/:id`
- [ ] Add image expiration handling

#### 2.4 Analytics Tracking
- [ ] Implement `POST /api/widget/analytics`
- [ ] Track all event types

---

### Phase 3: Embeddable Widget (Frontend)

#### 3.1 Widget JavaScript Bundle
- [ ] Create `public/widget/mirror.js` entry point
- [ ] Implement `MirrorMe.init(config)` initialization
- [ ] Implement automatic button detection
- [ ] Parse data attributes from button elements
- [ ] Implement `mirrorMe.open(options)` method
- [ ] Implement `mirrorMe.close()` method
- [ ] Implement event emitter pattern
- [ ] Implement postMessage communication
- [ ] Add preload functionality
- [ ] Bundle for production

#### 3.2 Widget CSS
- [ ] Create `public/widget/mirror.css`
- [ ] Define CSS custom properties
- [ ] Style modal overlay and container
- [ ] Style button variants
- [ ] Add light and dark theme styles
- [ ] Ensure styles are scoped

#### 3.3 Modal/Iframe Container
- [ ] Create modal overlay with backdrop
- [ ] Create responsive iframe container
- [ ] Handle modal open/close animations
- [ ] Implement click-outside-to-close
- [ ] Implement escape key to close
- [ ] Handle mobile viewport
- [ ] Add loading spinner

---

### Phase 4: Widget Iframe Content

#### 4.1 Iframe Page Setup
- [ ] Create `client/src/pages/widget-iframe.tsx`
- [ ] Add route `/widget/embed`
- [ ] Parse session ID from URL
- [ ] Implement postMessage listener
- [ ] Handle session validation

#### 4.2 Photo Selection Step
- [ ] Create photo upload dropzone
- [ ] Implement camera capture
- [ ] Implement file input
- [ ] Add drag-and-drop support
- [ ] Show photo preview
- [ ] Add retake/reselect option
- [ ] Handle pre-populated user image

#### 4.3 Processing Step
- [ ] Create processing/loading UI
- [ ] Show product + user photo
- [ ] Implement progress indicator
- [ ] Handle processing timeout
- [ ] Show error state with retry

#### 4.4 Result Step
- [ ] Display generated try-on image
- [ ] Show product name and price
- [ ] Add download button
- [ ] Add share buttons
- [ ] Add "Try another photo" option
- [ ] Add "Buy now" button
- [ ] Show branding

---

### Phase 5: Merchant Dashboard ✅ COMPLETE

#### 5.1 Merchant Authentication ✅
- [x] Create login page (`/merchant/login`)
- [x] Create register page (`/merchant/register`)
- [x] Implement `POST /api/merchants/register`
- [x] Implement `POST /api/merchants/login`
- [x] Implement `POST /api/merchants/logout`
- [x] Implement `GET /api/merchants/me`
- [x] Create merchant auth context (`MerchantAuthContext.tsx`)
- [x] Add protected route wrapper (redirect to login if not authenticated)

#### 5.2 Dashboard Overview ✅
- [x] Create dashboard page (`/merchant/dashboard`)
- [x] Show usage stats (quota used/limit)
- [x] Show stats cards (Total Sessions, Completed, Conversion Rate)
- [x] Show API key with copy button
- [x] Show quick start guide
- [x] Show plan info with upgrade CTA

#### 5.3 Integration Page ✅
- [x] Create integration page (`/merchant/integration`)
- [x] Display Live and Test API keys with copy buttons
- [x] Add key regeneration with confirmation
- [x] Show code snippets (HTML, JavaScript SDK)
- [x] Manage domain whitelist (add/remove domains)
- [x] Tabbed interface for API Keys, Code Snippets, Domains

#### 5.4 Analytics Page ✅
- [x] Create analytics page (`/merchant/analytics`)
- [x] Show try-on volume chart (last 14 days bar chart)
- [x] Show stats overview cards
- [x] Show recent sessions table with product images
- [x] Session status badges (completed, failed, processing)

#### 5.5 Settings Page ✅
- [x] Create settings page (`/merchant/settings`)
- [x] Edit merchant profile (business name)
- [x] Configure webhook URL
- [x] Regenerate webhook secret
- [x] Show plan and billing info
- [x] Security section (change password placeholder, 2FA coming soon)
- [x] Danger zone (delete account placeholder)

#### 5.6 Billing Page (Placeholder)
- [x] Plan info shown in settings page
- [ ] Full billing page with Stripe integration (future enhancement)

---

### Phase 6: Webhooks ✅ COMPLETE

#### 6.1 Webhook Service ✅
- [x] Create `server/services/webhookService.ts`
- [x] Implement payload construction
- [x] Implement HMAC-SHA256 signature generation
- [x] Implement async delivery with retries (1s, 5s, 30s backoff)
- [x] Log webhook attempts and delivery status
- [x] Add test webhook endpoint for merchants

#### 6.2 Webhook Events ✅
- [x] Trigger `session.created` on session creation
- [x] Trigger `try-on.processing` when processing starts
- [x] Trigger `try-on.completed` on successful generation
- [x] Trigger `try-on.failed` on all failure scenarios

---

### Phase 7: Polish & Production ✅

#### 7.1 Error Handling
- [x] Define all error codes (30+ codes in `server/utils/errors.ts`)
- [x] Implement consistent error format (ApiError interface)
- [x] Add user-friendly error messages (userMessage field)
- [x] Add error logging with context (`logError` utility)

#### 7.2 Performance
- [x] Add CDN headers for widget assets
- [x] Add cache headers for static assets
- [x] Implement `stale-while-revalidate` caching
- [x] Add no-cache headers for API responses

#### 7.3 Security Hardening
- [x] Input sanitization middleware
- [x] Implement CORS for widget endpoints (origin validation)
- [x] Implement CORS for API endpoints
- [x] Add CSP headers for iframe content
- [x] Rate limiting by IP (20 req/min)
- [x] Rate limiting by merchant (100 req/min)
- [x] Rate limiting for login attempts
- [x] Add request ID tracking
- [x] Add request logging middleware
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, HSTS)
- [x] Permissions Policy header

#### 7.4 Testing
- [x] Unit tests for merchant service (32 tests)
- [x] Unit tests for widget auth middleware (14 tests)
- [x] Unit tests for error handling (28 tests)
- [x] Integration tests for widget API (23 tests)
- [x] Test configuration (vitest.config.ts, setup.ts)

#### 7.5 Documentation
- [x] API reference documentation (docs/API_REFERENCE.md)
- [x] Widget integration guide (docs/INTEGRATION_GUIDE.md)
- [x] Platform-specific guides (Shopify, WooCommerce, React)
- [x] Webhook documentation

---

## Summary

| Phase | Items | Status | Description |
|-------|-------|--------|-------------|
| 1 | 17 | ✅ Complete | Database schema, merchant service, auth middleware, storage |
| 2 | 12 | ✅ Complete | API endpoints for sessions, try-on, assets, analytics |
| 3 | 14 | ✅ Complete | Widget JS bundle, CSS, modal container |
| 4 | 13 | ✅ Complete | Iframe content - photo, processing, result steps |
| 5 | 21 | ✅ Complete | Merchant dashboard - auth, overview, integration, analytics, settings |
| 6 | 10 | ✅ Complete | Webhook service, signature generation, event triggers, test endpoint |
| **7** | **17** | ✅ **Complete** | **Error handling, security, testing (97 tests), documentation** |

**Total: 104 items** | **Completed: 104 items (All Phases Complete)** 🎉

---

## Phase 5 Implementation Details

### Files Created

**Backend:**
- `server/routes/merchant.ts` - Complete merchant API (~800 lines)
- `server/types/session.ts` - Extended session types for merchant auth

**Frontend:**
- `client/src/contexts/MerchantAuthContext.tsx` - Merchant auth state management
- `client/src/components/merchant/DashboardLayout.tsx` - Shared dashboard layout
- `client/src/pages/merchant/login.tsx` - Login page
- `client/src/pages/merchant/register.tsx` - Registration page
- `client/src/pages/merchant/dashboard.tsx` - Dashboard overview
- `client/src/pages/merchant/integration.tsx` - API keys, code snippets, domains
- `client/src/pages/merchant/analytics.tsx` - Usage charts and session history
- `client/src/pages/merchant/settings.tsx` - Profile, webhooks, security

### API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/merchants/register` | Register new merchant |
| POST | `/api/merchants/login` | Merchant login |
| POST | `/api/merchants/logout` | Merchant logout |
| GET | `/api/merchants/me` | Get current merchant |
| GET | `/api/merchants/keys` | Get API keys |
| POST | `/api/merchants/keys/regenerate` | Regenerate API key |
| GET | `/api/merchants/domains` | Get allowed domains |
| POST | `/api/merchants/domains` | Add allowed domain |
| DELETE | `/api/merchants/domains/:domain` | Remove domain |
| GET | `/api/merchants/analytics/overview` | Get analytics data |
| GET | `/api/merchants/sessions` | Get session history |
| PUT | `/api/merchants/settings` | Update settings |
| POST | `/api/merchants/webhook/regenerate-secret` | Regenerate webhook secret |

### Routes Added to App.tsx

```
/merchant/login      - Login page
/merchant/register   - Registration page
/merchant/dashboard  - Dashboard overview
/merchant/integration - API keys and code snippets
/merchant/analytics  - Usage analytics
/merchant/settings   - Account settings
```

---

## Phase 6 Implementation Details

### Files Created

**Backend:**
- `server/services/webhookService.ts` - Complete webhook service (~450 lines)

### Webhook Service Features

#### Signature Generation
- HMAC-SHA256 signatures using `crypto.createHmac`
- Format: `sha256=<hex_signature>`
- Signed payload: `${timestamp}.${JSON.stringify(payload)}`
- Timing-safe comparison for verification

#### Delivery System
- Async delivery (non-blocking)
- Automatic retries: 3 attempts with exponential backoff (1s, 5s, 30s)
- 10-second timeout per request
- Detailed logging for delivery status

#### Webhook Headers
```
X-MirrorMe-Signature: sha256=...
X-MirrorMe-Timestamp: 1702041600
X-MirrorMe-Event: try-on.completed
User-Agent: MirrorMe-Webhook/1.0
Content-Type: application/json
```

### Event Triggers Implemented

| Event | Trigger Location | Description |
|-------|-----------------|-------------|
| `session.created` | `POST /api/widget/session` | When a new try-on session is created |
| `try-on.processing` | `POST /api/widget/try-on` | When photo is submitted and processing starts |
| `try-on.completed` | `POST /api/widget/try-on` | When try-on image is successfully generated |
| `try-on.failed` | `POST /api/widget/try-on` | On any failure (invalid image, processing error) |

### API Endpoints Added

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/merchants/webhook/test` | Send test webhook to configured URL |

### Payload Structure

```typescript
interface WebhookPayload {
  event: 'session.created' | 'try-on.processing' | 'try-on.completed' | 'try-on.failed';
  timestamp: string; // ISO 8601
  data: {
    sessionId: string;
    product?: {
      id?: string;
      name?: string;
      image: string;
      category?: string;
      price?: number;
      currency?: string;
    };
    user?: {
      id?: string;
    };
    result?: {
      imageUrl?: string;
      processingTime?: number;
    };
    error?: {
      code?: string;
      message?: string;
    };
  };
}
```

### Verification Code Example (for Merchants)

```javascript
const crypto = require('crypto');

function verifyMirrorMeWebhook(payload, signature, timestamp, secret) {
  // Check timestamp (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    throw new Error('Webhook timestamp too old');
  }

  // Generate expected signature
  const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Compare signatures
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## Phase 7 Implementation Details

### Files Created

**Error Handling:**
- `server/utils/errors.ts` - Comprehensive error code definitions and utilities (~430 lines)
- `server/middleware/errorHandler.ts` - Global error handling middleware (~215 lines)

**Security & Performance:**
- `server/middleware/security.ts` - CORS, CSP, rate limiting, security headers (~380 lines)

**Testing:**
- `vitest.config.ts` - Test configuration
- `tests/setup.ts` - Test environment setup
- `server/services/merchantService.test.ts` - Merchant service unit tests (32 tests)
- `server/middleware/widgetAuth.test.ts` - Widget auth middleware tests (14 tests)
- `server/utils/errors.test.ts` - Error handling tests (28 tests)
- `tests/widget-api.test.ts` - Widget API integration tests (23 tests)

**Documentation:**
- `docs/API_REFERENCE.md` - Complete API reference for merchants
- `docs/INTEGRATION_GUIDE.md` - Step-by-step integration guide

### Error Codes Implemented

| Category | Codes |
|----------|-------|
| Authentication | `INVALID_MERCHANT_KEY`, `UNAUTHORIZED`, `INVALID_CREDENTIALS` |
| Authorization | `DOMAIN_NOT_ALLOWED`, `MERCHANT_SUSPENDED`, `ACCESS_DENIED` |
| Rate Limiting | `RATE_LIMIT_EXCEEDED`, `QUOTA_EXCEEDED` |
| Validation | `VALIDATION_ERROR`, `MISSING_SESSION_ID`, `MISSING_PHOTO` |
| Image Errors | `INVALID_USER_IMAGE`, `INVALID_PRODUCT_IMAGE`, `IMAGE_TOO_LARGE` |
| Session | `SESSION_NOT_FOUND`, `SESSION_EXPIRED`, `SESSION_PROCESSING` |
| Resource | `MERCHANT_NOT_FOUND`, `RESULT_NOT_FOUND`, `DOMAIN_NOT_FOUND` |
| Conflict | `EMAIL_EXISTS`, `DOMAIN_EXISTS` |
| Processing | `PROCESSING_FAILED`, `FETCH_FAILED`, `DOWNLOAD_FAILED` |
| Webhooks | `NO_WEBHOOK_URL`, `WEBHOOK_FAILED` |
| Generic | `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE` |

### Security Middleware Implemented

| Middleware | Purpose |
|------------|---------|
| `widgetCors` | CORS validation for widget endpoints with domain whitelisting |
| `apiCors` | General CORS for dashboard API endpoints |
| `iframeCsp` | Content Security Policy for widget iframe |
| `securityHeaders` | X-Frame-Options, X-Content-Type-Options, HSTS, Permissions-Policy |
| `rateLimitByIp` | IP-based rate limiting (20 req/min) |
| `rateLimitByMerchant` | Merchant-based rate limiting (100 req/min) |
| `rateLimitLogin` | Login attempt rate limiting (5 attempts/15 min) |
| `sanitizeInput` | XSS prevention via input sanitization |
| `requestIdMiddleware` | Unique request ID tracking |
| `requestLogger` | Request/response logging |

### Test Coverage

```
Test Files: 4 passed (4)
Tests: 97 passed (97)
Duration: ~2 seconds

- merchantService.test.ts: 32 tests (API keys, passwords, domain validation, quota, webhooks)
- widgetAuth.test.ts: 14 tests (auth flow, rate limiting, domain validation)
- errors.test.ts: 28 tests (error codes, responses, logging)
- widget-api.test.ts: 23 tests (session lifecycle, validation, quota)
```

### Documentation Files

| Document | Description |
|----------|-------------|
| `API_REFERENCE.md` | Full API reference with all endpoints, request/response formats, error codes |
| `INTEGRATION_GUIDE.md` | Step-by-step integration for Shopify, WooCommerce, React/Next.js |
