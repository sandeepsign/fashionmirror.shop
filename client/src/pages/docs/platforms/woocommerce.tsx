import { Link } from "wouter";
import { motion } from "framer-motion";

export default function DocsPlatformsWooCommerce() {
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
              <li className="text-gray-900 font-medium">WooCommerce</li>
            </ol>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#96588a] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">W</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">WooCommerce Integration</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Add virtual try-on to your WooCommerce store with our WordPress plugin or custom code.
          </p>

          {/* Method Options */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Integration Methods</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border-2 border-primary/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Plugin (Coming Soon)</h3>
                <p className="text-gray-600 text-sm mb-3">One-click installation from WordPress plugins directory.</p>
                <span className="text-xs text-primary font-medium">Best for: Non-developers</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Code</h3>
                <p className="text-gray-600 text-sm mb-3">Add via functions.php or custom plugin.</p>
                <span className="text-xs text-gray-500 font-medium">Best for: Developers</span>
              </div>
            </div>
          </section>

          {/* Quick Setup */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Setup (functions.php)</h2>
            <p className="text-gray-600 mb-4">
              Add this code to your theme's <code className="bg-gray-100 px-1 rounded">functions.php</code> file or a custom plugin:
            </p>

            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
              <pre>{`<?php
/**
 * FashionMirror Virtual Try-On Integration
 */

// Add the widget script to footer
add_action('wp_footer', 'fashionmirror_add_script');
function fashionmirror_add_script() {
    if (is_product()) {
        echo '<script src="https://cdn.fashionmirror.shop/widget.js"></script>';
    }
}

// Add Mirror.me button after Add to Cart
add_action('woocommerce_after_add_to_cart_button', 'fashionmirror_add_button');
function fashionmirror_add_button() {
    global $product;

    // Only show for clothing categories
    $clothing_cats = array('dresses', 'tops', 'pants', 'jackets');
    $product_cats = wp_get_post_terms($product->get_id(), 'product_cat', array('fields' => 'slugs'));

    if (!array_intersect($clothing_cats, $product_cats)) {
        return;
    }

    $image_id = $product->get_image_id();
    $image_url = wp_get_attachment_image_url($image_id, 'large');

    if (!$image_url) {
        return;
    }

    // Get API key from settings
    $api_key = get_option('fashionmirror_api_key', 'YOUR_API_KEY_HERE');

    // Get model image from product meta (optional)
    $model_image = get_post_meta($product->get_id(), '_fashionmirror_model_image', true);

    ?>
    <button
        type="button"
        class="mirror-me-button button alt"
        data-merchant-key="<?php echo esc_attr($api_key); ?>"
        data-product-image="<?php echo esc_url($image_url); ?>"
        data-product-name="<?php echo esc_attr($product->get_name()); ?>"
        data-product-id="<?php echo esc_attr($product->get_id()); ?>"
        data-product-price="<?php echo esc_attr($product->get_price()); ?>"
        data-product-currency="<?php echo esc_attr(get_woocommerce_currency()); ?>"
        data-product-specification="<?php echo esc_attr($product->get_attribute('material')); ?>"
        data-product-description="<?php echo esc_attr(wp_trim_words($product->get_short_description(), 30)); ?>"
        <?php if ($model_image) : ?>
        data-model-image="<?php echo esc_url($model_image); ?>"
        <?php endif; ?>
        style="margin-top: 10px; width: 100%;"
    >
        Mirror.me
    </button>
    <?php
}`}</pre>
            </div>
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-lg">✨</span>
                <div>
                  <p className="text-green-900 font-medium">New: Model Image Support</p>
                  <p className="text-green-800 text-sm">The <code className="bg-green-100 px-1 rounded">data-model-image</code> attribute lets you pre-load a model photo. Add a custom field <code className="bg-green-100 px-1 rounded">_fashionmirror_model_image</code> to your products with the model image URL.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Settings Page */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Add Settings Page (Optional)</h2>
            <p className="text-gray-600 mb-4">
              Create a settings page to manage your API key from the WordPress admin:
            </p>

            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`<?php
// Add settings page
add_action('admin_menu', 'fashionmirror_settings_menu');
function fashionmirror_settings_menu() {
    add_options_page(
        'FashionMirror Settings',
        'FashionMirror',
        'manage_options',
        'fashionmirror',
        'fashionmirror_settings_page'
    );
}

// Register settings
add_action('admin_init', 'fashionmirror_register_settings');
function fashionmirror_register_settings() {
    register_setting('fashionmirror_options', 'fashionmirror_api_key');
    register_setting('fashionmirror_options', 'fashionmirror_enabled');
}

// Settings page HTML
function fashionmirror_settings_page() {
    ?>
    <div class="wrap">
        <h1>FashionMirror Settings</h1>
        <form method="post" action="options.php">
            <?php settings_fields('fashionmirror_options'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">API Key</th>
                    <td>
                        <input type="text"
                               name="fashionmirror_api_key"
                               value="<?php echo esc_attr(get_option('fashionmirror_api_key')); ?>"
                               class="regular-text" />
                        <p class="description">
                            Get your API key from
                            <a href="https://fashionmirror.shop/merchant" target="_blank">
                                fashionmirror.shop/merchant
                            </a>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Enable Try-On</th>
                    <td>
                        <label>
                            <input type="checkbox"
                                   name="fashionmirror_enabled"
                                   value="1"
                                   <?php checked(get_option('fashionmirror_enabled', 1)); ?> />
                            Show Mirror.me button on product pages
                        </label>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}`}</pre>
            </div>
          </section>

          {/* Styling */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Button Styling</h2>
            <p className="text-gray-600 mb-4">
              Add custom CSS to style the button to match your theme:
            </p>

            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`/* Add to your theme's style.css or Customizer > Additional CSS */

.mirror-me-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white !important;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    margin-top: 10px;
    transition: all 0.2s ease;
}

.mirror-me-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Match Storefront theme */
.woocommerce .mirror-me-button {
    background: var(--primary-color, #667eea);
}

/* Match Flatsome theme */
.product-info .mirror-me-button {
    border-radius: 0;
    text-transform: uppercase;
}`}</pre>
            </div>
          </section>

          {/* Hooks */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Available Hooks</h2>
            <p className="text-gray-600 mb-4">
              Use these WooCommerce hooks to position the button:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Hook</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">woocommerce_before_add_to_cart_button</td>
                    <td className="px-4 py-3 text-gray-600">Before Add to Cart</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">woocommerce_after_add_to_cart_button</td>
                    <td className="px-4 py-3 text-gray-600">After Add to Cart (recommended for Mirror.me)</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">woocommerce_product_meta_end</td>
                    <td className="px-4 py-3 text-gray-600">After product meta (SKU, categories)</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">woocommerce_share</td>
                    <td className="px-4 py-3 text-gray-600">After share buttons</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Troubleshooting</h2>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <strong className="text-gray-900">Button not showing?</strong>
                <ul className="text-gray-600 text-sm mt-2 space-y-1">
                  <li>• Check product is in a clothing category</li>
                  <li>• Verify product has a featured image</li>
                  <li>• Check for PHP errors in debug.log</li>
                  <li>• Clear any caching plugins</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <strong className="text-gray-900">Widget not loading?</strong>
                <ul className="text-gray-600 text-sm mt-2 space-y-1">
                  <li>• Check browser console for JavaScript errors</li>
                  <li>• Ensure the script is loading (Network tab)</li>
                  <li>• Check for jQuery conflicts with other plugins</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <strong className="text-gray-900">Variable products?</strong>
                <p className="text-gray-600 text-sm mt-2">
                  For variable products, you may need to update the product image dynamically when a variation is selected. Contact us for advanced integration support.
                </p>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link href="/docs/platforms/shopify">
              <span className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Shopify
              </span>
            </Link>
            <Link href="/docs/platforms/react">
              <span className="text-primary hover:underline">
                React / Next.js →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
