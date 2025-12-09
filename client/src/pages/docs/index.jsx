import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
const sidebarSections = [
    {
        title: "Getting Started",
        items: [
            { label: "Introduction", href: "/docs" },
            { label: "Quick Start", href: "/docs/quickstart" },
            { label: "Authentication", href: "/docs/authentication" },
        ]
    },
    {
        title: "Widget Integration",
        items: [
            { label: "Installation", href: "/docs/widget/installation" },
            { label: "Configuration", href: "/docs/widget/configuration" },
            { label: "Customization", href: "/docs/widget/customization" },
        ]
    },
    {
        title: "API Reference",
        items: [
            { label: "Overview", href: "/docs/api" },
            { label: "Sessions", href: "/docs/api/sessions" },
            { label: "Try-On", href: "/docs/api/try-on" },
            { label: "Webhooks", href: "/docs/api/webhooks" },
        ]
    },
    {
        title: "Platform Guides",
        items: [
            { label: "Shopify", href: "/docs/platforms/shopify" },
            { label: "WooCommerce", href: "/docs/platforms/woocommerce" },
            { label: "React / Next.js", href: "/docs/platforms/react" },
        ]
    },
];
export default function DocsIndex() {
    const [location] = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
              <span className="text-gray-600 font-medium">Developer Docs</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/merchant/login">
                <span className="text-gray-600 hover:text-gray-900 transition-colors">Dashboard</span>
              </Link>
              <a href="https://github.com/fashionmirror" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                <i className="fab fa-github text-xl"></i>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-6">
              {sidebarSections.map((section, idx) => (<div key={idx}>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIdx) => (<li key={itemIdx}>
                        <Link href={item.href}>
                          <span className={`block px-3 py-2 rounded-lg text-sm transition-colors ${location === item.href
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                            {item.label}
                          </span>
                        </Link>
                      </li>))}
                  </ul>
                </div>))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Hero */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 mb-12 text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  FashionMirror Developer Documentation
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl">
                  Integrate AI-powered virtual try-on into your e-commerce platform in minutes.
                  Boost conversions and reduce returns with realistic try-on experiences.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/docs/quickstart">
                    <span className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
                      Quick Start Guide
                      <i className="fas fa-arrow-right"></i>
                    </span>
                  </Link>
                  <Link href="/docs/api">
                    <span className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/20">
                      API Reference
                    </span>
                  </Link>
                </div>
              </div>

              {/* Quick Links Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {[
            {
                icon: "fa-bolt",
                title: "Quick Start",
                desc: "Get up and running in under 5 minutes with our simple integration guide.",
                href: "/docs/quickstart"
            },
            {
                icon: "fa-code",
                title: "Widget Integration",
                desc: "Add the try-on button to your product pages with a single script tag.",
                href: "/docs/widget/installation"
            },
            {
                icon: "fa-plug",
                title: "API Reference",
                desc: "Complete REST API documentation with examples and SDKs.",
                href: "/docs/api"
            },
            {
                icon: "fa-bell",
                title: "Webhooks",
                desc: "Receive real-time notifications for try-on events in your backend.",
                href: "/docs/api/webhooks"
            },
            {
                icon: "fa-shopping-cart",
                title: "Shopify",
                desc: "Step-by-step guide for integrating with your Shopify store.",
                href: "/docs/platforms/shopify"
            },
            {
                icon: "fa-shield-alt",
                title: "Authentication",
                desc: "Learn about API keys, domain whitelisting, and security best practices.",
                href: "/docs/authentication"
            },
        ].map((card, idx) => (<Link key={idx} href={card.href}>
                    <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer h-full">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <i className={`fas ${card.icon} text-primary text-xl`}></i>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                      <p className="text-gray-600 text-sm">{card.desc}</p>
                    </motion.div>
                  </Link>))}
              </div>

              {/* Code Example */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-12">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Quick Integration Example</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">HTML</span>
                </div>
                <pre className="p-6 bg-gray-900 text-gray-100 text-sm overflow-x-auto">
                  <code>{`<!-- Add to your product page -->
<script src="https://cdn.fashionmirror.shop/widget.js"></script>

<button
  class="mirror-me-button"
  data-merchant-key="mk_test_your_api_key"
  data-product-image="https://yourstore.com/product.jpg"
  data-product-name="Summer Dress"
>
  Mirror.me
</button>`}</code>
                </pre>
              </div>

              {/* Support Section */}
              <div className="bg-gray-100 rounded-xl p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-gray-600 mb-6">
                  Our team is here to help you integrate FashionMirror into your platform.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a href="mailto:support@fashionmirror.shop" className="inline-flex items-center gap-2 text-primary hover:underline">
                    <i className="fas fa-envelope"></i>
                    support@fashionmirror.shop
                  </a>
                  <span className="text-gray-300">|</span>
                  <a href="https://github.com/fashionmirror/issues" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                    <i className="fab fa-github"></i>
                    GitHub Issues
                  </a>
                </div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&copy; 2025 FashionMirror. All rights reserved.</p>
        </div>
      </footer>
    </div>);
}
