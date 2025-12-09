import { Link } from "wouter";
import { motion } from "framer-motion";
export default function DocsAPISessions() {
    return (<div className="min-h-screen bg-gray-50">
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li><Link href="/docs"><span className="hover:text-gray-900">Docs</span></Link></li>
              <li>/</li>
              <li><Link href="/docs/api"><span className="hover:text-gray-900">API</span></Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Sessions</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sessions API</h1>
          <p className="text-xl text-gray-600 mb-8">
            Create and manage virtual try-on sessions for your products.
          </p>

          {/* Overview */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-600 mb-4">
              Sessions are the core resource for virtual try-on. Each session is associated with a product and allows users to generate try-on images.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Session Lifecycle:</strong> Sessions expire after 30 minutes of inactivity or after the maximum number of try-ons has been reached.
              </p>
            </div>
          </section>

          {/* Create Session */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Create Session</h2>
            <p className="text-gray-600 mb-4">Initialize a new try-on session for a product.</p>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">POST</span>
                <code className="text-gray-900 font-mono">/api/widget/session</code>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Body</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
              <pre>{`{
  "product": {
    "id": "prod_123",           // Required: Your product ID
    "name": "Summer Dress",     // Required: Product name
    "image": "https://...",     // Required: Product image URL
    "category": "dress",        // Optional: dress, top, pants, jacket
    "price": 89.99,             // Optional: Product price
    "currency": "USD"           // Optional: Currency code
  },
  "user": {
    "id": "user_456"            // Optional: Your user ID for analytics
  },
  "options": {
    "maxTryOns": 3,             // Optional: Max try-ons (default: 3)
    "callbackUrl": "https://..."// Optional: Webhook URL
  }
}`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Response</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
              <pre>{`{
  "success": true,
  "data": {
    "sessionId": "ses_abc123xyz789",
    "expiresAt": "2024-01-15T12:30:00Z",
    "maxTryOns": 3,
    "tryOnsRemaining": 3,
    "product": {
      "id": "prod_123",
      "name": "Summer Dress",
      "image": "https://...",
      "category": "dress"
    },
    "widgetUrl": "https://fashionmirror.shop/widget/try-on?session=ses_abc123xyz789"
  }
}`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Example</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`curl -X POST https://api.fashionmirror.shop/api/widget/session \\
  -H "X-Merchant-Key: mk_test_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product": {
      "id": "SKU-12345",
      "name": "Floral Summer Dress",
      "image": "https://yourstore.com/images/dress.jpg",
      "category": "dress",
      "price": 89.99,
      "currency": "USD"
    }
  }'`}</pre>
            </div>
          </section>

          {/* Get Session */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Session</h2>
            <p className="text-gray-600 mb-4">Retrieve the current status and details of a session.</p>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">GET</span>
                <code className="text-gray-900 font-mono">/api/widget/session/:sessionId</code>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Path Parameters</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Parameter</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">sessionId</td>
                    <td className="px-4 py-3 text-gray-600">string</td>
                    <td className="px-4 py-3 text-gray-600">The session ID returned from create</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Response</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`{
  "success": true,
  "data": {
    "sessionId": "ses_abc123xyz789",
    "status": "active",           // active, expired, completed
    "expiresAt": "2024-01-15T12:30:00Z",
    "maxTryOns": 3,
    "tryOnsRemaining": 2,
    "tryOnsCompleted": 1,
    "product": {
      "id": "prod_123",
      "name": "Summer Dress",
      "image": "https://...",
      "category": "dress"
    },
    "lastTryOn": {
      "id": "try_xyz789",
      "status": "completed",
      "resultUrl": "https://...",
      "completedAt": "2024-01-15T12:05:00Z"
    }
  }
}`}</pre>
            </div>
          </section>

          {/* Session Status */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Session Status Values</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">active</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">Session is active and can accept try-on requests</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">processing</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">A try-on is currently being processed</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">completed</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">Maximum try-ons reached</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">expired</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">Session timed out (30 min inactivity)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Delete Session */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Delete Session</h2>
            <p className="text-gray-600 mb-4">Manually expire a session and clean up resources.</p>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">DELETE</span>
                <code className="text-gray-900 font-mono">/api/widget/session/:sessionId</code>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Response</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`{
  "success": true,
  "data": {
    "sessionId": "ses_abc123xyz789",
    "status": "deleted",
    "deletedAt": "2024-01-15T12:10:00Z"
  }
}`}</pre>
            </div>
          </section>

          {/* Error Codes */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error Codes</h2>
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">404</span>
                  <code className="text-gray-900 font-mono text-sm">SESSION_NOT_FOUND</code>
                </div>
                <p className="text-gray-600 text-sm">The session ID does not exist.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">410</span>
                  <code className="text-gray-900 font-mono text-sm">SESSION_EXPIRED</code>
                </div>
                <p className="text-gray-600 text-sm">The session has expired due to inactivity.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">400</span>
                  <code className="text-gray-900 font-mono text-sm">INVALID_PRODUCT_IMAGE</code>
                </div>
                <p className="text-gray-600 text-sm">The product image URL is invalid or inaccessible.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">402</span>
                  <code className="text-gray-900 font-mono text-sm">QUOTA_EXCEEDED</code>
                </div>
                <p className="text-gray-600 text-sm">Your monthly try-on quota has been exhausted.</p>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link href="/docs/api">
              <span className="text-gray-600 hover:text-gray-900 transition-colors">
                ← API Overview
              </span>
            </Link>
            <Link href="/docs/api/try-on">
              <span className="text-primary hover:underline">
                Try-On API →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>);
}
