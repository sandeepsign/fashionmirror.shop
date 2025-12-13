import { Link } from "wouter";
import { motion } from "framer-motion";

export default function DocsPlatformsShopify() {
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
              <li><span className="hover:text-gray-900">Platforms</span></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Shopify</li>
            </ol>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#96bf48] rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">S</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Shopify Integration</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Add virtual try-on to your Shopify store in under 10 minutes.
          </p>

          {/* Method Options */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Integration Methods</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border-2 border-primary/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Theme Editor (Recommended)</h3>
                <p className="text-gray-600 text-sm mb-3">Add via Shopify's theme customizer. No coding required.</p>
                <span className="text-xs text-primary font-medium">Best for: Most stores</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Theme Code</h3>
                <p className="text-gray-600 text-sm mb-3">Edit theme files directly for full control.</p>
                <span className="text-xs text-gray-500 font-medium">Best for: Custom themes</span>
              </div>
            </div>
          </section>

          {/* Method 1: Theme Editor */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Method 1: Theme Editor</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold text-sm shrink-0">1</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Open Theme Settings</h3>
                  <p className="text-gray-600 mb-2">
                    In your Shopify admin, go to <strong>Online Store → Themes → Customize</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold text-sm shrink-0">2</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Navigate to Product Page</h3>
                  <p className="text-gray-600 mb-2">
                    In the top dropdown, select <strong>Products → Default product</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold text-sm shrink-0">3</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Custom Liquid Block</h3>
                  <p className="text-gray-600 mb-2">
                    Click <strong>Add block</strong> in the product info section, then select <strong>Custom Liquid</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold text-sm shrink-0">4</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Paste the Widget Code</h3>
                  <p className="text-gray-600 mb-4">Copy and paste this code into the Custom Liquid block:</p>
                  <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
                    <pre>{`{% if product.featured_image %}
<button
  class="mirror-me-button"
  data-merchant-key="YOUR_API_KEY_HERE"
  data-product-image="{{ product.featured_image | image_url: width: 1000 }}"
  data-product-name="{{ product.title | escape }}"
  data-product-id="{{ product.id }}"
  data-product-price="{{ product.price | money_without_currency }}"
  data-product-currency="{{ cart.currency.iso_code }}"
  data-product-specification="{{ product.metafields.custom.specification | escape }}"
  data-product-description="{{ product.description | strip_html | truncate: 200 | escape }}"
  data-model-image="{{ product.metafields.custom.model_image | escape }}"
  style="
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    margin-top: 10px;
  "
>
  Mirror.me
</button>

<script src="https://cdn.fashionmirror.shop/widget.js"></script>
{% endif %}`}</pre>
                  </div>
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-green-500 text-lg">✨</span>
                      <div>
                        <p className="text-green-900 font-medium">New: Model Image Support</p>
                        <p className="text-green-800 text-sm">The <code className="bg-green-100 px-1 rounded">data-model-image</code> attribute lets you pre-load a model photo. Create a custom metafield <code className="bg-green-100 px-1 rounded">model_image</code> in Shopify to use this feature.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold text-sm shrink-0">5</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Save and Test</h3>
                  <p className="text-gray-600">
                    Click <strong>Save</strong> and preview your product page. The "Mirror.me" button should appear below the Add to Cart button.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Method 2: Theme Code */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Method 2: Theme Code</h2>
            <p className="text-gray-600 mb-4">
              For more control, add the code directly to your theme files.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 1: Add the Script</h3>
            <p className="text-gray-600 mb-2">
              Edit <code className="bg-gray-100 px-1 rounded">theme.liquid</code> and add before <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code>:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-6">
              <pre>{`<script src="https://cdn.fashionmirror.shop/widget.js"></script>`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 2: Add the Button</h3>
            <p className="text-gray-600 mb-2">
              Edit your product template (e.g., <code className="bg-gray-100 px-1 rounded">sections/main-product.liquid</code>) and add:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`{% if product.type == 'Dress' or product.type == 'Top' or product.type == 'Pants' %}
  <button
    class="mirror-me-button btn btn--secondary"
    data-merchant-key="{{ settings.fashionmirror_api_key }}"
    data-product-image="{{ product.featured_image | image_url: width: 1000 }}"
    data-product-name="{{ product.title | escape }}"
    data-product-id="{{ product.id }}"
    data-product-price="{{ product.price | money_without_currency }}"
    data-product-currency="{{ cart.currency.iso_code }}"
    data-product-category="{{ product.type | downcase }}"
    data-product-specification="{{ product.metafields.custom.specification | escape }}"
    data-product-description="{{ product.description | strip_html | truncate: 200 | escape }}"
  >
    Mirror.me
  </button>
{% endif %}`}</pre>
            </div>
          </section>

          {/* Theme Settings */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Adding to Theme Settings (Optional)</h2>
            <p className="text-gray-600 mb-4">
              Store your API key in theme settings so merchants can update it without editing code.
            </p>
            <p className="text-gray-600 mb-2">
              Add to <code className="bg-gray-100 px-1 rounded">config/settings_schema.json</code>:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`{
  "name": "FashionMirror",
  "settings": [
    {
      "type": "text",
      "id": "fashionmirror_api_key",
      "label": "FashionMirror API Key",
      "info": "Get your API key from fashionmirror.shop/merchant"
    },
    {
      "type": "checkbox",
      "id": "fashionmirror_enabled",
      "label": "Enable Virtual Try-On",
      "default": true
    }
  ]
}`}</pre>
            </div>
          </section>

          {/* Conditional Display */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Show Only on Clothing Products</h2>
            <p className="text-gray-600 mb-4">
              Use Shopify tags or product types to show the button only on relevant products:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`{% comment %} Show only if product has 'try-on' tag {% endcomment %}
{% if product.tags contains 'try-on' %}
  <button class="mirror-me-button" ...>Mirror.me</button>
{% endif %}

{% comment %} Or check product type {% endcomment %}
{% assign clothing_types = 'Dress,Top,Pants,Jacket,Skirt' | split: ',' %}
{% if clothing_types contains product.type %}
  <button class="mirror-me-button" ...>Mirror.me</button>
{% endif %}`}</pre>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Troubleshooting</h2>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <strong className="text-gray-900">Button not appearing?</strong>
                <ul className="text-gray-600 text-sm mt-2 space-y-1">
                  <li>• Check that the product has a featured image</li>
                  <li>• Verify the custom liquid block is visible (not hidden)</li>
                  <li>• Clear Shopify cache in theme settings</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <strong className="text-gray-900">Authentication error?</strong>
                <ul className="text-gray-600 text-sm mt-2 space-y-1">
                  <li>• Use <code className="bg-gray-100 px-1 rounded">mk_test_</code> keys on your development store</li>
                  <li>• Add your domain to the whitelist in merchant settings</li>
                  <li>• Ensure your domain uses HTTPS</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <strong className="text-gray-900">Widget not loading?</strong>
                <ul className="text-gray-600 text-sm mt-2 space-y-1">
                  <li>• Check browser console for errors</li>
                  <li>• Verify the script tag is not blocked by content security policy</li>
                  <li>• Ensure jQuery conflicts aren't preventing load</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link href="/docs/api/webhooks">
              <span className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Webhooks
              </span>
            </Link>
            <Link href="/docs/platforms/woocommerce">
              <span className="text-primary hover:underline">
                WooCommerce →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
