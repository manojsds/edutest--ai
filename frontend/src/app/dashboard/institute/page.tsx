'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, TrendingUp, LogOut, Settings } from 'lucide-react';

export default function B2BInstitutePage() {
  const { user, institute, logout, isLoading } = useAuth();
  const router = useRouter();
  const referralCode = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('ref')
    : null;
  const [stats, setStats] = useState({
    testsAttempted: 0,
    averageScore: 0,
    studentsInCenter: 0,
  });

  useEffect(() => {
    // In a real app, fetch institute stats here
    if (user) {
      setStats({
        testsAttempted: user.testsAttempted || 0,
        averageScore: user.averageScore || 0,
        studentsInCenter: 0, // Would be fetched from backend
      });
    }
  }, [user]);

  const handleStartTest = () => {
    router.push('/exam');
  };

  const handleLogout = async () => {
    await logout();
  };

  // Redirect if not part of a coaching center
  if (!institute && !isLoading) {
    router.push('/dashboard/home');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your coaching center dashboard...</p>
        </div>
      </div>
    );
  }

  const primaryColor = institute?.primaryColor || '#4F46E5';
  const secondaryColor = institute?.secondaryColor || '#818CF8';

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}20 0%, ${secondaryColor}20 100%)`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            {institute?.logoUrl && (
              <img src={institute.logoUrl} alt={institute.name} className="h-12" />
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{institute?.name}</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card
            className="shadow-lg hover:shadow-xl transition-shadow"
            style={{ borderLeft: `4px solid ${primaryColor}` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests Attempted</CardTitle>
              <BookOpen className="h-5 w-5" style={{ color: primaryColor }} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.testsAttempted}</div>
              <p className="text-xs text-gray-500 mt-1">Since joining the center</p>
            </CardContent>
          </Card>

          <Card
            className="shadow-lg hover:shadow-xl transition-shadow"
            style={{ borderLeft: `4px solid ${secondaryColor}` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-5 w-5" style={{ color: secondaryColor }} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.averageScore}%</div>
              <p className="text-xs text-gray-500 mt-1">Across all tests</p>
            </CardContent>
          </Card>

          <Card
            className="shadow-lg hover:shadow-xl transition-shadow"
            style={{ borderLeft: `4px solid #10B981` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              <Settings className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold capitalize">
                {user?.subscriptionStatus || 'Trial'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Current status</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Start Test */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6" style={{ color: primaryColor }} />
                Start a Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Take a test curated for you by{' '}
                <strong>{institute?.name}</strong>. Get instant AI-powered feedback and explanations.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 space-y-1">
                <div>✓ Tests tailored to your center</div>
                <div>✓ Compare with other students</div>
                <div>✓ Track improvement</div>
              </div>
              <Button
                onClick={handleStartTest}
                className="w-full text-white"
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                Start Test
              </Button>
            </CardContent>
          </Card>

          {/* Center Info */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" style={{ color: secondaryColor }} />
                Center Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Center Name</p>
                <p className="font-semibold text-gray-900">{institute?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Your Status</p>
                <p className="font-semibold text-green-600">✓ Verified Student</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Referral Code</p>
                <p className="font-mono text-gray-900 bg-gray-100 px-3 py-2 rounded">
                  {referralCode || institute?.referralCode}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/dashboard/analytics')}
              >
                View Full Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Center Benefits */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>🎁 Exclusive Benefits as a {institute?.name} Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <p className="font-semibold text-purple-900">Exclusive Tests</p>
                <p className="text-purple-700 text-xs mt-1">
                  Access tests designed specifically for your center by expert educators
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <p className="font-semibold text-blue-900">Leaderboard</p>
                <p className="text-blue-700 text-xs mt-1">
                  Compete with other students from {institute?.name} and see your rank
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <p className="font-semibold text-green-900">Advanced Analytics</p>
                <p className="text-green-700 text-xs mt-1">
                  Get detailed insights about your progress compared to peers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
