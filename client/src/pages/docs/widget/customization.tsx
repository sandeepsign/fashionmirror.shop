import { Link } from "wouter";
import { motion } from "framer-motion";

export default function DocsWidgetCustomization() {
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
              <li className="text-gray-900 font-medium">Customization</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Widget Customization</h1>
          <p className="text-xl text-gray-600 mb-8">
            Customize the widget's appearance to match your brand perfectly.
          </p>

          {/* Theme Presets */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Theme Presets</h2>
            <p className="text-gray-600 mb-4">
              Choose from built-in theme presets or create your own.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-full h-20 bg-white border border-gray-200 rounded mb-3 flex items-center justify-center">
                  <span className="text-gray-900 font-medium">Light</span>
                </div>
                <code className="text-sm text-gray-600">theme: 'light'</code>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                <div className="w-full h-20 bg-gray-900 border border-gray-700 rounded mb-3 flex items-center justify-center">
                  <span className="text-white font-medium">Dark</span>
                </div>
                <code className="text-sm text-gray-300">theme: 'dark'</code>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 rounded mb-3 flex items-center justify-center">
                  <span className="text-gray-700 font-medium">Auto</span>
                </div>
                <code className="text-sm text-gray-600">theme: 'auto'</code>
              </div>
            </div>
          </section>

          {/* CSS Variables */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">CSS Variables</h2>
            <p className="text-gray-600 mb-4">
              Override CSS variables for complete control over styling.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`:root {
  /* Colors */
  --fm-primary: #667eea;
  --fm-primary-hover: #5a67d8;
  --fm-secondary: #764ba2;
  --fm-background: #ffffff;
  --fm-surface: #f8fafc;
  --fm-text: #1a202c;
  --fm-text-muted: #718096;
  --fm-border: #e2e8f0;
  --fm-error: #e53e3e;
  --fm-success: #38a169;

  /* Spacing */
  --fm-spacing-xs: 4px;
  --fm-spacing-sm: 8px;
  --fm-spacing-md: 16px;
  --fm-spacing-lg: 24px;
  --fm-spacing-xl: 32px;

  /* Typography */
  --fm-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --fm-font-size-sm: 14px;
  --fm-font-size-md: 16px;
  --fm-font-size-lg: 18px;
  --fm-font-size-xl: 24px;

  /* Borders */
  --fm-border-radius-sm: 4px;
  --fm-border-radius-md: 8px;
  --fm-border-radius-lg: 12px;
  --fm-border-radius-full: 9999px;

  /* Shadows */
  --fm-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --fm-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --fm-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Modal */
  --fm-modal-max-width: 600px;
  --fm-modal-backdrop: rgba(0, 0, 0, 0.5);
}`}</pre>
            </div>
          </section>

          {/* Button Styling */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mirror.me Button Styling</h2>
            <p className="text-gray-600 mb-4">
              Style the trigger button to match your store's design.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Example Styles</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-6">
              <pre>{`/* Gradient Button */
.mirror-me-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.mirror-me-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.mirror-me-button:active {
  transform: translateY(0);
}

/* Add icon */
.mirror-me-button::before {
  content: '👗';
}`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Outline Style</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-6">
              <pre>{`/* Outline Button */
.mirror-me-button {
  background: transparent;
  color: #667eea;
  padding: 12px 24px;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mirror-me-button:hover {
  background: #667eea;
  color: white;
}`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Icon-Only Button</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`/* Icon Button */
.mirror-me-button {
  background: #667eea;
  color: white;
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mirror-me-button::before {
  content: '✨';
}`}</pre>
            </div>
          </section>

          {/* Modal Customization */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Modal Customization</h2>
            <p className="text-gray-600 mb-4">
              Customize the modal container and overlay.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`/* Modal Overlay */
.fm-modal-overlay {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

/* Modal Container */
.fm-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  max-width: 500px;
  width: 90%;
}

/* Modal Header */
.fm-modal-header {
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 24px;
}

/* Close Button */
.fm-modal-close {
  color: #718096;
  font-size: 24px;
}

.fm-modal-close:hover {
  color: #1a202c;
}`}</pre>
            </div>
          </section>

          {/* Result Display */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Result Display Customization</h2>
            <p className="text-gray-600 mb-4">
              Style the try-on result view.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`/* Result Container */
.fm-result {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

/* Result Image */
.fm-result-image {
  width: 100%;
  height: auto;
  display: block;
}

/* Loading Overlay */
.fm-loading {
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

/* Loading Spinner */
.fm-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: fm-spin 1s linear infinite;
}

@keyframes fm-spin {
  to { transform: rotate(360deg); }
}

/* Action Buttons */
.fm-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
}

.fm-action-button {
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
}`}</pre>
            </div>
          </section>

          {/* Custom Fonts */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Custom Fonts</h2>
            <p className="text-gray-600 mb-4">
              Use your brand's typography in the widget.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`/* Import your font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Apply to widget */
:root {
  --fm-font-family: 'Inter', sans-serif;
}

/* Or target specific elements */
.fm-modal-title {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
}

.fm-modal-body {
  font-family: 'Inter', sans-serif;
}`}</pre>
            </div>
          </section>

          {/* Responsive Customization */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Responsive Customization</h2>
            <p className="text-gray-600 mb-4">
              Adjust the widget for different screen sizes.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`/* Mobile styles */
@media (max-width: 640px) {
  .fm-modal {
    width: 100%;
    max-width: none;
    height: 100%;
    border-radius: 0;
  }

  .mirror-me-button {
    width: 100%;
    justify-content: center;
  }
}

/* Tablet styles */
@media (min-width: 641px) and (max-width: 1024px) {
  .fm-modal {
    max-width: 480px;
  }
}

/* Desktop styles */
@media (min-width: 1025px) {
  .fm-modal {
    max-width: 600px;
  }
}`}</pre>
            </div>
          </section>

          {/* Best Practices */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Best Practices</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-500 mt-0.5">✓</span>
                <div>
                  <strong className="text-green-900">Match your brand colors</strong>
                  <p className="text-green-800 text-sm">Use your primary brand color for buttons and accents for a cohesive look.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-500 mt-0.5">✓</span>
                <div>
                  <strong className="text-green-900">Maintain contrast</strong>
                  <p className="text-green-800 text-sm">Ensure text and buttons have sufficient contrast for accessibility.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-500 mt-0.5">✓</span>
                <div>
                  <strong className="text-green-900">Test on mobile</strong>
                  <p className="text-green-800 text-sm">Always test customizations on mobile devices where most shopping happens.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-red-500 mt-0.5">✗</span>
                <div>
                  <strong className="text-red-900">Don't hide important UI</strong>
                  <p className="text-red-800 text-sm">Keep the close button, upload area, and result actions visible and accessible.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link href="/docs/widget/configuration">
              <span className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Configuration
              </span>
            </Link>
            <Link href="/docs/api">
              <span className="text-primary hover:underline">
                API Reference →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
