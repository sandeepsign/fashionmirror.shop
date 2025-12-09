import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/merchant/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, CheckCircle, XCircle, Clock, Eye, Image } from 'lucide-react';

interface Session {
  id: string;
  productImage: string;
  productName: string | null;
  productId: string | null;
  status: string;
  processingTime: number | null;
  originDomain: string | null;
  createdAt: string;
  completedAt: string | null;
}

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

export default function MerchantAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, sessionsRes] = await Promise.all([
        fetch('/api/merchants/analytics/overview', { credentials: 'include' }),
        fetch('/api/merchants/sessions?limit=50', { credentials: 'include' })
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        if (data.success) {
          setAnalytics(data.analytics);
        }
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        if (data.success) {
          setSessions(data.sessions || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-400">
            <Clock className="w-3 h-3" />
            {status}
          </span>
        );
    }
  };

  // Calculate daily chart data
  const getChartData = () => {
    const days: { date: string; count: number }[] = [];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        count: analytics?.sessionsByDay?.[dateStr] || 0
      });
    }

    return days;
  };

  const chartData = getChartData();
  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <DashboardLayout title="Analytics">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-indigo-900/50">
                    <TrendingUp className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Sessions</p>
                    <p className="text-2xl font-bold text-white">{analytics?.totalSessions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-900/50">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Completed</p>
                    <p className="text-2xl font-bold text-white">{analytics?.completedSessions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-red-900/50">
                    <XCircle className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Failed</p>
                    <p className="text-2xl font-bold text-white">{analytics?.failedSessions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-900/50">
                    <Clock className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Conversion Rate</p>
                    <p className="text-2xl font-bold text-white">{analytics?.conversionRate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Chart */}
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Activity (Last 14 Days)</CardTitle>
              <CardDescription className="text-slate-400">
                Number of try-on sessions per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-2">
                {chartData.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-indigo-600 rounded-t transition-all hover:bg-indigo-500"
                      style={{
                        height: `${Math.max((day.count / maxCount) * 100, 4)}%`,
                        minHeight: day.count > 0 ? '8px' : '4px'
                      }}
                      title={`${day.date}: ${day.count} sessions`}
                    />
                    <span className="text-xs text-slate-500 rotate-45 origin-left whitespace-nowrap">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions Table */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Sessions</CardTitle>
              <CardDescription className="text-slate-400">
                Latest try-on sessions from your widget
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No sessions yet</p>
                  <p className="text-sm mt-1">Sessions will appear here once customers use the widget</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Product</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Domain</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr key={session.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {session.productImage ? (
                                <img
                                  src={session.productImage}
                                  alt={session.productName || 'Product'}
                                  className="w-10 h-10 rounded object-cover bg-slate-700"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center">
                                  <Image className="w-5 h-5 text-slate-500" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-white font-medium">
                                  {session.productName || 'Unnamed Product'}
                                </p>
                                {session.productId && (
                                  <p className="text-xs text-slate-500">{session.productId}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(session.status)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-slate-400">
                              {session.originDomain || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-slate-400">
                              {formatDate(session.createdAt)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm text-slate-400">
                              {session.processingTime
                                ? `${(session.processingTime / 1000).toFixed(1)}s`
                                : '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
