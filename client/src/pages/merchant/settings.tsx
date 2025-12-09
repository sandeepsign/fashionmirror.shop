import { useState } from 'react';
import DashboardLayout from '@/components/merchant/DashboardLayout';
import { useMerchantAuth } from '@/contexts/MerchantAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, RefreshCw, Copy, Check, Bell, User, CreditCard, Shield } from 'lucide-react';

export default function MerchantSettings() {
  const { merchant, refreshMerchant } = useMerchantAuth();

  const [name, setName] = useState(merchant?.name || '');
  const [webhookUrl, setWebhookUrl] = useState(merchant?.webhookUrl || '');
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegeneratingSecret, setIsRegeneratingSecret] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/merchants/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim() || undefined,
          webhookUrl: webhookUrl.trim() || null
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Settings saved successfully');
        await refreshMerchant();
      } else {
        setErrorMessage(data.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrorMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateWebhookSecret = async () => {
    if (!confirm('Are you sure you want to regenerate your webhook secret? This will invalidate the current secret.')) {
      return;
    }

    setIsRegeneratingSecret(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/merchants/webhook/regenerate-secret', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setWebhookSecret(data.webhookSecret);
        setSuccessMessage('Webhook secret regenerated successfully');
      } else {
        setErrorMessage(data.error?.message || 'Failed to regenerate webhook secret');
      }
    } catch (error) {
      console.error('Failed to regenerate webhook secret:', error);
      setErrorMessage('Failed to regenerate webhook secret');
    } finally {
      setIsRegeneratingSecret(false);
    }
  };

  const copyWebhookSecret = () => {
    if (webhookSecret) {
      navigator.clipboard.writeText(webhookSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout title="Settings">
      {/* Notifications */}
      {successMessage && (
        <Alert className="mb-6 bg-green-900/50 border-green-800 text-green-200">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-red-200">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your business information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">Business Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your business name"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input
                id="email"
                value={merchant?.email || ''}
                disabled
                className="bg-slate-900/50 border-slate-700 text-slate-400"
              />
              <p className="text-xs text-slate-500">Contact support to change your email</p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-sm text-slate-400">
                Member since {formatDate(merchant?.createdAt)}
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Settings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription className="text-slate-400">
              Receive real-time notifications when try-on sessions are completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl" className="text-slate-200">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-domain.com/webhook"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">
                We'll send POST requests with session data to this URL
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Webhook Secret</Label>
              {webhookSecret ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-slate-900 rounded-lg border border-slate-700">
                    <code className="text-sm text-green-400 font-mono">{webhookSecret}</code>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyWebhookSecret}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    {copiedSecret ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Click regenerate to generate a new webhook secret
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Use this secret to verify webhook signatures
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateWebhookSecret}
                  disabled={isRegeneratingSecret}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {isRegeneratingSecret ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate Secret
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Info */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plan & Billing
            </CardTitle>
            <CardDescription className="text-slate-400">
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-lg border border-indigo-800/50">
              <div>
                <p className="text-white font-medium capitalize">{merchant?.plan || 'Free'} Plan</p>
                <p className="text-sm text-slate-400">
                  {merchant?.monthlyQuota || 100} try-ons per month
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Used: {merchant?.quotaUsed || 0} / {merchant?.monthlyQuota || 100}
                </p>
              </div>
              <Button className="bg-white text-slate-900 hover:bg-slate-100">
                Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription className="text-slate-400">
              Account security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div>
                  <p className="text-white font-medium">Password</p>
                  <p className="text-sm text-slate-400">Change your account password</p>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-400">Add an extra layer of security</p>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Coming Soon
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-slate-800/50 border-red-900/50">
          <CardHeader>
            <CardTitle className="text-red-400">Danger Zone</CardTitle>
            <CardDescription className="text-slate-400">
              Irreversible actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-red-950/20 rounded-lg border border-red-900/30">
              <div>
                <p className="text-white font-medium">Delete Account</p>
                <p className="text-sm text-slate-400">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
