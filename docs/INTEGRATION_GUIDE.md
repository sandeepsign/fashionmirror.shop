# Mirror.Me Widget Integration Guide

This guide walks you through integrating the Mirror.Me virtual try-on widget into your e-commerce platform.

## Quick Start

### 1. Get Your API Keys

1. Sign up at [fashionmirror.shop/merchants](https://fashionmirror.shop/merchants)
2. Verify your email
3. Access your dashboard to get your API keys

You'll receive two keys:
- **Test Key** (`mk_test_...`): Use for development. Works with localhost.
- **Live Key** (`mk_live_...`): Use in production. Requires domain whitelisting.

### 2. Add Your Domain

Before going live, add your website domain to the whitelist:

1. Go to Dashboard > Settings > Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `example.com` or `*.example.com` for all subdomains)

### 3. Embed the Widget

#### Option A: Drop-in Script (Easiest)

Add this script to your product pages:

```html
<script src="https://cdn.fashionmirror.shop/widget.js"></script>
<script>
  MirrorMe.init({
    merchantKey: 'mk_test_your_key_here',
    productId: 'your-product-id',
    productName: 'Summer Floral Dress',
    productImage: 'https://yoursite.com/product.jpg',
    container: '#try-on-button', // Optional: custom mount point
    theme: 'light', // 'light' or 'dark'
  });
</script>

<!-- Add a try-on button anywhere -->
<button id="try-on-button">Try It On</button>
```

#### Option B: iframe Embed

For more control, embed the widget directly:

```html
<iframe
  src="https://fashionmirror.shop/widget/try-on?session=SESSION_ID"
  width="400"
  height="600"
  frameborder="0"
  allow="camera"
></iframe>
```

#### Option C: API Integration

For full control, use the REST API directly:

```javascript
// 1. Create a session when user clicks "Try On"
const response = await fetch('https://api.fashionmirror.shop/api/widget/session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Merchant-Key': 'mk_test_your_key',
  },
  body: JSON.stringify({
    product: {
      id: 'prod_123',
      name: 'Summer Dress',
      image: 'https://yoursite.com/dress.jpg',
      category: 'dress',
      price: 89.99,
      currency: 'USD',
    },
  }),
});

const { data } = await response.json();
console.log('Session created:', data.sessionId);

// 2. Redirect user to try-on page or open in modal
window.open(data.widgetUrl, 'try-on', 'width=500,height=700');
```

---

## Integration Patterns

### E-commerce Platform Integrations

#### Shopify

1. Add a custom liquid snippet to your product template:

```liquid
{% comment %} Add to product.liquid {% endcomment %}
<div id="mirror-me-widget"
     data-product-id="{{ product.id }}"
     data-product-name="{{ product.title }}"
     data-product-image="{{ product.featured_image | img_url: 'large' }}"
     data-product-price="{{ product.price | money_without_currency }}"
     data-product-category="{{ product.type | downcase }}">
</div>

<script src="https://cdn.fashionmirror.shop/widget.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('mirror-me-widget');
    MirrorMe.init({
      merchantKey: '{{ settings.mirror_me_key }}',
      productId: container.dataset.productId,
      productName: container.dataset.productName,
      productImage: container.dataset.productImage,
      productPrice: parseFloat(container.dataset.productPrice),
      productCategory: container.dataset.productCategory,
    });
  });
</script>
```

2. Add a theme setting for the API key in `config/settings_schema.json`

#### WooCommerce

Add to your theme's `functions.php`:

```php
function mirror_me_widget_script() {
    if (is_product()) {
        global $product;
        ?>
        <script src="https://cdn.fashionmirror.shop/widget.js"></script>
        <script>
            MirrorMe.init({
                merchantKey: '<?php echo get_option("mirror_me_api_key"); ?>',
                productId: '<?php echo $product->get_id(); ?>',
                productName: '<?php echo esc_js($product->get_name()); ?>',
                productImage: '<?php echo wp_get_attachment_url($product->get_image_id()); ?>',
                productPrice: <?php echo $product->get_price(); ?>,
            });
        </script>
        <?php
    }
}
add_action('wp_footer', 'mirror_me_widget_script');
```

#### React/Next.js

```tsx
import { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
}

function TryOnButton({ product }: { product: Product }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleTryOn() {
    setIsLoading(true);

    try {
      const response = await fetch('/api/try-on/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      });

      const { widgetUrl } = await response.json();

      // Open in modal or new window
      window.open(widgetUrl, 'try-on', 'width=500,height=700');
    } catch (error) {
      console.error('Failed to start try-on:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleTryOn}
      disabled={isLoading}
      className="try-on-button"
    >
      {isLoading ? 'Loading...' : 'Try It On'}
    </button>
  );
}
```

Server-side route (`/api/try-on/session`):

```typescript
// pages/api/try-on/session.ts (Next.js)
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { product } = req.body;

  const response = await fetch('https://api.fashionmirror.shop/api/widget/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Merchant-Key': process.env.MIRROR_ME_API_KEY!,
    },
    body: JSON.stringify({ product }),
  });

  const data = await response.json();
  res.json(data.data);
}
```

---

## Handling Webhooks

Set up webhooks to receive real-time notifications about try-on events.

### 1. Configure Your Webhook URL

In your dashboard, go to Settings > Webhooks and enter your endpoint URL.

### 2. Create a Webhook Handler

```javascript
// Express.js example
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.post('/webhooks/mirror-me', (req, res) => {
  // Verify signature
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const payload = req.body.toString();

  if (!verifySignature(payload, signature, process.env.WEBHOOK_SECRET, timestamp)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(payload);

  switch (event.event) {
    case 'try-on.completed':
      // Handle completed try-on
      console.log('Try-on completed:', event.data);

      // Update your database, send notifications, etc.
      await saveResultToDatabase(event.data);
      break;

    case 'try-on.failed':
      // Handle failed try-on
      console.log('Try-on failed:', event.data);
      break;
  }

  res.status(200).send('OK');
});

function verifySignature(payload, signature, secret, timestamp) {
  const signedPayload = `${timestamp}.${payload}`;
  const expected = `sha256=${crypto
    .createHash('sha256')
    .update(signedPayload)
    .update(secret)
    .digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## Best Practices

### Image Requirements

For best results with the AI try-on:

**Product Images:**
- High-resolution (minimum 800x800px)
- Clean background (white or solid color)
- Front-facing, full garment visible
- Good lighting, no heavy shadows
- JPG or PNG format

**User Photos:**
- Front-facing pose
- Full upper body visible
- Good lighting
- Neutral background preferred
- JPG or PNG format, under 10MB

### Performance Optimization

1. **Lazy Load the Widget Script**
```javascript
// Only load when user interacts
button.addEventListener('click', async () => {
  if (!window.MirrorMe) {
    await loadScript('https://cdn.fashionmirror.shop/widget.js');
  }
  MirrorMe.open(productConfig);
});
```

2. **Pre-connect to API**
```html
<link rel="preconnect" href="https://api.fashionmirror.shop">
```

3. **Cache Session Data**
Store session IDs in localStorage to allow users to resume:
```javascript
const sessionKey = `mirror_me_session_${productId}`;
const existingSession = localStorage.getItem(sessionKey);
```

### Error Handling

Always handle errors gracefully:

```javascript
MirrorMe.init({
  // ... config
  onError: (error) => {
    switch (error.code) {
      case 'QUOTA_EXCEEDED':
        showMessage('Service temporarily unavailable. Please try again later.');
        break;
      case 'INVALID_PRODUCT_IMAGE':
        showMessage('Unable to load product image.');
        break;
      case 'RATE_LIMIT_EXCEEDED':
        showMessage('Too many requests. Please wait a moment.');
        break;
      default:
        showMessage('Something went wrong. Please try again.');
    }
  },
});
```

### Analytics Integration

Track try-on events for analytics:

```javascript
MirrorMe.init({
  // ... config
  onSessionCreated: (sessionId) => {
    analytics.track('Try-On Started', {
      sessionId,
      productId: product.id,
    });
  },
  onTryOnCompleted: (result) => {
    analytics.track('Try-On Completed', {
      sessionId: result.sessionId,
      productId: product.id,
      duration: result.duration,
    });
  },
});
```

---

## Testing

### Test Mode

Use your test API key (`mk_test_...`) during development:
- Works on localhost and development domains
- Results may be watermarked
- Doesn't count against your quota

### Test Checklist

- [ ] Widget loads correctly on product pages
- [ ] Camera permission works
- [ ] Photo upload works
- [ ] Try-on generation completes
- [ ] Results display correctly
- [ ] Error states display properly
- [ ] Webhooks receive events (use webhook testing in dashboard)
- [ ] Mobile experience works

### Debugging

Enable debug mode for verbose logging:

```javascript
MirrorMe.init({
  // ... config
  debug: true, // Enable console logging
});
```

---

## Going Live

### Pre-Launch Checklist

1. [ ] Switch from test key to live key
2. [ ] Add production domain to whitelist
3. [ ] Configure webhook URL for production
4. [ ] Set up error monitoring (Sentry, etc.)
5. [ ] Review rate limits and quota for your plan
6. [ ] Test the complete flow in production

### Monitoring

- Check your dashboard for usage statistics
- Set up alerts for high error rates
- Monitor webhook delivery in the dashboard

---

## Support

- **Documentation**: [docs.fashionmirror.shop](https://docs.fashionmirror.shop)
- **Email**: support@fashionmirror.shop
- **Status Page**: [status.fashionmirror.shop](https://status.fashionmirror.shop)
