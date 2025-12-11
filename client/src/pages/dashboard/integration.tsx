import { useState, useEffect } from 'react';
import UnifiedDashboardLayout from '@/components/UnifiedDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, RefreshCw, Trash2, Plus, Key, Globe, Code, Loader2, Store, Sparkles, ShoppingBag, Heart, Star, ExternalLink } from 'lucide-react';

interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

export default function IntegrationPage() {
  const { apiKeys, refreshApiKeys } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);
  const [isRegeneratingKeys, setIsRegeneratingKeys] = useState(false);

  // Multiple API keys management
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [keyError, setKeyError] = useState('');

  useEffect(() => {
    fetchDomains();
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/account/keys', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setKeys(data.keys || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const createApiKey = async () => {
    setKeyError('');

    if (!newKeyName.trim()) {
      setKeyError('Key name is required');
      return;
    }

    setIsCreatingKey(true);
    try {
      const response = await fetch('/api/account/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setKeys(data.keys || []);
        setNewKeyName('');
        await refreshApiKeys();
      } else {
        setKeyError(data.error?.message || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      setKeyError('Failed to create API key');
    } finally {
      setIsCreatingKey(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone and any integrations using this key will stop working.')) {
      return;
    }

    try {
      const response = await fetch(`/api/account/keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setKeys(data.keys || []);
        await refreshApiKeys();
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/account/domains', {
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
      const response = await fetch('/api/account/keys/regenerate', {
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
      const response = await fetch('/api/account/domains', {
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
      const response = await fetch(`/api/account/domains/${encodeURIComponent(domain)}`, {
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

  // Get the first available API key for code snippets
  const displayKey = keys.length > 0 ? keys[0].key : 'YOUR_API_KEY';

  // Code snippets
  const scriptSnippet = `<script src="https://fashionmirror.shop/widget/mirror.js"></script>`;

  const buttonSnippet = `<button
  class="mirror-me-button"
  data-merchant-key="${displayKey}"
  data-product-image="YOUR_PRODUCT_IMAGE_URL"
  data-product-name="Product Name"
  data-product-id="product-123"
  data-product-specification="100% Cotton, Machine Washable"
  data-product-description="A comfortable everyday tee...">
</button>`;

  const jsSnippet = `// Initialize the widget programmatically
const widget = MirrorMe.init({
  merchantKey: '${displayKey}',
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
    id: 'product-123',
    specification: '100% Cotton, Machine Washable',
    description: 'A comfortable everyday tee perfect for any occasion.'
  }
});`;

  return (
    <UnifiedDashboardLayout title="Integration" activeTab="integration">
      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-gray-100 [.dashboard-light_&]:border-gray-200 border">
          <TabsTrigger value="api-keys" className="data-[state=active]:bg-primary data-[state=active]:text-black">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="code" className="data-[state=active]:bg-primary data-[state=active]:text-black">
            <Code className="h-4 w-4 mr-2" />
            Code Snippets
          </TabsTrigger>
          <TabsTrigger value="domains" className="data-[state=active]:bg-primary data-[state=active]:text-black">
            <Globe className="h-4 w-4 mr-2" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="demo" className="data-[state=active]:bg-primary data-[state=active]:text-black">
            <Store className="h-4 w-4 mr-2" />
            E-Commerce Store Demo
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 rounded-lg border [.dashboard-dark_&]:bg-blue-500/10 [.dashboard-dark_&]:border-blue-500/30 [.dashboard-light_&]:bg-blue-50 [.dashboard-light_&]:border-blue-200">
              <Key className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm [.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">
                  Create multiple API keys for different integrations or environments. Your usage quota applies to all keys combined.
                </p>
                <p className="text-xs [.dashboard-dark_&]:text-white/50 [.dashboard-light_&]:text-gray-500">
                  We recommend using separate keys for each website or application for better tracking and security.
                </p>
              </div>
            </div>

            {/* Create New Key */}
            <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
              <CardHeader>
                <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">Create New API Key</CardTitle>
                <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                  Give your key a descriptive name to help identify where it's used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="e.g., Production Website, Staging, Mobile App"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && createApiKey()}
                      className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/20 [.dashboard-dark_&]:text-white [.dashboard-dark_&]:placeholder:text-white/40 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-300 [.dashboard-light_&]:text-gray-900 [.dashboard-light_&]:placeholder:text-gray-400"
                    />
                  </div>
                  <Button
                    onClick={createApiKey}
                    disabled={isCreatingKey}
                    className="bg-primary text-black hover:bg-primary/90"
                  >
                    {isCreatingKey ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Key
                  </Button>
                </div>

                {keyError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{keyError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* API Keys List */}
            <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
              <CardHeader>
                <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">Your API Keys</CardTitle>
                <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                  Manage your API keys. Keep your keys secure and never share them publicly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingKeys ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : keys.length === 0 ? (
                  <div className="text-center py-8 [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                    <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No API keys created yet</p>
                    <p className="text-sm mt-1">Create your first API key to start integrating</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {keys.map((key) => (
                      <div
                        key={key.id}
                        className="p-4 [.dashboard-dark_&]:bg-black/50 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-gray-50 [.dashboard-light_&]:border-gray-200 rounded-lg border"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="font-medium [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">{key.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-sm [.dashboard-dark_&]:text-white/70 [.dashboard-light_&]:text-gray-600 font-mono truncate">
                                {key.key}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(key.key, key.id, 'key')}
                                className="h-7 px-2 [.dashboard-dark_&]:text-white/60 [.dashboard-dark_&]:hover:text-white [.dashboard-light_&]:text-gray-500 [.dashboard-light_&]:hover:text-gray-700"
                              >
                                {copiedKey === key.id ? (
                                  <Check className="h-3.5 w-3.5 text-green-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">
                              <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                              {key.lastUsedAt && (
                                <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteApiKey(key.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Code Snippets Tab */}
        <TabsContent value="code">
          <div className="space-y-6">
            {/* Introduction */}
            <div className="flex items-start gap-3 p-4 rounded-lg border [.dashboard-dark_&]:bg-primary/10 [.dashboard-dark_&]:border-primary/30 [.dashboard-light_&]:bg-primary/5 [.dashboard-light_&]:border-primary/20">
              <Code className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm [.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">
                Follow these two simple steps to add the virtual try-on widget to your product pages.
                The integration takes less than 5 minutes and requires no backend changes.
              </p>
            </div>

            {/* Step 1: Script Tag */}
            <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
              <CardHeader>
                <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-black text-sm font-bold">1</span>
                  Add the Script Tag
                </CardTitle>
                <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                  Include this script in your HTML to load the Mirror.me widget library
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="p-4 [.dashboard-dark_&]:bg-black/50 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-gray-900 [.dashboard-light_&]:border-gray-300 rounded-lg border overflow-x-auto">
                    <code className="text-sm text-green-400">{scriptSnippet}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(scriptSnippet, 'script', 'code')}
                    className="absolute top-2 right-2 [.dashboard-dark_&]:text-white/60 [.dashboard-dark_&]:hover:text-white [.dashboard-light_&]:text-gray-400 [.dashboard-light_&]:hover:text-white"
                  >
                    {copiedCode === 'script' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Explanation */}
                <div className="p-4 [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-gray-50 rounded-lg border [.dashboard-dark_&]:border-white/5 [.dashboard-light_&]:border-gray-200 space-y-3">
                  <h4 className="text-sm font-medium [.dashboard-dark_&]:text-white/90 [.dashboard-light_&]:text-gray-700">What this does:</h4>
                  <ul className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Loads the widget library</strong> — Downloads the lightweight Mirror.me script (~15KB gzipped) from our CDN</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Auto-initializes buttons</strong> — Automatically finds and activates any <code className="text-xs [.dashboard-dark_&]:bg-black/50 [.dashboard-light_&]:bg-gray-200 px-1 py-0.5 rounded">.mirror-me-button</code> elements on the page</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Non-blocking</strong> — The script loads asynchronously and won't affect your page load performance</span>
                    </li>
                  </ul>
                  <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-500 pt-2 border-t [.dashboard-dark_&]:border-white/5 [.dashboard-light_&]:border-gray-200">
                    <strong>Tip:</strong> Place this script just before the closing <code className="[.dashboard-dark_&]:bg-black/50 [.dashboard-light_&]:bg-gray-200 px-1 py-0.5 rounded">&lt;/body&gt;</code> tag for best performance, or in your site's global footer template.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Button Element */}
            <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
              <CardHeader>
                <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-black text-sm font-bold">2</span>
                  Add a Try-On Button
                </CardTitle>
                <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                  Add this button element to your product pages where you want the try-on option to appear
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="p-4 [.dashboard-dark_&]:bg-black/50 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-gray-900 [.dashboard-light_&]:border-gray-300 rounded-lg border overflow-x-auto">
                    <code className="text-sm text-green-400 whitespace-pre">{buttonSnippet}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(buttonSnippet, 'button', 'code')}
                    className="absolute top-2 right-2 [.dashboard-dark_&]:text-white/60 [.dashboard-dark_&]:hover:text-white [.dashboard-light_&]:text-gray-400 [.dashboard-light_&]:hover:text-white"
                  >
                    {copiedCode === 'button' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Attribute Explanation */}
                <div className="p-4 [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-gray-50 rounded-lg border [.dashboard-dark_&]:border-white/5 [.dashboard-light_&]:border-gray-200 space-y-3">
                  <h4 className="text-sm font-medium [.dashboard-dark_&]:text-white/90 [.dashboard-light_&]:text-gray-700">Attribute Reference:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <code className="text-xs [.dashboard-dark_&]:bg-primary/20 [.dashboard-dark_&]:text-primary [.dashboard-light_&]:bg-emerald-100 [.dashboard-light_&]:text-emerald-700 px-2 py-1 rounded whitespace-nowrap font-semibold">class</code>
                      <div className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-600">
                        <strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Required.</strong> Must include <code className="text-xs [.dashboard-dark_&]:bg-black/50 [.dashboard-light_&]:bg-gray-200 [.dashboard-light_&]:text-gray-700 px-1 py-0.5 rounded">mirror-me-button</code> for auto-initialization. Add your own classes for custom styling.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs [.dashboard-dark_&]:bg-primary/20 [.dashboard-dark_&]:text-primary [.dashboard-light_&]:bg-emerald-100 [.dashboard-light_&]:text-emerald-700 px-2 py-1 rounded whitespace-nowrap font-semibold">data-merchant-key</code>
                      <div className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-600">
                        <strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Required.</strong> Your API key for authentication. Use your test key during development.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs [.dashboard-dark_&]:bg-primary/20 [.dashboard-dark_&]:text-primary [.dashboard-light_&]:bg-emerald-100 [.dashboard-light_&]:text-emerald-700 px-2 py-1 rounded whitespace-nowrap font-semibold">data-product-image</code>
                      <div className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-600">
                        <strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Required.</strong> URL to the product image. Must be a high-quality image (min 512x512px recommended).
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs [.dashboard-dark_&]:bg-primary/20 [.dashboard-dark_&]:text-primary [.dashboard-light_&]:bg-emerald-100 [.dashboard-light_&]:text-emerald-700 px-2 py-1 rounded whitespace-nowrap font-semibold">data-product-name</code>
                      <div className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-600">
                        <strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Optional.</strong> Product name shown in the widget interface for context.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs [.dashboard-dark_&]:bg-primary/20 [.dashboard-dark_&]:text-primary [.dashboard-light_&]:bg-emerald-100 [.dashboard-light_&]:text-emerald-700 px-2 py-1 rounded whitespace-nowrap font-semibold">data-product-id</code>
                      <div className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-600">
                        <strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Optional.</strong> Your internal product ID for analytics and webhook tracking.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs [.dashboard-dark_&]:bg-primary/20 [.dashboard-dark_&]:text-primary [.dashboard-light_&]:bg-emerald-100 [.dashboard-light_&]:text-emerald-700 px-2 py-1 rounded whitespace-nowrap font-semibold">data-product-specification</code>
                      <div className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-600">
                        <strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Optional.</strong> Product specifications (e.g., "100% Cotton, Machine Washable"). Shown on result screen.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs [.dashboard-dark_&]:bg-primary/20 [.dashboard-dark_&]:text-primary [.dashboard-light_&]:bg-emerald-100 [.dashboard-light_&]:text-emerald-700 px-2 py-1 rounded whitespace-nowrap font-semibold">data-product-description</code>
                      <div className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-600">
                        <strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Optional.</strong> Long-form product description. Displayed on the result screen below the product info.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Button Preview */}
                <div className="p-4 [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-gray-50 rounded-lg border [.dashboard-dark_&]:border-white/5 [.dashboard-light_&]:border-gray-200 space-y-3">
                  <h4 className="text-sm font-medium [.dashboard-dark_&]:text-white/90 [.dashboard-light_&]:text-gray-700">Button Preview:</h4>
                  <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-600">
                    After adding the code, your customers will see a styled button like this on your product pages:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-3">
                    {/* Primary Button Style */}
                    <div className="space-y-2">
                      <button
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-md"
                        style={{
                          background: 'linear-gradient(to bottom, #151515 0%, #040404 50%, #000000 100%)',
                        }}
                      >
                        <svg className="h-4 w-auto" viewBox="0 0 800 210" xmlns="http://www.w3.org/2000/svg">
                          <text x="40" y="145"
                                fill="currentColor"
                                fontFamily="Comic Sans MS, Comic Sans, cursive"
                                fontStyle="italic"
                                fontWeight="700"
                                fontSize="130"
                                letterSpacing="-3">
                            Mirror
                          </text>
                          <rect x="455" y="128" width="14" height="14"
                                fill="currentColor"
                                transform="rotate(45 462 135)" />
                          <text x="482" y="145"
                                fill="currentColor"
                                fontFamily="Inter, Arial, sans-serif"
                                fontWeight="600"
                                fontSize="90">
                            me
                          </text>
                        </svg>
                      </button>
                      <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-500">Default style</p>
                    </div>

                    {/* Light Button Style */}
                    <div className="space-y-2">
                      <button
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-black transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-md border border-gray-200"
                        style={{
                          background: 'linear-gradient(to bottom, #ffffff 0%, #f5f5f5 50%, #eeeeee 100%)',
                        }}
                      >
                        <svg className="h-4 w-auto" viewBox="0 0 800 210" xmlns="http://www.w3.org/2000/svg">
                          <text x="40" y="145"
                                fill="currentColor"
                                fontFamily="Comic Sans MS, Comic Sans, cursive"
                                fontStyle="italic"
                                fontWeight="700"
                                fontSize="130"
                                letterSpacing="-3">
                            Mirror
                          </text>
                          <rect x="455" y="128" width="14" height="14"
                                fill="currentColor"
                                transform="rotate(45 462 135)" />
                          <text x="482" y="145"
                                fill="currentColor"
                                fontFamily="Inter, Arial, sans-serif"
                                fontWeight="600"
                                fontSize="90">
                            me
                          </text>
                        </svg>
                      </button>
                      <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-500">Light style</p>
                    </div>

                    {/* Compact Button Style */}
                    <div className="space-y-2">
                      <button
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-white text-sm transition-all duration-200 hover:scale-105"
                        style={{
                          background: 'linear-gradient(to bottom, #151515 0%, #040404 50%, #000000 100%)',
                        }}
                      >
                        <svg className="h-3 w-auto" viewBox="0 0 800 210" xmlns="http://www.w3.org/2000/svg">
                          <text x="40" y="145"
                                fill="currentColor"
                                fontFamily="Comic Sans MS, Comic Sans, cursive"
                                fontStyle="italic"
                                fontWeight="700"
                                fontSize="130"
                                letterSpacing="-3">
                            Mirror
                          </text>
                          <rect x="455" y="128" width="14" height="14"
                                fill="currentColor"
                                transform="rotate(45 462 135)" />
                          <text x="482" y="145"
                                fill="currentColor"
                                fontFamily="Inter, Arial, sans-serif"
                                fontWeight="600"
                                fontSize="90">
                            me
                          </text>
                        </svg>
                      </button>
                      <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-500">Compact style</p>
                    </div>
                  </div>
                  <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-500 pt-2 border-t [.dashboard-dark_&]:border-white/5 [.dashboard-light_&]:border-gray-200">
                    <strong>Tip:</strong> The button automatically inherits the default styling, but you can customize it with your own CSS classes to match your brand.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Advanced: JavaScript API */}
            <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
              <CardHeader>
                <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 flex items-center gap-2">
                  <span className="[.dashboard-dark_&]:text-white/50 [.dashboard-light_&]:text-gray-400 text-sm font-normal mr-1">Advanced</span>
                  JavaScript API
                </CardTitle>
                <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                  For dynamic applications or when you need programmatic control over the widget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="p-4 [.dashboard-dark_&]:bg-black/50 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-gray-900 [.dashboard-light_&]:border-gray-300 rounded-lg border overflow-x-auto">
                    <code className="text-sm text-green-400 whitespace-pre">{jsSnippet}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(jsSnippet, 'js', 'code')}
                    className="absolute top-2 right-2 [.dashboard-dark_&]:text-white/60 [.dashboard-dark_&]:hover:text-white [.dashboard-light_&]:text-gray-400 [.dashboard-light_&]:hover:text-white"
                  >
                    {copiedCode === 'js' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* JS API Explanation */}
                <div className="p-4 [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-gray-50 rounded-lg border [.dashboard-dark_&]:border-white/5 [.dashboard-light_&]:border-gray-200 space-y-3">
                  <h4 className="text-sm font-medium [.dashboard-dark_&]:text-white/90 [.dashboard-light_&]:text-gray-700">When to use the JavaScript API:</h4>
                  <ul className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Single-page applications</strong> — React, Vue, Angular apps where products load dynamically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Custom triggers</strong> — Open the widget from image clicks, quick-view modals, or custom buttons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Event handling</strong> — Track conversions, display results in your own UI, or chain with other actions</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains">
          <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
            <CardHeader>
              <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">Allowed Domains</CardTitle>
              <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
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
                    className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/20 [.dashboard-dark_&]:text-white [.dashboard-dark_&]:placeholder:text-white/40 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-300 [.dashboard-light_&]:text-gray-900 [.dashboard-light_&]:placeholder:text-gray-400"
                  />
                </div>
                <Button onClick={addDomain} className="bg-primary text-black hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {domainError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{domainError}</AlertDescription>
                </Alert>
              )}

              {/* Domain List */}
              {isLoadingDomains ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : domains.length === 0 ? (
                <div className="text-center py-8 [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No domains configured yet</p>
                  <p className="text-sm mt-1">Add a domain to start using the widget</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {domains.map((domain) => (
                    <div
                      key={domain}
                      className="flex items-center justify-between p-3 [.dashboard-dark_&]:bg-black/50 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-gray-50 [.dashboard-light_&]:border-gray-200 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 [.dashboard-dark_&]:text-white/50 [.dashboard-light_&]:text-gray-400" />
                        <span className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700 font-mono text-sm">{domain}</span>
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

              <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400 mt-4">
                Note: localhost is always allowed for development purposes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* E-Commerce Store Demo Tab */}
        <TabsContent value="demo">
          <div className="space-y-6">
            {/* Demo Header */}
            <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
              <CardHeader>
                <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  See Mirror.me in Action
                </CardTitle>
                <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                  This demo shows how the Mirror.me widget integrates into an e-commerce store. Click "Try On" on any product to see the virtual try-on experience.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Mock E-commerce Store */}
            <div className="[.dashboard-dark_&]:bg-black/20 [.dashboard-light_&]:bg-gray-50 rounded-xl border [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:border-gray-200 overflow-hidden">
              {/* Store Header */}
              <div className="p-4 border-b [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:border-gray-200 [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                    <span className="font-semibold text-lg [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">StyleVault</span>
                    <span className="text-xs px-2 py-0.5 rounded-full [.dashboard-dark_&]:bg-white/10 [.dashboard-light_&]:bg-gray-100 [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Demo Store</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Women</span>
                    <span className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Men</span>
                    <span className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">New Arrivals</span>
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              <div className="p-6">
                <h3 className="text-sm font-medium [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500 mb-4 uppercase tracking-wider">New Collection</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Product 1 */}
                  <DemoProductCard
                    image="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop"
                    name="Oversized Wool Blazer"
                    price="$189.00"
                    apiKey={displayKey}
                    originalPrice="$249.00"
                    rating={4.8}
                    reviews={124}
                    isNew
                  />

                  {/* Product 2 */}
                  <DemoProductCard
                    image="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop"
                    name="Classic Leather Jacket"
                    price="$325.00"
                    apiKey={displayKey}
                    rating={4.9}
                    reviews={89}
                  />

                  {/* Product 3 */}
                  <DemoProductCard
                    image="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop"
                    name="Classic Bomber Jacket"
                    price="$145.00"
                    rating={4.7}
                    reviews={256}
                    isBestseller
                    apiKey={displayKey}
                  />

                  {/* Product 4 */}
                  <DemoProductCard
                    image="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop"
                    name="Premium Hoodie"
                    price="$89.00"
                    rating={4.6}
                    reviews={312}
                    apiKey={displayKey}
                  />

                  {/* Product 5 */}
                  <DemoProductCard
                    image="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&h=500&fit=crop"
                    name="Cotton Oxford Shirt"
                    price="$75.00"
                    originalPrice="$95.00"
                    rating={4.5}
                    reviews={178}
                    apiKey={displayKey}
                  />

                  {/* Product 6 */}
                  <DemoProductCard
                    image="https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&h=500&fit=crop"
                    name="Cashmere Sweater"
                    price="$275.00"
                    rating={4.9}
                    reviews={67}
                    isNew
                    apiKey={displayKey}
                  />

                  {/* Product 7 */}
                  <DemoProductCard
                    image="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=500&fit=crop"
                    name="Vintage Band Tee"
                    price="$45.00"
                    rating={4.4}
                    reviews={423}
                    isBestseller
                    apiKey={displayKey}
                  />

                </div>
              </div>

              {/* Store Footer */}
              <div className="p-4 border-t [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:border-gray-200 [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-white">
                <p className="text-xs text-center [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">
                  This is a demo store showcasing Mirror.me widget integration. Click "Try On" to launch the virtual try-on experience.
                </p>
              </div>
            </div>

            {/* Integration Benefits */}
            <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
              <CardHeader>
                <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 text-base">Why Add Mirror.me to Your Store?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-gray-50">
                    <div className="text-2xl font-bold text-primary mb-1">+32%</div>
                    <div className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Conversion Rate</div>
                  </div>
                  <div className="p-4 rounded-lg [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-gray-50">
                    <div className="text-2xl font-bold text-primary mb-1">-28%</div>
                    <div className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Return Rate</div>
                  </div>
                  <div className="p-4 rounded-lg [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-gray-50">
                    <div className="text-2xl font-bold text-primary mb-1">3.2x</div>
                    <div className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Time on Site</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </UnifiedDashboardLayout>
  );
}

// Demo Product Card Component
interface DemoProductCardProps {
  image: string;
  name: string;
  price: string;
  originalPrice?: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isBestseller?: boolean;
  apiKey?: string;
}

function DemoProductCard({ image, name, price, originalPrice, rating, reviews, isNew, isBestseller, apiKey }: DemoProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleTryOn = () => {
    // Build the widget URL with parameters
    const params = new URLSearchParams({
      merchantKey: apiKey || 'demo-key',
      productImage: image,
      productName: name,
      productId: name.toLowerCase().replace(/\s+/g, '-'),
      productPrice: price.replace('$', ''),
      productCurrency: 'USD',
      theme: 'auto',
    });

    // Open widget in a modal or new window for demo purposes
    const widgetUrl = `/widget/embed?${params.toString()}`;
    window.open(widgetUrl, 'mirror-me-widget', 'width=450,height=700,resizable=yes');
  };

  return (
    <div
      className="group relative rounded-lg overflow-hidden [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-white border [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:border-gray-200 transition-all duration-200 hover:shadow-lg [.dashboard-light_&]:hover:shadow-gray-200/50"
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {isNew && (
          <span className="px-2 py-0.5 text-xs font-medium bg-primary text-black rounded">NEW</span>
        )}
        {isBestseller && (
          <span className="px-2 py-0.5 text-xs font-medium [.dashboard-dark_&]:bg-white/20 [.dashboard-light_&]:bg-gray-900 text-white rounded">BESTSELLER</span>
        )}
      </div>

      {/* Favorite Button */}
      <button
        onClick={() => setIsFavorite(!isFavorite)}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full [.dashboard-dark_&]:bg-black/50 [.dashboard-light_&]:bg-white/80 backdrop-blur-sm transition-colors"
      >
        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : '[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-400'}`} />
      </button>

      {/* Product Image */}
      <div className="aspect-[4/5] overflow-hidden relative">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Mirror.me Button - Always visible at bottom right */}
        <button
          onClick={handleTryOn}
          className="absolute bottom-3 right-3 z-10 inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-md"
          style={{
            background: 'linear-gradient(to bottom, #151515 0%, #040404 50%, #000000 100%)',
          }}
        >
          <svg className="h-4 w-auto" viewBox="0 0 800 210" xmlns="http://www.w3.org/2000/svg">
            <text x="40" y="145"
                  fill="currentColor"
                  fontFamily="Comic Sans MS, Comic Sans, cursive"
                  fontStyle="italic"
                  fontWeight="700"
                  fontSize="130"
                  letterSpacing="-3">
              Mirror
            </text>
            <rect x="455" y="128" width="14" height="14"
                  fill="currentColor"
                  transform="rotate(45 462 135)" />
            <text x="482" y="145"
                  fill="currentColor"
                  fontFamily="Inter, Arial, sans-serif"
                  fontWeight="600"
                  fontSize="90">
              me
            </text>
          </svg>
        </button>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h4 className="font-medium text-sm [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 mb-1 line-clamp-1">{name}</h4>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium [.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">{rating}</span>
          <span className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">({reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-semibold [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">{price}</span>
          {originalPrice && (
            <span className="text-sm line-through [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">{originalPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
}
