import { Link } from "wouter";
import { motion } from "framer-motion";
export default function DocsPlatformsReact() {
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
              <li><span className="hover:text-gray-900">Platforms</span></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">React / Next.js</li>
            </ol>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#61dafb] rounded-lg flex items-center justify-center">
              <span className="text-gray-900 text-xl font-bold">R</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">React / Next.js Integration</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Integrate FashionMirror into your React or Next.js application.
          </p>

          {/* Installation */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Installation</h2>
              <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">Coming Soon</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-800 text-sm">
                The <code className="bg-amber-100 px-1 rounded">@fashionmirror/react</code> package is not yet published.
                For now, use the <a href="/docs/widget/installation" className="underline font-medium">CDN script method</a> to integrate FashionMirror.
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4 opacity-60">
              <pre>{`npm install @fashionmirror/react`}</pre>
            </div>
            <p className="text-gray-600">Or with yarn:</p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto opacity-60">
              <pre>{`yarn add @fashionmirror/react`}</pre>
            </div>
          </section>

          {/* Provider Setup */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Provider Setup</h2>
            <p className="text-gray-600 mb-4">
              Wrap your app with the FashionMirror provider to initialize the widget:
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">React (Vite, CRA)</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
              <pre>{`// src/main.tsx or src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { FashionMirrorProvider } from '@fashionmirror/react';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FashionMirrorProvider
      merchantKey={import.meta.env.VITE_FASHIONMIRROR_KEY}
      theme="light"
    >
      <App />
    </FashionMirrorProvider>
  </React.StrictMode>
);`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Next.js (App Router)</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`// app/providers.tsx
'use client';

import { FashionMirrorProvider } from '@fashionmirror/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FashionMirrorProvider
      merchantKey={process.env.NEXT_PUBLIC_FASHIONMIRROR_KEY}
      theme="light"
    >
      {children}
    </FashionMirrorProvider>
  );
}

// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}`}</pre>
            </div>
          </section>

          {/* TryOnButton Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">TryOnButton Component</h2>
            <p className="text-gray-600 mb-4">
              Use the pre-built button component on your product pages:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`import { TryOnButton } from '@fashionmirror/react';

function ProductPage({ product }) {
  return (
    <div className="product-page">
      <img src={product.image} alt={product.name} />
      <h1>{product.name}</h1>
      <p className="price">\${product.price}</p>

      <TryOnButton
        product={{
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          currency: 'USD',
          category: product.category, // 'dress', 'top', 'pants', etc.
        }}
        className="try-on-btn"
        onComplete={(result) => {
          console.log('Try-on complete:', result);
          // Track conversion, show success message, etc.
        }}
        onError={(error) => {
          console.error('Try-on error:', error);
        }}
      >
        Mirror.me
      </TryOnButton>

      <button className="add-to-cart">Add to Cart</button>
    </div>
  );
}`}</pre>
            </div>
          </section>

          {/* useTryOn Hook */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">useTryOn Hook</h2>
            <p className="text-gray-600 mb-4">
              For custom implementations, use the hook to control the widget programmatically:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`import { useTryOn } from '@fashionmirror/react';

function CustomProductPage({ product }) {
  const {
    openWidget,
    closeWidget,
    isOpen,
    isLoading,
    result,
    error,
    reset,
  } = useTryOn({
    onComplete: (result) => {
      console.log('Try-on result:', result.resultUrl);
    },
  });

  const handleTryOn = () => {
    openWidget({
      id: product.id,
      name: product.name,
      image: product.imageUrl,
      price: product.price,
      currency: 'USD',
    });
  };

  return (
    <div>
      <button onClick={handleTryOn} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Mirror.me'}
      </button>

      {result && (
        <div className="result">
          <img src={result.resultUrl} alt="Try-on result" />
          <button onClick={reset}>Try Another</button>
        </div>
      )}

      {error && (
        <div className="error">
          {error.userMessage}
          <button onClick={reset}>Retry</button>
        </div>
      )}
    </div>
  );
}`}</pre>
            </div>
          </section>

          {/* Props Reference */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Props Reference</h2>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">FashionMirrorProvider</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Prop</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">merchantKey</td>
                    <td className="px-4 py-3 text-gray-600">string</td>
                    <td className="px-4 py-3 text-gray-600">Your FashionMirror API key</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">theme</td>
                    <td className="px-4 py-3 text-gray-600">'light' | 'dark' | 'auto'</td>
                    <td className="px-4 py-3 text-gray-600">Widget color theme</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">primaryColor</td>
                    <td className="px-4 py-3 text-gray-600">string</td>
                    <td className="px-4 py-3 text-gray-600">Hex color for accent elements</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">TryOnButton</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Prop</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">product</td>
                    <td className="px-4 py-3 text-gray-600">Product</td>
                    <td className="px-4 py-3 text-gray-600">Product details object (required)</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">onComplete</td>
                    <td className="px-4 py-3 text-gray-600">(result) =&gt; void</td>
                    <td className="px-4 py-3 text-gray-600">Callback when try-on completes</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">onError</td>
                    <td className="px-4 py-3 text-gray-600">(error) =&gt; void</td>
                    <td className="px-4 py-3 text-gray-600">Callback when an error occurs</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">disabled</td>
                    <td className="px-4 py-3 text-gray-600">boolean</td>
                    <td className="px-4 py-3 text-gray-600">Disable the button</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">className</td>
                    <td className="px-4 py-3 text-gray-600">string</td>
                    <td className="px-4 py-3 text-gray-600">CSS class for styling</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* TypeScript Types */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">TypeScript Types</h2>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`interface Product {
  id: string;
  name: string;
  image: string;
  price?: number;
  currency?: string;
  category?: 'dress' | 'top' | 'pants' | 'jacket' | 'skirt';
}

interface TryOnResult {
  tryOnId: string;
  sessionId: string;
  resultUrl: string;
  thumbnailUrl: string;
  processingTime: number;
}

interface TryOnError {
  code: string;
  message: string;
  userMessage: string;
}`}</pre>
            </div>
          </section>

          {/* Server-Side Rendering */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Server-Side Rendering (SSR)</h2>
            <p className="text-gray-600 mb-4">
              The widget is client-side only. For SSR frameworks like Next.js, the provider and components automatically handle hydration.
            </p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> Never expose your API key in server-side code. Always use environment variables prefixed with <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_</code> or <code className="bg-amber-100 px-1 rounded">VITE_</code>.
              </p>
            </div>
          </section>

          {/* Example: Next.js E-commerce */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Complete Example: Next.js Product Page</h2>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`// app/products/[id]/page.tsx
import { TryOnButton } from '@fashionmirror/react';
import { getProduct } from '@/lib/products';

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);

  return (
    <main className="container mx-auto py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full rounded-lg"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl text-gray-600 mt-2">
            \${product.price.toFixed(2)}
          </p>
          <p className="mt-4 text-gray-600">{product.description}</p>

          <div className="mt-6 space-y-3">
            <TryOnButton
              product={{
                id: product.id,
                name: product.name,
                image: product.images[0],
                price: product.price,
                currency: 'USD',
                category: product.category,
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold"
            >
              Mirror.me
            </TryOnButton>

            <button className="w-full py-3 bg-black text-white rounded-lg font-semibold">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}`}</pre>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link href="/docs/platforms/woocommerce">
              <span className="text-gray-600 hover:text-gray-900 transition-colors">
                ← WooCommerce
              </span>
            </Link>
            <Link href="/docs">
              <span className="text-primary hover:underline">
                Back to Docs →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>);
}
