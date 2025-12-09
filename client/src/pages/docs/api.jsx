import { Link } from "wouter";
import { motion } from "framer-motion";
const endpoints = [
    {
        method: "POST",
        path: "/api/widget/session",
        description: "Create a new try-on session",
        badge: "Session"
    },
    {
        method: "GET",
        path: "/api/widget/session/:id",
        description: "Get session status and details",
        badge: "Session"
    },
    {
        method: "POST",
        path: "/api/widget/session/:id/try-on",
        description: "Submit user photo for try-on",
        badge: "Try-On"
    },
    {
        method: "GET",
        path: "/api/widget/session/:id/result",
        description: "Get try-on result image",
        badge: "Try-On"
    },
    {
        method: "GET",
        path: "/api/widget/session/:id/poll",
        description: "SSE endpoint for real-time updates",
        badge: "Try-On"
    },
];
const errorCodes = [
    { code: "INVALID_MERCHANT_KEY", status: 401, description: "API key is invalid or revoked" },
    { code: "DOMAIN_NOT_ALLOWED", status: 403, description: "Origin not in allowed domains" },
    { code: "RATE_LIMIT_EXCEEDED", status: 429, description: "Too many requests" },
    { code: "QUOTA_EXCEEDED", status: 402, description: "Monthly try-on limit reached" },
    { code: "SESSION_NOT_FOUND", status: 404, description: "Session doesn't exist" },
    { code: "SESSION_EXPIRED", status: 410, description: "Session has expired" },
    { code: "INVALID_USER_IMAGE", status: 400, description: "User photo couldn't be processed" },
    { code: "PROCESSING_FAILED", status: 500, description: "AI generation failed" },
];
export default function DocsAPI() {
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
              <li className="text-gray-900 font-medium">API Reference</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">API Reference</h1>
          <p className="text-xl text-gray-600 mb-12">
            Complete REST API documentation for integrating FashionMirror virtual try-on.
          </p>

          {/* Base URL */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Base URL</h2>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm">
              <div className="text-green-400">https://api.fashionmirror.shop</div>
            </div>
          </section>

          {/* Authentication */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Authentication</h2>
            <p className="text-gray-600 mb-4">
              All API requests require authentication using your merchant API key in the <code className="bg-gray-100 px-1 rounded">X-Merchant-Key</code> header.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <code>
                <span className="text-gray-500">curl</span> -X POST https://api.fashionmirror.shop/api/widget/session \{'\n'}
                {'  '}<span className="text-yellow-400">-H</span> <span className="text-green-400">"X-Merchant-Key: mk_test_your_api_key"</span> \{'\n'}
                {'  '}<span className="text-yellow-400">-H</span> <span className="text-green-400">"Content-Type: application/json"</span>
              </code>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                <div>
                  <p className="text-blue-900 font-medium">API Key Types</p>
                  <ul className="text-blue-800 text-sm mt-2 space-y-1">
                    <li><code className="bg-blue-100 px-1 rounded">mk_test_</code> - Test keys work with any domain (for development)</li>
                    <li><code className="bg-blue-100 px-1 rounded">mk_live_</code> - Live keys require domain whitelisting</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Rate Limits */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Rate Limits</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Limit Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Requests</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Window</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-gray-900">Per Merchant</td>
                    <td className="px-4 py-3 text-gray-600">100</td>
                    <td className="px-4 py-3 text-gray-600">1 minute</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-gray-900">Per IP</td>
                    <td className="px-4 py-3 text-gray-600">20</td>
                    <td className="px-4 py-3 text-gray-600">1 minute</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-gray-900">Try-on per Session</td>
                    <td className="px-4 py-3 text-gray-600">3</td>
                    <td className="px-4 py-3 text-gray-600">Session lifetime</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              Rate limit headers are included in all responses: <code className="bg-gray-100 px-1 rounded">X-RateLimit-Limit</code>, <code className="bg-gray-100 px-1 rounded">X-RateLimit-Remaining</code>, <code className="bg-gray-100 px-1 rounded">X-RateLimit-Reset</code>
            </p>
          </section>

          {/* Endpoints */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Endpoints</h2>
            <div className="space-y-3">
              {endpoints.map((endpoint, idx) => (<div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${endpoint.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-gray-900">{endpoint.path}</code>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {endpoint.badge}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{endpoint.description}</p>
                </div>))}
            </div>
          </section>

          {/* Create Session Example */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Create Session</h2>
            <p className="text-gray-600 mb-4">Initialize a new try-on session for a product.</p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Request</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
              <pre>{`POST /api/widget/session

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
}`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Response</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`{
  "success": true,
  "data": {
    "sessionId": "ses_abc123xyz",
    "expiresAt": "2024-01-15T12:00:00Z",
    "maxTryOns": 3,
    "widgetUrl": "https://fashionmirror.shop/widget/try-on?session=ses_abc123xyz"
  }
}`}</pre>
            </div>
          </section>

          {/* Error Codes */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error Codes</h2>
            <p className="text-gray-600 mb-4">All errors follow a consistent format:</p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-6">
              <pre>{`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Technical error description",
    "userMessage": "User-friendly error message",
    "requestId": "req_abc123"
  }
}`}</pre>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Code</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">HTTP</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {errorCodes.map((err, idx) => (<tr key={idx} className="bg-white">
                      <td className="px-4 py-3 font-mono text-sm text-gray-900">{err.code}</td>
                      <td className="px-4 py-3 text-gray-600">{err.status}</td>
                      <td className="px-4 py-3 text-gray-600">{err.description}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SDK Examples */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">SDK Examples</h2>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">JavaScript / TypeScript</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-6">
              <pre>{`const MERCHANT_KEY = 'mk_test_your_key';

async function createTryOnSession(product) {
  const response = await fetch('https://api.fashionmirror.shop/api/widget/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Merchant-Key': MERCHANT_KEY,
    },
    body: JSON.stringify({ product }),
  });
  return response.json();
}

async function submitTryOn(sessionId, photoUrl) {
  const response = await fetch(
    \`https://api.fashionmirror.shop/api/widget/session/\${sessionId}/try-on\`,
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
}`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Python</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`import requests

MERCHANT_KEY = 'mk_test_your_key'
BASE_URL = 'https://api.fashionmirror.shop'

def create_session(product):
    response = requests.post(
        f'{BASE_URL}/api/widget/session',
        json={'product': product},
        headers={'X-Merchant-Key': MERCHANT_KEY}
    )
    return response.json()

def submit_tryon(session_id, photo_url):
    response = requests.post(
        f'{BASE_URL}/api/widget/session/{session_id}/try-on',
        json={'userPhotoUrl': photo_url},
        headers={'X-Merchant-Key': MERCHANT_KEY}
    )
    return response.json()`}</pre>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link href="/docs">
              <span className="text-gray-600 hover:text-gray-900 transition-colors">
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Docs
              </span>
            </Link>
            <Link href="/docs/api/webhooks">
              <span className="text-primary hover:underline">
                Webhooks
                <i className="fas fa-arrow-right ml-2"></i>
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>);
}
