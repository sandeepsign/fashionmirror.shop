import { useEffect, useState } from 'react';
import UnifiedDashboardLayout from '@/components/UnifiedDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, TrendingUp, CheckCircle, XCircle, Clock, Eye, Image, X, ArrowRight, Trash2, Key } from 'lucide-react';

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
  userImage: string | null;
  resultImage: string | null;
  apiKeyId: string | null;
  apiKeyName: string | null;
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

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, sessionsRes] = await Promise.all([
        fetch('/api/account/analytics/overview', { credentials: 'include' }),
        fetch('/api/account/sessions?limit=50', { credentials: 'include' })
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

  const toggleSessionSelection = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedSessionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSessionIds.size === sessions.length) {
      setSelectedSessionIds(new Set());
    } else {
      setSelectedSessionIds(new Set(sessions.map(s => s.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedSessionIds.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/account/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionIds: Array.from(selectedSessionIds) }),
      });

      if (response.ok) {
        // Remove deleted sessions from state
        setSessions(prev => prev.filter(s => !selectedSessionIds.has(s.id)));
        setSelectedSessionIds(new Set());
        setShowDeleteConfirm(false);
        // Refresh analytics
        fetchData();
      } else {
        console.error('Failed to delete sessions');
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
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
    const sessionsByDay = analytics?.sessionsByDay || {};

    // Check if we have any session data
    const sessionDates = Object.keys(sessionsByDay);

    // Get today's date in UTC to match server-side date formatting
    const now = new Date();
    const todayUTC = now.toISOString().split('T')[0];

    if (sessionDates.length > 0) {
      // Sort dates
      const sortedDates = sessionDates.sort();
      const earliestWithData = sortedDates[0];
      const latestWithData = sortedDates[sortedDates.length - 1];

      // Determine the end date (latest data or today, whichever is later)
      const endDate = latestWithData > todayUTC ? latestWithData : todayUTC;

      // Determine start date (14 days before end date, or earliest data if within 30 days)
      const endDateObj = new Date(endDate + 'T00:00:00Z');
      const fourteenDaysBeforeEnd = new Date(endDateObj);
      fourteenDaysBeforeEnd.setUTCDate(fourteenDaysBeforeEnd.getUTCDate() - 13);
      const fourteenDaysAgoStr = fourteenDaysBeforeEnd.toISOString().split('T')[0];

      // Use earliest data if it's within the range, otherwise use 14 days before end
      const startDate = earliestWithData < fourteenDaysAgoStr ? fourteenDaysAgoStr : earliestWithData;

      // Generate days from start to end
      const currentDate = new Date(startDate + 'T00:00:00Z');
      const endDateParsed = new Date(endDate + 'T00:00:00Z');

      while (currentDate <= endDateParsed) {
        const dateStr = currentDate.toISOString().split('T')[0];
        days.push({
          date: dateStr,
          count: sessionsByDay[dateStr] || 0
        });
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    } else {
      // No session data - show last 14 days with zeros
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setUTCDate(date.getUTCDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        days.push({
          date: dateStr,
          count: 0
        });
      }
    }

    return days;
  };

  const chartData = getChartData();
  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  // Debug logging
  console.log('[Analytics Chart] sessionsByDay:', analytics?.sessionsByDay);
  console.log('[Analytics Chart] chartData:', chartData);
  console.log('[Analytics Chart] maxCount:', maxCount);

  return (
    <UnifiedDashboardLayout title="Analytics" activeTab="analytics">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg [.dashboard-dark_&]:bg-indigo-900/50 [.dashboard-light_&]:bg-indigo-100">
                    <TrendingUp className="h-6 w-6 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Total Sessions</p>
                    <p className="text-2xl font-bold [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">{analytics?.totalSessions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg [.dashboard-dark_&]:bg-green-900/50 [.dashboard-light_&]:bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Completed</p>
                    <p className="text-2xl font-bold [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">{analytics?.completedSessions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg [.dashboard-dark_&]:bg-red-900/50 [.dashboard-light_&]:bg-red-100">
                    <XCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Failed</p>
                    <p className="text-2xl font-bold [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">{analytics?.failedSessions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg [.dashboard-dark_&]:bg-amber-900/50 [.dashboard-light_&]:bg-amber-100">
                    <Clock className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-bold [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">{analytics?.conversionRate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Chart */}
          <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm mb-8">
            <CardHeader>
              <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">
                Activity {chartData.length > 0 ? `(Last ${chartData.length} Days)` : '(Last 14 Days)'}
              </CardTitle>
              <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                Number of try-on sessions per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-1">
                {chartData.map((day) => {
                  const heightPercent = Math.max((day.count / maxCount) * 100, 4);
                  const barHeight = day.count > 0 ? Math.max(heightPercent, 10) : 4;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center justify-end" style={{ minWidth: chartData.length === 1 ? '60px' : 'auto', maxWidth: chartData.length < 5 ? '120px' : 'auto' }}>
                      <div className="w-full flex flex-col items-center justify-end" style={{ height: '140px' }}>
                        {/* Count label above bar */}
                        {day.count > 0 && (
                          <span className="text-xs font-medium [.dashboard-dark_&]:text-white/70 [.dashboard-light_&]:text-gray-600 mb-1">
                            {day.count}
                          </span>
                        )}
                        {/* Bar */}
                        <div
                          className={`w-full rounded-t transition-all ${day.count > 0 ? '[.dashboard-dark_&]:bg-indigo-500 [.dashboard-dark_&]:hover:bg-indigo-400 [.dashboard-light_&]:bg-indigo-600 [.dashboard-light_&]:hover:bg-indigo-500' : '[.dashboard-dark_&]:bg-white/10 [.dashboard-light_&]:bg-gray-200'}`}
                          style={{
                            height: `${barHeight}%`,
                            minHeight: day.count > 0 ? '20px' : '4px'
                          }}
                          title={`${day.date}: ${day.count} sessions`}
                        />
                      </div>
                      {/* Date label */}
                      <span className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400 mt-2 rotate-45 origin-left whitespace-nowrap">
                        {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions Table */}
          <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">Recent Sessions</CardTitle>
                  <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                    Latest try-on sessions from your widget
                  </CardDescription>
                </div>
                {selectedSessionIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedSessionIds.size})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12 [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No sessions yet</p>
                  <p className="text-sm mt-1">Sessions will appear here once customers use the widget</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:border-gray-200">
                        <th className="w-10 py-3 px-4">
                          <Checkbox
                            checked={selectedSessionIds.size === sessions.length && sessions.length > 0}
                            onCheckedChange={toggleSelectAll}
                            className="[.dashboard-dark_&]:border-white/30 [.dashboard-light_&]:border-gray-300"
                          />
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Product</th>
                        <th className="text-left py-3 px-4 text-sm font-medium [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">API Key</th>
                        <th className="text-left py-3 px-4 text-sm font-medium [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Domain</th>
                        <th className="text-left py-3 px-4 text-sm font-medium [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Date</th>
                        <th className="text-right py-3 px-4 text-sm font-medium [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr
                          key={session.id}
                          className={`border-b [.dashboard-dark_&]:border-white/5 [.dashboard-light_&]:border-gray-100 [.dashboard-dark_&]:hover:bg-white/5 [.dashboard-light_&]:hover:bg-gray-50 cursor-pointer ${selectedSessionIds.has(session.id) ? '[.dashboard-dark_&]:bg-white/10 [.dashboard-light_&]:bg-blue-50' : ''}`}
                          onClick={() => setSelectedSession(session)}
                        >
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedSessionIds.has(session.id)}
                              onCheckedChange={() => {
                                setSelectedSessionIds(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(session.id)) {
                                    newSet.delete(session.id);
                                  } else {
                                    newSet.add(session.id);
                                  }
                                  return newSet;
                                });
                              }}
                              className="[.dashboard-dark_&]:border-white/30 [.dashboard-light_&]:border-gray-300"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {session.productImage ? (
                                <img
                                  src={session.productImage}
                                  alt={session.productName || 'Product'}
                                  className="w-10 h-10 rounded object-cover [.dashboard-dark_&]:bg-white/10 [.dashboard-light_&]:bg-gray-100"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded [.dashboard-dark_&]:bg-white/10 [.dashboard-light_&]:bg-gray-100 flex items-center justify-center">
                                  <Image className="w-5 h-5 [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 font-medium">
                                  {session.productName || 'Unnamed Product'}
                                </p>
                                {session.productId && (
                                  <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">{session.productId}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(session.status)}
                          </td>
                          <td className="py-3 px-4">
                            {session.apiKeyName ? (
                              <span className="inline-flex items-center gap-1 text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                                <Key className="w-3 h-3" />
                                {session.apiKeyName}
                              </span>
                            ) : (
                              <span className="text-sm [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                              {session.originDomain || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
                              {formatDate(session.createdAt)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
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

      {/* Session Detail Modal */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="max-w-4xl [.dashboard-dark_&]:bg-slate-900 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200">
          <DialogHeader>
            <DialogTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">
              Session Details
            </DialogTitle>
            <DialogDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
              {selectedSession?.productName || 'Try-on session'} - {selectedSession?.createdAt && formatDate(selectedSession.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Status:</span>
                {getStatusBadge(selectedSession.status)}
                {selectedSession.processingTime && (
                  <span className="text-sm [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400 ml-2">
                    ({(selectedSession.processingTime / 1000).toFixed(1)}s)
                  </span>
                )}
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Model Image */}
                <div className="space-y-2">
                  <p className="text-sm font-medium [.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Model Photo</p>
                  <div className="aspect-[3/4] rounded-lg overflow-hidden [.dashboard-dark_&]:bg-white/5 [.dashboard-light_&]:bg-gray-100 border [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:border-gray-200">
                    {selectedSession.userImage ? (
                      <img
                        src={`/api/account/sessions/${selectedSession.id}/image/user?v=${new Date(selectedSession.updatedAt || selectedSession.createdAt).getTime()}`}
                        alt="Model"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Image className="w-8 h-8 mx-auto mb-2 [.dashboard-dark_&]:text-white/30 [.dashboard-light_&]:text-gray-300" />
                          <span className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">No model image</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Image */}
                <div className="space-y-2">
                  <p className="text-sm font-medium [.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Product</p>
                  <div className="aspect-[3/4] rounded-lg overflow-hidden [.dashboard-dark_&]:bg-white/5 [.dashboard-light_&]:bg-gray-100 border [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:border-gray-200">
                    {selectedSession.productImage ? (
                      <img
                        src={selectedSession.productImage}
                        alt={selectedSession.productName || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Image className="w-8 h-8 mx-auto mb-2 [.dashboard-dark_&]:text-white/30 [.dashboard-light_&]:text-gray-300" />
                          <span className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">No product image</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Result Image */}
                <div className="space-y-2">
                  <p className="text-sm font-medium [.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-700">Try-On Result</p>
                  <div className="aspect-[3/4] rounded-lg overflow-hidden [.dashboard-dark_&]:bg-white/5 [.dashboard-light_&]:bg-gray-100 border [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:border-gray-200">
                    {selectedSession.resultImage ? (
                      <img
                        src={`/api/account/sessions/${selectedSession.id}/image/result?v=${new Date(selectedSession.updatedAt || selectedSession.createdAt).getTime()}`}
                        alt="Try-on result"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          {selectedSession.status === 'processing' ? (
                            <>
                              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin [.dashboard-dark_&]:text-white/30 [.dashboard-light_&]:text-gray-300" />
                              <span className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">Processing...</span>
                            </>
                          ) : selectedSession.status === 'failed' ? (
                            <>
                              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                              <span className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">Failed</span>
                            </>
                          ) : (
                            <>
                              <Image className="w-8 h-8 mx-auto mb-2 [.dashboard-dark_&]:text-white/30 [.dashboard-light_&]:text-gray-300" />
                              <span className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">No result</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Domain:</span>
                  <span className="ml-2 [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">{selectedSession.originDomain || '-'}</span>
                </div>
                <div>
                  <span className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Product ID:</span>
                  <span className="ml-2 [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">{selectedSession.productId || '-'}</span>
                </div>
                <div>
                  <span className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">API Key:</span>
                  <span className="ml-2 [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 inline-flex items-center gap-1">
                    {selectedSession.apiKeyName ? (
                      <>
                        <Key className="w-3 h-3" />
                        {selectedSession.apiKeyName}
                      </>
                    ) : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md [.dashboard-dark_&]:bg-slate-900 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200">
          <DialogHeader>
            <DialogTitle className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">
              Delete Sessions
            </DialogTitle>
            <DialogDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
              Are you sure you want to delete {selectedSessionIds.size} session{selectedSessionIds.size !== 1 ? 's' : ''}?
              This will permanently delete all associated images and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="[.dashboard-dark_&]:border-white/20 [.dashboard-dark_&]:text-white [.dashboard-light_&]:border-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}
