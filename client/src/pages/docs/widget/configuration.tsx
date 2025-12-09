import { Link } from "wouter";
import { motion } from "framer-motion";

export default function DocsWidgetConfiguration() {
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
              <li><span className="hover:text-gray-900">Widget</span></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Configuration</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Widget Configuration</h1>
          <p className="text-xl text-gray-600 mb-8">
            Configure the widget behavior, appearance, and callbacks.
          </p>

          {/* Global Configuration */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Global Configuration</h2>
            <p className="text-gray-600 mb-4">
              Initialize the widget with global options that apply to all try-on buttons:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`<script>
  window.FashionMirrorConfig = {
    // Required
    merchantKey: 'mk_test_your_api_key',

    // Appearance
    theme: 'light',              // 'light' | 'dark' | 'auto'
    primaryColor: '#667eea',     // Brand color for buttons
    borderRadius: '12px',        // Modal border radius

    // Behavior
    closeOnBackdrop: true,       // Close when clicking outside
    showWatermark: false,        // Show FashionMirror branding
    maxTryOns: 3,                // Max try-ons per session

    // Callbacks
    onOpen: function() { },
    onClose: function() { },
    onTryOnStart: function(data) { },
    onTryOnComplete: function(result) { },
    onError: function(error) { },

    // Analytics
    trackEvents: true,           // Send anonymous analytics
    userId: null                 // Optional user ID for tracking
  };
</script>
<script src="https://cdn.fashionmirror.shop/widget.js"></script>`}</pre>
            </div>
          </section>

          {/* Configuration Options */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Configuration Options</h2>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Appearance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Option</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Default</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">theme</td>
                    <td className="px-4 py-3 text-gray-600">string</td>
                    <td className="px-4 py-3 text-gray-600">'light'</td>
                    <td className="px-4 py-3 text-gray-600">Color theme: 'light', 'dark', or 'auto'</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">primaryColor</td>
                    <td className="px-4 py-3 text-gray-600">string</td>
                    <td className="px-4 py-3 text-gray-600">'#667eea'</td>
                    <td className="px-4 py-3 text-gray-600">Hex color for buttons and accents</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">borderRadius</td>
                    <td className="px-4 py-3 text-gray-600">string</td>
                    <td className="px-4 py-3 text-gray-600">'12px'</td>
                    <td className="px-4 py-3 text-gray-600">Border radius for modal and buttons</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">showWatermark</td>
                    <td className="px-4 py-3 text-gray-600">boolean</td>
                    <td className="px-4 py-3 text-gray-600">false</td>
                    <td className="px-4 py-3 text-gray-600">Show "Powered by FashionMirror"</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Behavior</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Option</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Default</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">closeOnBackdrop</td>
                    <td className="px-4 py-3 text-gray-600">boolean</td>
                    <td className="px-4 py-3 text-gray-600">true</td>
                    <td className="px-4 py-3 text-gray-600">Close modal when clicking backdrop</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">closeOnEscape</td>
                    <td className="px-4 py-3 text-gray-600">boolean</td>
                    <td className="px-4 py-3 text-gray-600">true</td>
                    <td className="px-4 py-3 text-gray-600">Close modal on Escape key</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">maxTryOns</td>
                    <td className="px-4 py-3 text-gray-600">number</td>
                    <td className="px-4 py-3 text-gray-600">3</td>
                    <td className="px-4 py-3 text-gray-600">Maximum try-ons per session</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">preservePhoto</td>
                    <td className="px-4 py-3 text-gray-600">boolean</td>
                    <td className="px-4 py-3 text-gray-600">true</td>
                    <td className="px-4 py-3 text-gray-600">Remember user photo across sessions</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Callbacks */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Callbacks</h2>
            <p className="text-gray-600 mb-4">
              Use callbacks to react to widget events in your application.
            </p>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-mono text-gray-900 font-semibold mb-2">onOpen()</h4>
                <p className="text-gray-600 text-sm mb-3">Called when the widget modal opens.</p>
                <div className="bg-gray-900 rounded-lg p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                  <pre>{`onOpen: function() {
  console.log('Widget opened');
  // Pause video, hide other modals, etc.
}`}</pre>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-mono text-gray-900 font-semibold mb-2">onClose()</h4>
                <p className="text-gray-600 text-sm mb-3">Called when the widget modal closes.</p>
                <div className="bg-gray-900 rounded-lg p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                  <pre>{`onClose: function() {
  console.log('Widget closed');
  // Resume video, show promo, etc.
}`}</pre>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-mono text-gray-900 font-semibold mb-2">onTryOnStart(data)</h4>
                <p className="text-gray-600 text-sm mb-3">Called when a try-on is initiated.</p>
                <div className="bg-gray-900 rounded-lg p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                  <pre>{`onTryOnStart: function(data) {
  console.log('Try-on started:', data);
  // data = { sessionId, productId, productName }
}`}</pre>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-mono text-gray-900 font-semibold mb-2">onTryOnComplete(result)</h4>
                <p className="text-gray-600 text-sm mb-3">Called when the AI generates the try-on result.</p>
                <div className="bg-gray-900 rounded-lg p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                  <pre>{`onTryOnComplete: function(result) {
  console.log('Try-on complete:', result);
  // result = {
  //   sessionId,
  //   resultImageUrl,
  //   productId,
  //   processingTime
  // }

  // Track conversion
  analytics.track('try_on_completed', {
    productId: result.productId,
    time: result.processingTime
  });
}`}</pre>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-mono text-gray-900 font-semibold mb-2">onError(error)</h4>
                <p className="text-gray-600 text-sm mb-3">Called when an error occurs.</p>
                <div className="bg-gray-900 rounded-lg p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                  <pre>{`onError: function(error) {
  console.error('Widget error:', error);
  // error = { code, message, userMessage }

  // Log to error tracking
  Sentry.captureException(error);
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* Programmatic Control */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Programmatic Control</h2>
            <p className="text-gray-600 mb-4">
              Control the widget programmatically using the JavaScript API.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`// Open widget with specific product
FashionMirror.open({
  productImage: 'https://yourstore.com/dress.jpg',
  productName: 'Summer Dress',
  productId: 'SKU-123',
  productSpecification: '100% Cotton, Machine Washable',
  productDescription: 'A comfortable everyday dress perfect for any occasion.'
});

// Close widget
FashionMirror.close();

// Check if widget is open
const isOpen = FashionMirror.isOpen();

// Get current session
const session = FashionMirror.getSession();

// Reset session (clear saved photo)
FashionMirror.reset();

// Update configuration at runtime
FashionMirror.configure({
  theme: 'dark',
  primaryColor: '#ff6b6b'
});`}</pre>
            </div>
          </section>

          {/* Per-Button Configuration */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Per-Button Configuration</h2>
            <p className="text-gray-600 mb-4">
              Override global settings for individual buttons using data attributes:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`<!-- Full button configuration with product details -->
<button
  class="mirror-me-button"
  data-merchant-key="mk_test_your_api_key"
  data-product-image="https://yourstore.com/dress.jpg"
  data-product-name="Summer Dress"
  data-product-id="SKU-123"
  data-product-specification="100% Cotton, Machine Washable"
  data-product-description="A beautiful summer dress perfect for any occasion. Features a flattering A-line silhouette with delicate floral print."
  data-theme="dark"
  data-primary-color="#ff6b6b"
>
  Mirror.me
</button>`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Product Data Attributes</h3>
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
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-product-image</td>
                    <td className="px-4 py-3 text-gray-600">Yes</td>
                    <td className="px-4 py-3 text-gray-600">URL to the product image (min 512x512px recommended)</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-product-name</td>
                    <td className="px-4 py-3 text-gray-600">No</td>
                    <td className="px-4 py-3 text-gray-600">Product name displayed in widget interface</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-product-id</td>
                    <td className="px-4 py-3 text-gray-600">No</td>
                    <td className="px-4 py-3 text-gray-600">Your internal product ID for analytics</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-product-specification</td>
                    <td className="px-4 py-3 text-gray-600">No</td>
                    <td className="px-4 py-3 text-gray-600">Short specs shown on result (e.g., "100% Cotton")</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">data-product-description</td>
                    <td className="px-4 py-3 text-gray-600">No</td>
                    <td className="px-4 py-3 text-gray-600">Long-form description shown on result screen</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link href="/docs/widget/installation">
              <span className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Installation
              </span>
            </Link>
            <Link href="/docs/widget/customization">
              <span className="text-primary hover:underline">
                Customization →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
