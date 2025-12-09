import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/merchant/DashboardLayout';
import { useMerchantAuth } from '@/contexts/MerchantAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, RefreshCw, Trash2, Plus, Key, Globe, Code, Loader2 } from 'lucide-react';

export default function MerchantIntegration() {
  const { apiKeys, refreshApiKeys } = useMerchantAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);
  const [isRegeneratingKeys, setIsRegeneratingKeys] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/merchants/domains', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDomains(data.domains || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    } finally {
      setIsLoadingDomains(false);
    }
  };

  const copyToClipboard = (text: string, key: string, type: 'key' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } else {
      setCopiedCode(key);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const regenerateKeys = async (keyType: 'live' | 'test' | 'both') => {
    if (!confirm(`Are you sure you want to regenerate your ${keyType === 'both' ? 'API keys' : `${keyType} key`}? This will invalidate your current ${keyType === 'both' ? 'keys' : 'key'}.`)) {
      return;
    }

    setIsRegeneratingKeys(true);
    try {
      const response = await fetch('/api/merchants/keys/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyType }),
        credentials: 'include'
      });

      if (response.ok) {
        await refreshApiKeys();
      }
    } catch (error) {
      console.error('Failed to regenerate keys:', error);
    } finally {
      setIsRegeneratingKeys(false);
    }
  };

  const addDomain = async () => {
    setDomainError('');

    if (!newDomain.trim()) {
      setDomainError('Domain is required');
      return;
    }

    try {
      const response = await fetch('/api/merchants/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain: newDomain.trim() }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDomains(data.domains);
        setNewDomain('');
      } else {
        setDomainError(data.error?.message || 'Failed to add domain');
      }
    } catch (error) {
      console.error('Failed to add domain:', error);
      setDomainError('Failed to add domain');
    }
  };

  const removeDomain = async (domain: string) => {
    if (!confirm(`Remove ${domain} from allowed domains?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/merchants/domains/${encodeURIComponent(domain)}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDomains(data.domains);
      }
    } catch (error) {
      console.error('Failed to remove domain:', error);
    }
  };

  // Code snippets
  const scriptSnippet = `<script src="https://fashionmirror.shop/widget/mirror.js"></script>`;

  const buttonSnippet = `<button
  class="mirror-me-button"
  data-merchant-key="${apiKeys?.liveKey || 'YOUR_API_KEY'}"
  data-product-image="YOUR_PRODUCT_IMAGE_URL"
  data-product-name="Product Name"
  data-product-id="product-123">
</button>`;

  const jsSnippet = `// Initialize the widget programmatically
const widget = MirrorMe.init({
  merchantKey: '${apiKeys?.liveKey || 'YOUR_API_KEY'}',
  theme: 'auto',
  onResult: (result) => {
    console.log('Try-on result:', result);
  },
  onError: (error) => {
    console.error('Try-on error:', error);
  }
});

// Open the widget
widget.open({
  product: {
    image: 'YOUR_PRODUCT_IMAGE_URL',
    name: 'Product Name',
    id: 'product-123'
  }
});`;

  return (
    <DashboardLayout title="Integration">
      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="api-keys" className="data-[state=active]:bg-indigo-600">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="code" className="data-[state=active]:bg-indigo-600">
            <Code className="h-4 w-4 mr-2" />
            Code Snippets
          </TabsTrigger>
          <TabsTrigger value="domains" className="data-[state=active]:bg-indigo-600">
            <Globe className="h-4 w-4 mr-2" />
            Domains
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <div className="grid gap-6">
            {/* Live Key */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Live API Key
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Use this key in production. All try-on sessions will be counted towards your quota.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-slate-900 rounded-lg border border-slate-700">
                    <code className="text-sm text-slate-300 font-mono">
                      {apiKeys?.liveKey || 'Loading...'}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => apiKeys?.liveKey && copyToClipboard(apiKeys.liveKey, 'live', 'key')}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    {copiedKey === 'live' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => regenerateKeys('live')}
                    disabled={isRegeneratingKeys}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    <RefreshCw className={`h-4 w-4 text-slate-400 ${isRegeneratingKeys ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Key */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  Test API Key
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Use this key for development. Sessions won't count towards your quota.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-slate-900 rounded-lg border border-slate-700">
                    <code className="text-sm text-slate-300 font-mono">
                      {apiKeys?.testKey || 'Loading...'}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => apiKeys?.testKey && copyToClipboard(apiKeys.testKey, 'test', 'key')}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    {copiedKey === 'test' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => regenerateKeys('test')}
                    disabled={isRegeneratingKeys}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    <RefreshCw className={`h-4 w-4 text-slate-400 ${isRegeneratingKeys ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Code Snippets Tab */}
        <TabsContent value="code">
          <div className="space-y-6">
            {/* Introduction */}
            <Alert className="bg-indigo-900/30 border-indigo-700 text-indigo-200">
              <Code className="h-4 w-4" />
              <AlertDescription>
                Follow these two simple steps to add the virtual try-on widget to your product pages.
                The integration takes less than 5 minutes and requires no backend changes.
              </AlertDescription>
            </Alert>

            {/* Step 1: Script Tag */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-sm font-bold">1</span>
                  Add the Script Tag
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Include this script in your HTML to load the Mirror.me widget library
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="p-4 bg-slate-900 rounded-lg border border-slate-700 overflow-x-auto">
                    <code className="text-sm text-green-400">{scriptSnippet}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(scriptSnippet, 'script', 'code')}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                  >
                    {copiedCode === 'script' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Explanation */}
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">What this does:</h4>
                  <ul className="text-sm text-slate-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span><strong className="text-slate-300">Loads the widget library</strong> — Downloads the lightweight Mirror.me script (~15KB gzipped) from our CDN</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span><strong className="text-slate-300">Auto-initializes buttons</strong> — Automatically finds and activates any <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">.mirror-me-button</code> elements on the page</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span><strong className="text-slate-300">Non-blocking</strong> — The script loads asynchronously and won't affect your page load performance</span>
                    </li>
                  </ul>
                  <p className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                    💡 <strong>Tip:</strong> Place this script just before the closing <code className="bg-slate-800 px-1 py-0.5 rounded">&lt;/body&gt;</code> tag for best performance, or in your site's global footer template.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Button Element */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-sm font-bold">2</span>
                  Add a Try-On Button
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Add this button element to your product pages where you want the try-on option to appear
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="p-4 bg-slate-900 rounded-lg border border-slate-700 overflow-x-auto">
                    <code className="text-sm text-green-400 whitespace-pre">{buttonSnippet}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(buttonSnippet, 'button', 'code')}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                  >
                    {copiedCode === 'button' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Attribute Explanation */}
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">Attribute Reference:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <code className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded whitespace-nowrap">class</code>
                      <div className="text-sm text-slate-400">
                        <strong className="text-slate-300">Required.</strong> Must include <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">mirror-me-button</code> for auto-initialization. Add your own classes for custom styling.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded whitespace-nowrap">data-merchant-key</code>
                      <div className="text-sm text-slate-400">
                        <strong className="text-slate-300">Required.</strong> Your API key for authentication. Use your test key during development.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded whitespace-nowrap">data-product-image</code>
                      <div className="text-sm text-slate-400">
                        <strong className="text-slate-300">Required.</strong> URL to the product image. Must be a high-quality image (min 512x512px recommended).
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded whitespace-nowrap">data-product-name</code>
                      <div className="text-sm text-slate-400">
                        <strong className="text-slate-300">Optional.</strong> Product name shown in the widget interface for context.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded whitespace-nowrap">data-product-id</code>
                      <div className="text-sm text-slate-400">
                        <strong className="text-slate-300">Optional.</strong> Your internal product ID for analytics and webhook tracking.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Button Preview */}
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">Button Preview:</h4>
                  <p className="text-sm text-slate-400">
                    After adding the code, your customers will see a styled button like this on your product pages:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-2">
                    {/* Primary Button Style */}
                    <div className="space-y-2">
                      <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 hover:scale-105">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Try It On
                      </button>
                      <p className="text-xs text-slate-500">Default style</p>
                    </div>

                    {/* Secondary Button Style */}
                    <div className="space-y-2">
                      <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Try It On
                      </button>
                      <p className="text-xs text-slate-500">Outline style</p>
                    </div>

                    {/* Compact Button Style */}
                    <div className="space-y-2">
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition-all duration-200">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Try On
                      </button>
                      <p className="text-xs text-slate-500">Compact style</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                    💡 <strong>Tip:</strong> The button automatically inherits the default styling, but you can customize it with your own CSS classes to match your brand.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Advanced: JavaScript API */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="text-slate-400 text-sm font-normal mr-1">Advanced</span>
                  JavaScript API
                </CardTitle>
                <CardDescription className="text-slate-400">
                  For dynamic applications or when you need programmatic control over the widget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="p-4 bg-slate-900 rounded-lg border border-slate-700 overflow-x-auto">
                    <code className="text-sm text-green-400 whitespace-pre">{jsSnippet}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(jsSnippet, 'js', 'code')}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                  >
                    {copiedCode === 'js' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* JS API Explanation */}
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">When to use the JavaScript API:</h4>
                  <ul className="text-sm text-slate-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span><strong className="text-slate-300">Single-page applications</strong> — React, Vue, Angular apps where products load dynamically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span><strong className="text-slate-300">Custom triggers</strong> — Open the widget from image clicks, quick-view modals, or custom buttons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span><strong className="text-slate-300">Event handling</strong> — Track conversions, display results in your own UI, or chain with other actions</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Allowed Domains</CardTitle>
              <CardDescription className="text-slate-400">
                The widget will only work on these domains. Use *.example.com for wildcard subdomains.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Domain Form */}
              <div className="flex gap-2 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="example.com or *.example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <Button onClick={addDomain} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {domainError && (
                <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-800 text-red-200">
                  <AlertDescription>{domainError}</AlertDescription>
                </Alert>
              )}

              {/* Domain List */}
              {isLoadingDomains ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : domains.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No domains configured yet</p>
                  <p className="text-sm mt-1">Add a domain to start using the widget</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {domains.map((domain) => (
                    <div
                      key={domain}
                      className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-300 font-mono text-sm">{domain}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDomain(domain)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-500 mt-4">
                Note: localhost is always allowed for development purposes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
