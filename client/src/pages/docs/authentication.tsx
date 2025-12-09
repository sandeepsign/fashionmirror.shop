import { Link } from "wouter";
import { motion } from "framer-motion";

export default function DocsAuthentication() {
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
              <li className="text-gray-900 font-medium">Authentication</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Authentication</h1>
          <p className="text-xl text-gray-600 mb-8">
            Learn how to authenticate your requests and secure your integration.
          </p>

          {/* API Keys */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">API Keys</h2>
            <p className="text-gray-600 mb-4">
              FashionMirror uses API keys to authenticate requests. You can view and manage your API keys in the <Link href="/merchant/dashboard"><span className="text-primary hover:underline">merchant dashboard</span></Link>.
            </p>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">Test</span>
                  <code className="text-gray-900 font-mono">mk_test_...</code>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Test keys are for development and testing. They work with:
                </p>
                <ul className="text-gray-600 text-sm space-y-1 ml-4">
                  <li>• Any development domain</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">127.0.0.1</code></li>
                  <li>• <code className="bg-gray-100 px-1 rounded">*.test</code> domains</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">*.local</code> domains</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">Live</span>
                  <code className="text-gray-900 font-mono">mk_live_...</code>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Live keys are for production use. They require:
                </p>
                <ul className="text-gray-600 text-sm space-y-1 ml-4">
                  <li>• Domain whitelisting (configured in dashboard)</li>
                  <li>• HTTPS (HTTP requests are rejected)</li>
                  <li>• Valid subscription or available quota</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Using API Keys */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Using API Keys</h2>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Widget Integration</h3>
            <p className="text-gray-600 mb-4">
              For widget integration, pass your API key as a data attribute:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-6">
              <pre>{`<button
  class="mirror-me-button"
  data-merchant-key="mk_live_your_api_key"
  data-product-image="..."
>
  Mirror.me
</button>`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">REST API</h3>
            <p className="text-gray-600 mb-4">
              For direct API calls, include your key in the <code className="bg-gray-100 px-1 rounded">X-Merchant-Key</code> header:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`curl -X POST https://api.fashionmirror.shop/api/widget/session \\
  -H "X-Merchant-Key: mk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"product": {...}}'`}</pre>
            </div>
          </section>

          {/* Domain Whitelisting */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Domain Whitelisting</h2>
            <p className="text-gray-600 mb-4">
              For production use with live keys, you must whitelist the domains where your widget will be embedded.
            </p>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Add Domains</h3>
              <ol className="text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">1.</span>
                  <span>Go to your <Link href="/merchant/settings"><span className="text-primary hover:underline">Merchant Settings</span></Link></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">2.</span>
                  <span>Navigate to the "Domains" section</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">3.</span>
                  <span>Add your domain (e.g., <code className="bg-gray-100 px-1 rounded">yourstore.com</code>)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">4.</span>
                  <span>Subdomains are automatically included</span>
                </li>
              </ol>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-lg">⚠️</span>
                <div>
                  <p className="text-amber-900 font-medium">Security Note</p>
                  <p className="text-amber-800 text-sm">Never expose your live API key in client-side code on non-whitelisted domains. Requests from unauthorized domains will be rejected.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Key Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Security Best Practices</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-500">✓</span>
                  <strong className="text-gray-900">Do</strong>
                </div>
                <ul className="text-gray-600 text-sm space-y-2">
                  <li>• Use test keys during development</li>
                  <li>• Whitelist only necessary domains</li>
                  <li>• Rotate keys if compromised</li>
                  <li>• Use environment variables for keys</li>
                  <li>• Monitor your usage dashboard</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-500">✗</span>
                  <strong className="text-gray-900">Don't</strong>
                </div>
                <ul className="text-gray-600 text-sm space-y-2">
                  <li>• Commit keys to version control</li>
                  <li>• Share keys in public forums</li>
                  <li>• Use live keys in development</li>
                  <li>• Whitelist wildcard domains (*)</li>
                  <li>• Ignore unusual usage patterns</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Rate Limiting */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Rate Limiting</h2>
            <p className="text-gray-600 mb-4">
              API requests are rate limited to ensure fair usage and protect against abuse.
            </p>
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
                    <td className="px-4 py-3 text-gray-900">Per API Key</td>
                    <td className="px-4 py-3 text-gray-600">100</td>
                    <td className="px-4 py-3 text-gray-600">1 minute</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-gray-900">Per IP Address</td>
                    <td className="px-4 py-3 text-gray-600">20</td>
                    <td className="px-4 py-3 text-gray-600">1 minute</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-gray-900">Try-ons per Session</td>
                    <td className="px-4 py-3 text-gray-600">3</td>
                    <td className="px-4 py-3 text-gray-600">Session lifetime</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              Rate limit headers are included in responses: <code className="bg-gray-100 px-1 rounded">X-RateLimit-Limit</code>, <code className="bg-gray-100 px-1 rounded">X-RateLimit-Remaining</code>, <code className="bg-gray-100 px-1 rounded">X-RateLimit-Reset</code>
            </p>
          </section>

          {/* Error Responses */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Authentication Errors</h2>
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">401</span>
                  <code className="text-gray-900 font-mono text-sm">INVALID_MERCHANT_KEY</code>
                </div>
                <p className="text-gray-600 text-sm">The API key is invalid, revoked, or missing.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">403</span>
                  <code className="text-gray-900 font-mono text-sm">DOMAIN_NOT_ALLOWED</code>
                </div>
                <p className="text-gray-600 text-sm">The request origin is not in the allowed domains list.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">429</span>
                  <code className="text-gray-900 font-mono text-sm">RATE_LIMIT_EXCEEDED</code>
                </div>
                <p className="text-gray-600 text-sm">Too many requests. Wait and retry after the reset time.</p>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link href="/docs/quickstart">
              <span className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Quick Start
              </span>
            </Link>
            <Link href="/docs/widget/installation">
              <span className="text-primary hover:underline">
                Widget Installation →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
