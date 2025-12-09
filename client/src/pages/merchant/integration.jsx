import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/merchant/DashboardLayout';
import { useMerchantAuth } from '@/contexts/MerchantAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, RefreshCw, Trash2, Plus, Key, Globe, Code, Loader2 } from 'lucide-react';
export default function MerchantIntegration() {
    const { apiKeys, refreshApiKeys } = useMerchantAuth();
    const [copiedKey, setCopiedKey] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);
    const [domains, setDomains] = useState([]);
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
        }
        catch (error) {
            console.error('Failed to fetch domains:', error);
        }
        finally {
            setIsLoadingDomains(false);
        }
    };
    const copyToClipboard = (text, key, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'key') {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        }
        else {
            setCopiedCode(key);
            setTimeout(() => setCopiedCode(null), 2000);
        }
    };
    const regenerateKeys = async (keyType) => {
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
        }
        catch (error) {
            console.error('Failed to regenerate keys:', error);
        }
        finally {
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
            }
            else {
                setDomainError(data.error?.message || 'Failed to add domain');
            }
        }
        catch (error) {
            console.error('Failed to add domain:', error);
            setDomainError('Failed to add domain');
        }
    };
    const removeDomain = async (domain) => {
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
        }
        catch (error) {
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
    return (<DashboardLayout title="Integration">
      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="api-keys" className="data-[state=active]:bg-indigo-600">
            <Key className="h-4 w-4 mr-2"/>
            API Keys
          </TabsTrigger>
          <TabsTrigger value="code" className="data-[state=active]:bg-indigo-600">
            <Code className="h-4 w-4 mr-2"/>
            Code Snippets
          </TabsTrigger>
          <TabsTrigger value="domains" className="data-[state=active]:bg-indigo-600">
            <Globe className="h-4 w-4 mr-2"/>
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
                  <Button variant="outline" size="icon" onClick={() => apiKeys?.liveKey && copyToClipboard(apiKeys.liveKey, 'live', 'key')} className="border-slate-600 hover:bg-slate-700">
                    {copiedKey === 'live' ? (<Check className="h-4 w-4 text-green-400"/>) : (<Copy className="h-4 w-4 text-slate-400"/>)}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => regenerateKeys('live')} disabled={isRegeneratingKeys} className="border-slate-600 hover:bg-slate-700">
                    <RefreshCw className={`h-4 w-4 text-slate-400 ${isRegeneratingKeys ? 'animate-spin' : ''}`}/>
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
                  <Button variant="outline" size="icon" onClick={() => apiKeys?.testKey && copyToClipboard(apiKeys.testKey, 'test', 'key')} className="border-slate-600 hover:bg-slate-700">
                    {copiedKey === 'test' ? (<Check className="h-4 w-4 text-green-400"/>) : (<Copy className="h-4 w-4 text-slate-400"/>)}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => regenerateKeys('test')} disabled={isRegeneratingKeys} className="border-slate-600 hover:bg-slate-700">
                    <RefreshCw className={`h-4 w-4 text-slate-400 ${isRegeneratingKeys ? 'animate-spin' : ''}`}/>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Code Snippets Tab */}
        <TabsContent value="code">
          <div className="space-y-6">
            {/* Step 1: Script Tag */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-sm">1</span>
                  Add the Script Tag
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Include this script in your HTML, preferably before the closing &lt;/body&gt; tag
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="p-4 bg-slate-900 rounded-lg border border-slate-700 overflow-x-auto">
                    <code className="text-sm text-green-400">{scriptSnippet}</code>
                  </pre>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(scriptSnippet, 'script', 'code')} className="absolute top-2 right-2 text-slate-400 hover:text-white">
                    {copiedCode === 'script' ? (<Check className="h-4 w-4 text-green-400"/>) : (<Copy className="h-4 w-4"/>)}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Button Element */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-sm">2</span>
                  Add a Try-On Button
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Add this button to your product pages. The widget will automatically initialize.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="p-4 bg-slate-900 rounded-lg border border-slate-700 overflow-x-auto">
                    <code className="text-sm text-green-400 whitespace-pre">{buttonSnippet}</code>
                  </pre>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(buttonSnippet, 'button', 'code')} className="absolute top-2 right-2 text-slate-400 hover:text-white">
                    {copiedCode === 'button' ? (<Check className="h-4 w-4 text-green-400"/>) : (<Copy className="h-4 w-4"/>)}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Advanced: JavaScript API */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Advanced: JavaScript API</CardTitle>
                <CardDescription className="text-slate-400">
                  For more control, you can initialize the widget programmatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="p-4 bg-slate-900 rounded-lg border border-slate-700 overflow-x-auto">
                    <code className="text-sm text-green-400 whitespace-pre">{jsSnippet}</code>
                  </pre>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(jsSnippet, 'js', 'code')} className="absolute top-2 right-2 text-slate-400 hover:text-white">
                    {copiedCode === 'js' ? (<Check className="h-4 w-4 text-green-400"/>) : (<Copy className="h-4 w-4"/>)}
                  </Button>
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
                  <Input placeholder="example.com or *.example.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDomain()} className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"/>
                </div>
                <Button onClick={addDomain} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2"/>
                  Add
                </Button>
              </div>

              {domainError && (<Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-800 text-red-200">
                  <AlertDescription>{domainError}</AlertDescription>
                </Alert>)}

              {/* Domain List */}
              {isLoadingDomains ? (<div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500"/>
                </div>) : domains.length === 0 ? (<div className="text-center py-8 text-slate-400">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-50"/>
                  <p>No domains configured yet</p>
                  <p className="text-sm mt-1">Add a domain to start using the widget</p>
                </div>) : (<div className="space-y-2">
                  {domains.map((domain) => (<div key={domain} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-slate-500"/>
                        <span className="text-slate-300 font-mono text-sm">{domain}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeDomain(domain)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                        <Trash2 className="h-4 w-4"/>
                      </Button>
                    </div>))}
                </div>)}

              <p className="text-xs text-slate-500 mt-4">
                Note: localhost is always allowed for development purposes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>);
}
