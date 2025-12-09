import { Link } from "wouter";
import { motion } from "framer-motion";
export default function DocsQuickstart() {
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
              <li className="text-gray-900 font-medium">Quick Start</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Quick Start Guide</h1>
          <p className="text-xl text-gray-600 mb-8">
            Get FashionMirror virtual try-on running on your site in under 5 minutes.
          </p>

          {/* Prerequisites */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prerequisites</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <div>
                    <strong className="text-gray-900">Merchant Account</strong>
                    <p className="text-gray-600 text-sm">Sign up at <Link href="/merchant/register"><span className="text-primary hover:underline">fashionmirror.shop/merchant/register</span></Link></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <div>
                    <strong className="text-gray-900">API Key</strong>
                    <p className="text-gray-600 text-sm">Get your API key from the merchant dashboard</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <div>
                    <strong className="text-gray-900">Product Images</strong>
                    <p className="text-gray-600 text-sm">High-quality product images on a clean background work best</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Step 1 */}
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <span className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold text-sm">1</span>
              <h2 className="text-2xl font-semibold text-gray-900">Add the Widget Script</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Add the FashionMirror widget script to your HTML. Place it before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`<script src="https://cdn.fashionmirror.shop/widget.js"></script>`}</pre>
            </div>
          </section>

          {/* Step 2 */}
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <span className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold text-sm">2</span>
              <h2 className="text-2xl font-semibold text-gray-900">Add a Mirror.me Button</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Add the Mirror.me button to your product pages. The widget reads data attributes to configure the try-on experience.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`<button
  class="mirror-me-button"
  data-merchant-key="mk_test_your_api_key"
  data-product-image="https://yourstore.com/products/dress.jpg"
  data-product-name="Summer Floral Dress"
  data-product-id="prod_123"
  data-product-price="89.99"
  data-product-currency="USD"
>
  Mirror.me
</button>`}</pre>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-lg">💡</span>
                <div>
                  <p className="text-blue-900 font-medium">Tip</p>
                  <p className="text-blue-800 text-sm">Use <code className="bg-blue-100 px-1 rounded">mk_test_</code> keys for development. They work on any domain without whitelisting.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 3 */}
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <span className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold text-sm">3</span>
              <h2 className="text-2xl font-semibold text-gray-900">Style the Button (Optional)</h2>
            </div>
            <p className="text-gray-600 mb-4">
              The widget comes with default styling, but you can customize it to match your brand.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`<style>
  .mirror-me-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .mirror-me-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
</style>`}</pre>
            </div>
          </section>

          {/* Complete Example */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Complete Example</h2>
            <p className="text-gray-600 mb-4">
              Here's a complete HTML page with the FashionMirror widget integrated:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Page - Your Store</title>
</head>
<body>
  <div class="product-page">
    <img src="https://yourstore.com/products/dress.jpg" alt="Summer Dress">
    <h1>Summer Floral Dress</h1>
    <p class="price">$89.99</p>

    <!-- FashionMirror Mirror.me Button -->
    <button
      class="mirror-me-button"
      data-merchant-key="mk_test_your_api_key"
      data-product-image="https://yourstore.com/products/dress.jpg"
      data-product-name="Summer Floral Dress"
      data-product-id="prod_123"
      data-product-price="89.99"
      data-product-currency="USD"
    >
      Mirror.me
    </button>

    <button class="add-to-cart">Add to Cart</button>
  </div>

  <!-- FashionMirror Widget Script -->
  <script src="https://cdn.fashionmirror.shop/widget.js"></script>
</body>
</html>`}</pre>
            </div>
          </section>

          {/* What Happens Next */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Happens Next?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <strong className="text-gray-900">User Clicks "Mirror.me"</strong>
                  <p className="text-gray-600 text-sm">The widget opens a modal overlay on your page</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <strong className="text-gray-900">User Uploads Photo</strong>
                  <p className="text-gray-600 text-sm">They can take a photo or upload an existing one</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <strong className="text-gray-900">AI Generates Try-On</strong>
                  <p className="text-gray-600 text-sm">Our AI processes the image in under 3 seconds</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                <span className="text-2xl">4️⃣</span>
                <div>
                  <strong className="text-gray-900">Result Displayed</strong>
                  <p className="text-gray-600 text-sm">User sees themselves wearing the product</p>
                </div>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section className="mb-12 p-6 bg-gradient-to-r from-primary/10 to-purple-100 rounded-xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Next Steps</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/docs/widget/configuration">
                <span className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <strong className="text-gray-900">Widget Configuration →</strong>
                  <p className="text-gray-600 text-sm">Learn all available options and settings</p>
                </span>
              </Link>
              <Link href="/docs/authentication">
                <span className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <strong className="text-gray-900">Authentication →</strong>
                  <p className="text-gray-600 text-sm">Set up domain whitelisting for production</p>
                </span>
              </Link>
              <Link href="/docs/api">
                <span className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <strong className="text-gray-900">API Reference →</strong>
                  <p className="text-gray-600 text-sm">Build custom integrations with our REST API</p>
                </span>
              </Link>
              <Link href="/docs/platforms/shopify">
                <span className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <strong className="text-gray-900">Platform Guides →</strong>
                  <p className="text-gray-600 text-sm">Shopify, WooCommerce, and React guides</p>
                </span>
              </Link>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link href="/docs">
              <span className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Back to Docs
              </span>
            </Link>
            <Link href="/docs/authentication">
              <span className="text-primary hover:underline">
                Authentication →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>);
}
