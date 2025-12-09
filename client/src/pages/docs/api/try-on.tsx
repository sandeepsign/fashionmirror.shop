import { Link } from "wouter";
import { motion } from "framer-motion";

export default function DocsAPITryOn() {
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
              <li><Link href="/docs/api"><span className="hover:text-gray-900">API</span></Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Try-On</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Try-On API</h1>
          <p className="text-xl text-gray-600 mb-8">
            Submit user photos and generate AI-powered virtual try-on images.
          </p>

          {/* Overview */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-600 mb-4">
              The Try-On API allows you to submit user photos and receive AI-generated images of the user wearing the product. Processing typically takes 2-5 seconds.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                <strong>Privacy Note:</strong> User photos are processed in real-time and automatically deleted after processing. We never store or use user images for training.
              </p>
            </div>
          </section>

          {/* Submit Try-On */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Submit Try-On</h2>
            <p className="text-gray-600 mb-4">Submit a user photo to generate a try-on image.</p>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">POST</span>
                <code className="text-gray-900 font-mono">/api/widget/session/:sessionId/try-on</code>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Body</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
              <pre>{`{
  "userPhotoUrl": "https://...",    // Option 1: URL to user photo
  "userPhotoBase64": "data:...",   // Option 2: Base64-encoded photo
  "options": {
    "quality": "high",              // Optional: low, medium, high (default)
    "preserveBackground": true,     // Optional: Keep original background
    "returnBase64": false           // Optional: Return result as base64
  }
}`}</pre>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-blue-800 text-sm">
                <strong>Tip:</strong> For best results, use a full-body photo with a clear, uncluttered background. The user should be facing the camera in a neutral pose.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Response</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
              <pre>{`{
  "success": true,
  "data": {
    "tryOnId": "try_xyz789abc",
    "status": "completed",
    "resultUrl": "https://cdn.fashionmirror.shop/results/try_xyz789abc.jpg",
    "thumbnailUrl": "https://cdn.fashionmirror.shop/results/try_xyz789abc_thumb.jpg",
    "processingTime": 2847,         // milliseconds
    "expiresAt": "2024-01-15T13:00:00Z",  // Result URL expires
    "session": {
      "tryOnsRemaining": 2,
      "tryOnsCompleted": 1
    }
  }
}`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Example with URL</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
              <pre>{`curl -X POST https://api.fashionmirror.shop/api/widget/session/ses_abc123/try-on \\
  -H "X-Merchant-Key: mk_test_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "userPhotoUrl": "https://example.com/user-photo.jpg"
  }'`}</pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Example with Base64</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`curl -X POST https://api.fashionmirror.shop/api/widget/session/ses_abc123/try-on \\
  -H "X-Merchant-Key: mk_test_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "userPhotoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'`}</pre>
            </div>
          </section>

          {/* Get Try-On Result */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Try-On Result</h2>
            <p className="text-gray-600 mb-4">Retrieve the result of a specific try-on.</p>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">GET</span>
                <code className="text-gray-900 font-mono">/api/widget/session/:sessionId/result</code>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Query Parameters</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Parameter</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">tryOnId</td>
                    <td className="px-4 py-3 text-gray-600">string</td>
                    <td className="px-4 py-3 text-gray-600">Optional. If omitted, returns the latest result</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Response</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`{
  "success": true,
  "data": {
    "tryOnId": "try_xyz789abc",
    "status": "completed",
    "resultUrl": "https://cdn.fashionmirror.shop/results/try_xyz789abc.jpg",
    "thumbnailUrl": "https://cdn.fashionmirror.shop/results/try_xyz789abc_thumb.jpg",
    "createdAt": "2024-01-15T12:05:00Z",
    "expiresAt": "2024-01-15T13:00:00Z"
  }
}`}</pre>
            </div>
          </section>

          {/* Real-time Updates */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Real-time Updates (SSE)</h2>
            <p className="text-gray-600 mb-4">Subscribe to real-time status updates using Server-Sent Events.</p>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">GET</span>
                <code className="text-gray-900 font-mono">/api/widget/session/:sessionId/poll</code>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Types</h3>
            <div className="space-y-3 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <code className="text-primary font-mono text-sm">processing</code>
                <p className="text-gray-600 text-sm mt-1">Try-on is being generated</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <code className="text-primary font-mono text-sm">completed</code>
                <p className="text-gray-600 text-sm mt-1">Try-on is ready with result URL</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <code className="text-primary font-mono text-sm">error</code>
                <p className="text-gray-600 text-sm mt-1">An error occurred during processing</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">JavaScript Example</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              <pre>{`const eventSource = new EventSource(
  'https://api.fashionmirror.shop/api/widget/session/ses_abc123/poll'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.status) {
    case 'processing':
      console.log('Processing...', data.progress);
      break;

    case 'completed':
      console.log('Result ready:', data.resultUrl);
      displayResult(data.resultUrl);
      eventSource.close();
      break;

    case 'error':
      console.error('Error:', data.error);
      eventSource.close();
      break;
  }
};

eventSource.onerror = () => {
  console.error('Connection lost');
  eventSource.close();
};`}</pre>
            </div>
          </section>

          {/* Image Requirements */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Image Requirements</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">User Photo</h3>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Full-body or upper-body shot</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>JPEG, PNG, or WebP format</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Minimum 512x512 pixels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Maximum 10MB file size</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Clear, well-lit photo</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Best Practices</h3>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">💡</span>
                    <span>Neutral pose facing camera</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">💡</span>
                    <span>Plain or simple background</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">💡</span>
                    <span>Form-fitting clothing preferred</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">💡</span>
                    <span>Good lighting, no harsh shadows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">💡</span>
                    <span>Single person in frame</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Error Codes */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error Codes</h2>
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">400</span>
                  <code className="text-gray-900 font-mono text-sm">INVALID_USER_IMAGE</code>
                </div>
                <p className="text-gray-600 text-sm">User photo is invalid, corrupted, or doesn't meet requirements.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">400</span>
                  <code className="text-gray-900 font-mono text-sm">NO_PERSON_DETECTED</code>
                </div>
                <p className="text-gray-600 text-sm">Could not detect a person in the submitted photo.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">429</span>
                  <code className="text-gray-900 font-mono text-sm">MAX_TRYONS_EXCEEDED</code>
                </div>
                <p className="text-gray-600 text-sm">Session has reached the maximum number of try-ons.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">500</span>
                  <code className="text-gray-900 font-mono text-sm">PROCESSING_FAILED</code>
                </div>
                <p className="text-gray-600 text-sm">AI generation failed. Please retry with a different photo.</p>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link href="/docs/api/sessions">
              <span className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Sessions API
              </span>
            </Link>
            <Link href="/docs/api/webhooks">
              <span className="text-primary hover:underline">
                Webhooks →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
