import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/merchant/DashboardLayout';
import { useMerchantAuth } from '@/contexts/MerchantAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, CheckCircle, XCircle, Clock, ArrowRight, Copy, Check } from 'lucide-react';

interface AnalyticsData {
  quota: {
    used: number;
    limit: number;
    resetAt: string | null;
  };
  totalSessions: number;
  completedSessions: number;
  failedSessions: number;
  conversionRate: number;
  sessionsByDay: Record<string, number>;
}

export default function MerchantDashboard() {
  const [, setLocation] = useLocation();
  const { merchant, apiKeys } = useMerchantAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/merchants/analytics/overview', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyApiKey = () => {
    if (apiKeys?.liveKey) {
      navigator.clipboard.writeText(apiKeys.liveKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quotaPercentage = analytics
    ? Math.min((analytics.quota.used / analytics.quota.limit) * 100, 100)
    : 0;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome Message */}
      <div className="mb-8">
        <h2 className="text-xl text-slate-300">
          Welcome back, <span className="text-white font-semibold">{merchant?.name}</span>
        </h2>
        <p className="text-slate-400 mt-1">
          Here's an overview of your virtual try-on integration
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Monthly Quota</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-bold text-white">
                    {analytics?.quota.used || 0}
                  </span>
                  <span className="text-slate-400">/ {analytics?.quota.limit || 100}</span>
                </div>
                <Progress value={quotaPercentage} className="h-2 bg-slate-700" />
                <p className="text-xs text-slate-500 mt-2">
                  Resets {formatDate(analytics?.quota.resetAt || null)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Total Sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                  <span className="text-2xl font-bold text-white">
                    {analytics?.totalSessions || 0}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Last 30 days</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-2xl font-bold text-white">
                    {analytics?.completedSessions || 0}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Successful try-ons</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Conversion Rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                  <span className="text-2xl font-bold text-white">
                    {analytics?.conversionRate || 0}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Sessions to completion</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Key Card */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Your API Key</CardTitle>
                <CardDescription className="text-slate-400">
                  Use this key to integrate the widget on your site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <code className="flex-1 text-sm text-slate-300 font-mono truncate">
                    {apiKeys?.liveKeyMasked || 'Loading...'}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyApiKey}
                    className="text-slate-400 hover:text-white"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setLocation('/merchant/integration')}
                >
                  View Integration Guide
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Start Card */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Quick Start</CardTitle>
                <CardDescription className="text-slate-400">
                  Get started with virtual try-on in minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="text-white font-medium">Add the script tag</p>
                      <p className="text-sm text-slate-400">Include our JavaScript on your page</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-sm font-medium">
                      2
                    </div>
                    <div>
                      <p className="text-white font-medium">Add the button</p>
                      <p className="text-sm text-slate-400">Add a try-on button to your product pages</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-sm font-medium">
                      3
                    </div>
                    <div>
                      <p className="text-white font-medium">Go live!</p>
                      <p className="text-sm text-slate-400">Your customers can now try on clothes</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={() => setLocation('/merchant/integration')}
                >
                  View Full Documentation
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Plan Info */}
          <Card className="mt-6 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-800/50">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-white font-medium">
                  You're on the <span className="capitalize">{merchant?.plan || 'Free'}</span> plan
                </p>
                <p className="text-sm text-slate-400">
                  {(analytics?.quota.limit || 100)} try-ons per month
                </p>
              </div>
              <Button className="bg-white text-slate-900 hover:bg-slate-100">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
