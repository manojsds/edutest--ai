'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, TrendingUp, IndianRupee, Award, LogOut,
  BookOpen, BarChart3, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle, Clock, XCircle,
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  testsAttempted: number;
  averageScore: number;
  lastLoginAt: string | null;
  createdAt: string;
}

interface Analytics {
  totalTests: number;
  totalQuestions: number;
  averageScore: number;
  activeStudentsCount: number;
  topTopics: { topic: string; count: number }[];
}

interface DashboardData {
  institute: {
    id: string;
    name: string;
    referralCode: string;
    logoUrl?: string;
    primaryColor: string;
    commissionPercentage: number;
  };
  stats: {
    totalStudents: number;
    activeStudents: number;
    trialStudents: number;
    expiredStudents: number;
    monthlyRevenue: number;
    monthlyCommission: number;
    totalCommissionEarned: number;
  };
  analytics: Analytics;
  students: Student[];
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-600 bg-green-50',
  trial: 'text-blue-600 bg-blue-50',
  expired: 'text-red-600 bg-red-50',
  cancelled: 'text-gray-600 bg-gray-50',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <CheckCircle className="w-3 h-3" />,
  trial: <Clock className="w-3 h-3" />,
  expired: <XCircle className="w-3 h-3" />,
};

export default function InstituteDashboard() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://edutest-ai-2.onrender.com';

  const fetchDashboard = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const activeToken = token || localStorage.getItem('edutest_auth_token');
      if (!activeToken) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_URL}/api/institute/dashboard`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load dashboard');
      }

      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <Button className="mt-4" onClick={() => fetchDashboard()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { institute, stats, analytics, students } = data;
  const primaryColor = institute.primaryColor || '#4F46E5';
  const displayedStudents = showAllStudents ? students : students.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {institute.logoUrl && (
              <img src={institute.logoUrl} alt={institute.name} className="h-10 object-contain" />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{institute.name}</h1>
              <p className="text-xs text-gray-500">
                Referral Code: <span className="font-mono font-semibold">{institute.referralCode}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { logout(); router.push('/login'); }}
              className="gap-1"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4" style={{ borderLeftColor: primaryColor }}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-gray-500">Total Students</CardTitle>
              <Users className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.activeStudents} active · {stats.trialStudents} trial</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-gray-500">Monthly Revenue</CardTitle>
              <IndianRupee className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">₹{stats.monthlyRevenue.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-1">from {stats.activeStudents} paid students</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-gray-500">Your Commission</CardTitle>
              <Award className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">₹{stats.monthlyCommission.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-1">{institute.commissionPercentage}% this month</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-gray-500">Avg Score</CardTitle>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{analytics.averageScore}%</p>
              <p className="text-xs text-gray-500 mt-1">{analytics.totalTests} tests taken</p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Banner */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-yellow-900 text-lg">
                  💰 Total Commission Earned: ₹{stats.totalCommissionEarned.toLocaleString('en-IN')}
                </h3>
                <p className="text-sm text-yellow-800 mt-1">
                  You earn {institute.commissionPercentage}% on every student subscription.
                  Get {stats.activeStudents} more active students to earn ₹{(stats.monthlyCommission * 2).toLocaleString('en-IN')}/month.
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-yellow-700">Next payout</p>
                <p className="font-bold text-yellow-900">1st of next month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Topics + Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-4 h-4" style={{ color: primaryColor }} />
                Most Practiced Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topTopics.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No test data yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics.topTopics.slice(0, 6).map((t, i) => (
                    <div key={t.topic} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-400 w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 truncate">{t.topic}</span>
                          <span className="text-gray-500 shrink-0 ml-2">{t.count} tests</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (t.count / (analytics.topTopics[0]?.count || 1)) * 100)}%`,
                              backgroundColor: primaryColor,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4" style={{ color: primaryColor }} />
                Subscription Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Active (Paid)', count: stats.activeStudents, color: 'bg-green-500', total: stats.totalStudents },
                { label: 'Trial', count: stats.trialStudents, color: 'bg-blue-400', total: stats.totalStudents },
                { label: 'Expired', count: stats.expiredStudents, color: 'bg-red-400', total: stats.totalStudents },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: item.total > 0 ? `${(item.count / item.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-2">
                Convert {stats.trialStudents} trial students → ₹{(stats.trialStudents * 270).toLocaleString('en-IN')}/month potential
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Student Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4" style={{ color: primaryColor }} />
              Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium text-right">Tests</th>
                    <th className="pb-3 font-medium text-right">Avg Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayedStudents.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 font-medium text-gray-900">{student.name}</td>
                      <td className="py-3 pr-4 text-gray-500 truncate max-w-[180px]">{student.email}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[student.subscriptionStatus] || 'text-gray-600 bg-gray-50'}`}>
                          {STATUS_ICONS[student.subscriptionStatus]}
                          {student.subscriptionStatus}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-700">{student.testsAttempted}</td>
                      <td className="py-3 text-right">
                        <span className={`font-semibold ${student.averageScore >= 70 ? 'text-green-600' : student.averageScore >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {student.averageScore}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {students.length > 10 && (
              <button
                onClick={() => setShowAllStudents(!showAllStudents)}
                className="mt-4 w-full flex items-center justify-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 py-2 border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                {showAllStudents ? (
                  <><ChevronUp className="w-4 h-4" /> Show less</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> Show all {students.length} students</>
                )}
              </button>
            )}

            {students.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No students yet</p>
                <p className="text-sm mt-1">Share your referral code <span className="font-mono font-bold text-indigo-600">{institute.referralCode}</span> to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share referral code */}
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="pt-5 pb-5">
            <h3 className="font-semibold text-indigo-900 mb-2">📣 Share Your Referral Code</h3>
            <p className="text-sm text-indigo-800 mb-3">
              Students who sign up with your code get your institute's branding and you earn commission on their subscriptions.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <code className="bg-white border border-indigo-300 px-4 py-2 rounded-lg font-mono font-bold text-indigo-700 text-lg">
                {institute.referralCode}
              </code>
              <Button
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/?ref=${institute.referralCode}`;
                  navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard!');
                }}
                style={{ backgroundColor: primaryColor }}
              >
                Copy Signup Link
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
