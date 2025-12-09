import { Link } from "wouter";
import { motion } from "framer-motion";

export default function DocsAPIWebhooks() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/">
                <span className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500" style={{ fontFamily: '"Playfair Display", serif' }}>
                  FashionMirror
                </span>
              </Link>
              <span className="text-gray-400">|</span>
              <Link href="/docs">
                <span className="text-gray-600 font-medium hover:text-gray-900 transition-colors">Developer Docs</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li><Link href="/docs"><span className="hover:text-gray-900">Docs</span></Link></li>
              <li>/</li>
              <li><Link href="/docs/api"><span className="hover:text-gray-900">API</span></Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Webhooks</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Webhooks</h1>
          <p className="text-xl text-gray-600 mb-8">
            Receive real-time notifications when try-on events occur.
          </p>

          {/* Overview */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-600 mb-4">
              Webhooks allow your server to receive real-time HTTP POST notifications when events occur in FashionMirror. This enables you to build reactive integrations without polling.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Use Cases:</strong> Track conversions, send follow-up emails, update inventory systems, trigger analytics events, or sync with your CRM.
              </p>
            </div>
          </section>

          {/* Setup */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Setting Up Webhooks</h2>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Configure in Dashboard</h3>
            <p className="text-gray-600 mb-4">
              Add your webhook URL in the <Link href="/merchant/settings"><span className="text-primary hover:underline">Merchant Settings</span></Link> page.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Or via API</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
              <pre>{`curl -X POST https://api.fashionmirror.shop/api/merchant/webhooks \\
  -H "X-Merchant-Key: mk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yourstore.com/api/webhooks/fashionmirror",
    "events": ["try_on.completed", "try_on.failed", "session.expired"],
    "secret": "whsec_your_signing_secret"
  }'`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Per-Session Callback</h3>
            <p className="text-gray-600 mb-4">
              You can also specify a callback URL when creating a session:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`{
  "product": { ... },
  "options": {
    "callbackUrl": "https://yourstore.com/api/tryon-callback"
  }
}`}</pre>
            </div>
          </section>

          {/* Event Types */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Event Types</h2>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">try_on.completed</span>
                </div>
                <p className="text-gray-600 text-sm">Fired when a try-on image is successfully generated.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">try_on.failed</span>
                </div>
                <p className="text-gray-600 text-sm">Fired when a try-on fails due to processing error.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">session.created</span>
                </div>
                <p className="text-gray-600 text-sm">Fired when a new try-on session is created.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded">session.expired</span>
                </div>
                <p className="text-gray-600 text-sm">Fired when a session expires due to inactivity.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">quota.warning</span>
                </div>
                <p className="text-gray-600 text-sm">Fired when usage reaches 80% of monthly quota.</p>
              </div>
            </div>
          </section>

          {/* Payload Structure */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payload Structure</h2>
            <p className="text-gray-600 mb-4">All webhook payloads follow this structure:</p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
              <pre>{`{
  "id": "evt_abc123xyz",           // Unique event ID
  "type": "try_on.completed",     // Event type
  "created": 1705320300,          // Unix timestamp
  "merchantId": "mer_xyz789",
  "data": {
    // Event-specific data
  }
}`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">try_on.completed Payload</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
              <pre>{`{
  "id": "evt_abc123xyz",
  "type": "try_on.completed",
  "created": 1705320300,
  "merchantId": "mer_xyz789",
  "data": {
    "sessionId": "ses_abc123",
    "tryOnId": "try_xyz789",
    "product": {
      "id": "prod_123",
      "name": "Summer Dress",
      "price": 89.99,
      "currency": "USD"
    },
    "user": {
      "id": "user_456"            // If provided during session creation
    },
    "resultUrl": "https://cdn.fashionmirror.shop/results/try_xyz789.jpg",
    "processingTime": 2847,
    "tryOnsRemaining": 2
  }
}`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">try_on.failed Payload</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`{
  "id": "evt_def456abc",
  "type": "try_on.failed",
  "created": 1705320400,
  "merchantId": "mer_xyz789",
  "data": {
    "sessionId": "ses_abc123",
    "tryOnId": "try_failed789",
    "product": {
      "id": "prod_123",
      "name": "Summer Dress"
    },
    "error": {
      "code": "NO_PERSON_DETECTED",
      "message": "Could not detect a person in the image"
    }
  }
}`}</pre>
            </div>
          </section>

          {/* Signature Verification */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Signature Verification</h2>
            <p className="text-gray-600 mb-4">
              All webhooks include a signature header for verification. Always verify signatures to ensure requests are from FashionMirror.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Headers</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Header</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">X-FashionMirror-Signature</td>
                    <td className="px-4 py-3 text-gray-600">HMAC-SHA256 signature of the payload</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">X-FashionMirror-Timestamp</td>
                    <td className="px-4 py-3 text-gray-600">Unix timestamp when webhook was sent</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">X-FashionMirror-Event</td>
                    <td className="px-4 py-3 text-gray-600">Event type (e.g., try_on.completed)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Node.js Verification Example</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
              <pre>{`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, timestamp, secret) {
  // Check timestamp is recent (within 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 300) {
    throw new Error('Webhook timestamp too old');
  }

  // Compute expected signature
  const signedPayload = \`\${timestamp}.\${JSON.stringify(payload)}\`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Compare signatures
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )) {
    throw new Error('Invalid webhook signature');
  }

  return true;
}

// Express.js handler
app.post('/webhooks/fashionmirror', express.json(), (req, res) => {
  try {
    verifyWebhookSignature(
      req.body,
      req.headers['x-fashionmirror-signature'],
      parseInt(req.headers['x-fashionmirror-timestamp']),
      process.env.WEBHOOK_SECRET
    );

    // Process the webhook
    const { type, data } = req.body;

    switch (type) {
      case 'try_on.completed':
        // Handle successful try-on
        trackConversion(data.product, data.user);
        break;

      case 'try_on.failed':
        // Log failure for analysis
        logTryOnFailure(data);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});`}</pre>
            </div>
          </section>

          {/* Best Practices */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Best Practices</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-500 mt-0.5">✓</span>
                <div>
                  <strong className="text-green-900">Respond quickly</strong>
                  <p className="text-green-800 text-sm">Return a 2xx response within 5 seconds. Process asynchronously if needed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-500 mt-0.5">✓</span>
                <div>
                  <strong className="text-green-900">Verify signatures</strong>
                  <p className="text-green-800 text-sm">Always verify the webhook signature before processing.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-500 mt-0.5">✓</span>
                <div>
                  <strong className="text-green-900">Handle duplicates</strong>
                  <p className="text-green-800 text-sm">Use the event ID to deduplicate. We may retry failed deliveries.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-500 mt-0.5">✓</span>
                <div>
                  <strong className="text-green-900">Use HTTPS</strong>
                  <p className="text-green-800 text-sm">Webhook URLs must use HTTPS in production.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Retry Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Retry Policy</h2>
            <p className="text-gray-600 mb-4">
              If your endpoint doesn't respond with a 2xx status, we'll retry with exponential backoff:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Attempt</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Delay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-gray-900">1st retry</td>
                    <td className="px-4 py-3 text-gray-600">1 minute</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-gray-900">2nd retry</td>
                    <td className="px-4 py-3 text-gray-600">5 minutes</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-gray-900">3rd retry</td>
                    <td className="px-4 py-3 text-gray-600">30 minutes</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-gray-900">4th retry (final)</td>
                    <td className="px-4 py-3 text-gray-600">2 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link href="/docs/api/try-on">
              <span className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Try-On API
              </span>
            </Link>
            <Link href="/docs/platforms/shopify">
              <span className="text-primary hover:underline">
                Platform Guides →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
