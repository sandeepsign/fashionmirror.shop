import { useState } from 'react';
import UnifiedDashboardLayout from '@/components/UnifiedDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, RefreshCw, Copy, Check, Bell, User, CreditCard, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user, quota, refreshUser, refreshProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [webhookUrl, setWebhookUrl] = useState('');
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
      const response = await fetch('/api/account/settings', {
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
        await refreshUser();
        await refreshProfile();
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
      const response = await fetch('/api/account/webhook/regenerate-secret', {
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

  // Calculate quota display
  const quotaUsed = quota?.quotaUsed || 0;
  const quotaLimit = quota?.monthlyQuota || quota?.totalQuota || 100;
  const isLifetimeQuota = quota?.plan === 'free';

  return (
    <UnifiedDashboardLayout title="Settings" activeTab="settings">
      {/* Notifications */}
      {successMessage && (
        <Alert className="mb-6 [.dashboard-dark_&]:bg-green-900/50 [.dashboard-dark_&]:border-green-800 [.dashboard-dark_&]:text-green-200 [.dashboard-light_&]:bg-green-50 [.dashboard-light_&]:border-green-300 [.dashboard-light_&]:text-green-700">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive" className="mb-6 [.dashboard-dark_&]:bg-red-900/50 [.dashboard-dark_&]:border-red-800 [.dashboard-dark_&]:text-red-200 [.dashboard-light_&]:bg-red-50 [.dashboard-light_&]:border-red-300 [.dashboard-light_&]:text-red-700">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
          <CardHeader>
            <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="[.dashboard-dark_&]:bg-white/5 [.dashboard-dark_&]:border-white/10 [.dashboard-dark_&]:text-white [.dashboard-dark_&]:placeholder:text-white/40 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-300 [.dashboard-light_&]:text-gray-900 [.dashboard-light_&]:placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:bg-gray-100 [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:text-gray-500"
              />
              <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">Contact support to change your email</p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                Member since {formatDate(user?.createdAt)}
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-primary text-black hover:opacity-90"
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
        <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
          <CardHeader>
            <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
              Receive real-time notifications when try-on sessions are completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl" className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-domain.com/webhook"
                className="[.dashboard-dark_&]:bg-white/5 [.dashboard-dark_&]:border-white/10 [.dashboard-dark_&]:text-white [.dashboard-dark_&]:placeholder:text-white/40 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-300 [.dashboard-light_&]:text-gray-900 [.dashboard-light_&]:placeholder:text-gray-400"
              />
              <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">
                We'll send POST requests with session data to this URL
              </p>
            </div>

            <div className="space-y-2">
              <Label className="[.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Webhook Secret</Label>
              {webhookSecret ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 [.dashboard-dark_&]:bg-black/50 [.dashboard-light_&]:bg-gray-100 rounded-lg border [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:border-gray-300">
                    <code className="text-sm text-green-500 font-mono">{webhookSecret}</code>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyWebhookSecret}
                    className="[.dashboard-dark_&]:border-white/20 [.dashboard-dark_&]:hover:bg-white/10 [.dashboard-light_&]:border-gray-300 [.dashboard-light_&]:hover:bg-gray-100"
                  >
                    {copiedSecret ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500" />
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                  Click regenerate to generate a new webhook secret
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">
                  Use this secret to verify webhook signatures
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateWebhookSecret}
                  disabled={isRegeneratingSecret}
                  className="[.dashboard-dark_&]:border-white/20 [.dashboard-dark_&]:text-white/80 [.dashboard-dark_&]:hover:bg-white/10 [.dashboard-light_&]:border-gray-300 [.dashboard-light_&]:text-gray-700 [.dashboard-light_&]:hover:bg-gray-100"
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
        <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
          <CardHeader>
            <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plan & Billing
            </CardTitle>
            <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 [.dashboard-dark_&]:bg-gradient-to-r [.dashboard-dark_&]:from-indigo-900/50 [.dashboard-dark_&]:to-purple-900/50 [.dashboard-light_&]:bg-gradient-to-r [.dashboard-light_&]:from-indigo-50 [.dashboard-light_&]:to-purple-50 rounded-lg border [.dashboard-dark_&]:border-indigo-800/50 [.dashboard-light_&]:border-indigo-200">
              <div>
                <p className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 font-medium capitalize">{quota?.plan || 'free'} Plan</p>
                <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                  {isLifetimeQuota
                    ? `${quotaLimit} lifetime try-ons`
                    : `${quotaLimit} try-ons per month`
                  }
                </p>
                <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500 mt-1">
                  Used: {quotaUsed} / {quotaLimit}
                </p>
              </div>
              <Button className="bg-primary text-black hover:opacity-90">
                Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
          <CardHeader>
            <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
              Account security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-gray-50 rounded-lg border [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:border-gray-200">
                <div>
                  <p className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 font-medium">Password</p>
                  <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Change your account password</p>
                </div>
                <Button
                  variant="outline"
                  className="[.dashboard-dark_&]:border-white/20 [.dashboard-dark_&]:text-white/80 [.dashboard-dark_&]:hover:bg-white/10 [.dashboard-light_&]:border-gray-300 [.dashboard-light_&]:text-gray-700 [.dashboard-light_&]:hover:bg-gray-100"
                >
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-gray-50 rounded-lg border [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:border-gray-200">
                <div>
                  <p className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 font-medium">Two-Factor Authentication</p>
                  <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Add an extra layer of security</p>
                </div>
                <Button
                  variant="outline"
                  className="[.dashboard-dark_&]:border-white/20 [.dashboard-dark_&]:text-white/80 [.dashboard-dark_&]:hover:bg-white/10 [.dashboard-light_&]:border-gray-300 [.dashboard-light_&]:text-gray-700 [.dashboard-light_&]:hover:bg-gray-100"
                >
                  Coming Soon
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-white border [.dashboard-dark_&]:border-red-900/50 [.dashboard-light_&]:border-red-200 [.dashboard-light_&]:shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
            <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
              Irreversible actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 [.dashboard-dark_&]:bg-red-950/20 [.dashboard-light_&]:bg-red-50 rounded-lg border [.dashboard-dark_&]:border-red-900/30 [.dashboard-light_&]:border-red-200">
              <div>
                <p className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 font-medium">Delete Account</p>
                <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
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
    </UnifiedDashboardLayout>
  );
}
