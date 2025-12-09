import { Link } from "wouter";
import { motion } from "framer-motion";
export default function DocsWidgetInstallation() {
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
              <li><span className="hover:text-gray-900">Widget</span></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Installation</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Widget Installation</h1>
          <p className="text-xl text-gray-600 mb-8">
            Add the FashionMirror try-on widget to your website in minutes.
          </p>

          {/* Installation Methods */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Installation Methods</h2>
            <p className="text-gray-600 mb-6">
              Choose the installation method that works best for your platform.
            </p>

            {/* Script Tag */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Script Tag (Recommended)</h3>
              <p className="text-gray-600 mb-4">
                The simplest way to add the widget. Just include the script before your closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag.
              </p>
              <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
                <pre>{`<script src="https://cdn.fashionmirror.shop/widget.js"></script>`}</pre>
              </div>
              <p className="text-gray-500 text-sm mt-2">
                File size: ~15KB gzipped | Loads asynchronously
              </p>
            </div>

            {/* NPM */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xl font-semibold text-gray-900">2. NPM Package</h3>
                <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">Coming Soon</span>
              </div>
              <p className="text-gray-600 mb-4">
                For React, Vue, or other modern frameworks:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
                <pre>{`npm install @fashionmirror/widget`}</pre>
              </div>
              <p className="text-gray-600 mb-2">Then import and initialize:</p>
              <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
                <pre>{`import { FashionMirror } from '@fashionmirror/widget';

// Initialize on app load
FashionMirror.init({
  merchantKey: 'mk_test_your_api_key'
});`}</pre>
              </div>
            </div>

            {/* CDN with Async */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Async Loading (Performance Optimized)</h3>
              <p className="text-gray-600 mb-4">
                Load the widget asynchronously to prevent blocking page render:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
                <pre>{`<script>
  (function(w,d,s,l,i){
    w[l]=w[l]||[];
    var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s);
    j.async=true;
    j.src='https://cdn.fashionmirror.shop/widget.js';
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','FashionMirrorQueue','fm');
</script>`}</pre>
              </div>
            </div>
          </section>

          {/* Adding Mirror.me Buttons */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Adding Mirror.me Buttons</h2>
            <p className="text-gray-600 mb-4">
              Add buttons to your product pages that trigger the try-on experience.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Button</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-6">
              <pre>{`<button
  class="mirror-me-button"
  data-merchant-key="mk_test_your_api_key"
  data-product-image="https://yourstore.com/product.jpg"
  data-product-name="Summer Dress"
>
  Mirror.me
</button>`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Full Configuration</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`<button
  class="mirror-me-button"
  data-merchant-key="mk_test_your_api_key"
  data-product-image="https://yourstore.com/product.jpg"
  data-product-name="Summer Dress"
  data-product-id="SKU-12345"
  data-product-price="89.99"
  data-product-currency="USD"
  data-product-category="dress"
  data-callback-url="https://yourstore.com/api/tryon-callback"
>
  Mirror.me
</button>`}</pre>
            </div>
          </section>

          {/* Data Attributes Reference */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Attributes Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Attribute</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Required</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-merchant-key</td>
                    <td className="px-4 py-3"><span className="text-green-600">Yes</span></td>
                    <td className="px-4 py-3 text-gray-600">Your API key</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-product-image</td>
                    <td className="px-4 py-3"><span className="text-green-600">Yes</span></td>
                    <td className="px-4 py-3 text-gray-600">URL to product image (must be publicly accessible)</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-product-name</td>
                    <td className="px-4 py-3"><span className="text-green-600">Yes</span></td>
                    <td className="px-4 py-3 text-gray-600">Product name shown in widget</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-product-id</td>
                    <td className="px-4 py-3"><span className="text-gray-400">No</span></td>
                    <td className="px-4 py-3 text-gray-600">Your product SKU/ID for analytics</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-product-price</td>
                    <td className="px-4 py-3"><span className="text-gray-400">No</span></td>
                    <td className="px-4 py-3 text-gray-600">Product price (numeric)</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-product-currency</td>
                    <td className="px-4 py-3"><span className="text-gray-400">No</span></td>
                    <td className="px-4 py-3 text-gray-600">Currency code (USD, EUR, etc.)</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-product-category</td>
                    <td className="px-4 py-3"><span className="text-gray-400">No</span></td>
                    <td className="px-4 py-3 text-gray-600">Category: dress, top, pants, jacket, etc.</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-callback-url</td>
                    <td className="px-4 py-3"><span className="text-gray-400">No</span></td>
                    <td className="px-4 py-3 text-gray-600">Webhook URL for try-on events</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Verifying Installation */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Verifying Installation</h2>
            <p className="text-gray-600 mb-4">
              After adding the script and button, verify the installation:
            </p>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full text-sm font-bold">1</span>
                <div>
                  <strong className="text-gray-900">Open browser console</strong>
                  <p className="text-gray-600 text-sm">Press F12 or right-click → Inspect → Console</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full text-sm font-bold">2</span>
                <div>
                  <strong className="text-gray-900">Check for initialization message</strong>
                  <p className="text-gray-600 text-sm">You should see: <code className="bg-gray-100 px-1 rounded">[FashionMirror] Widget initialized</code></p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full text-sm font-bold">3</span>
                <div>
                  <strong className="text-gray-900">Click the Mirror.me button</strong>
                  <p className="text-gray-600 text-sm">The widget modal should open</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full text-sm font-bold">4</span>
                <div>
                  <strong className="text-gray-900">Test a try-on</strong>
                  <p className="text-gray-600 text-sm">Upload a photo and verify the AI generates a result</p>
                </div>
              </li>
            </ol>
          </section>

          {/* Troubleshooting */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Troubleshooting</h2>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <strong className="text-gray-900">Widget not loading?</strong>
                <ul className="text-gray-600 text-sm mt-2 space-y-1">
                  <li>• Check that the script tag is in your HTML</li>
                  <li>• Verify no ad blockers are blocking the CDN</li>
                  <li>• Check browser console for errors</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <strong className="text-gray-900">Button not responding?</strong>
                <ul className="text-gray-600 text-sm mt-2 space-y-1">
                  <li>• Ensure button has <code className="bg-gray-100 px-1 rounded">class="mirror-me-button"</code></li>
                  <li>• Check that required data attributes are present</li>
                  <li>• Make sure script loads before button click</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <strong className="text-gray-900">Authentication errors?</strong>
                <ul className="text-gray-600 text-sm mt-2 space-y-1">
                  <li>• Verify your API key is correct</li>
                  <li>• Use <code className="bg-gray-100 px-1 rounded">mk_test_</code> keys for development</li>
                  <li>• Check domain whitelisting for live keys</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link href="/docs/authentication">
              <span className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Authentication
              </span>
            </Link>
            <Link href="/docs/widget/configuration">
              <span className="text-primary hover:underline">
                Configuration →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>);
}
