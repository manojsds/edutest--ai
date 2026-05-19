"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import referralBrandMap from '@/lib/referralBrandMap.json';
import { 
  GraduationCap, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock, 
  Award,
  LogOut,
  User,
  BarChart3,
  Calendar,
  FileText
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, institute, logout, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [localBrand, setLocalBrand] = useState<{ name?: string; logoUrl?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    const ref = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('ref')
      : null;
    if (ref) {
      const mapped = (referralBrandMap as Record<string, any>)[ref.trim().toUpperCase()];
      if (mapped) {
        setLocalBrand({ name: mapped.name, logoUrl: mapped.logoUrl });
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router, mounted]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  // Apply institute branding
  const primaryColor = institute?.primaryColor || '#4F46E5';
  const secondaryColor = institute?.secondaryColor || '#818CF8';

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      style={{ 
        background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}10 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {(localBrand?.logoUrl || institute?.logoUrl) && (
              <img src={localBrand?.logoUrl || institute?.logoUrl} alt={localBrand?.name || institute?.name || 'Brand'} className="h-12" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                {localBrand?.name || institute?.name || 'EduTest AI Dashboard'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/profile')}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4" style={{ borderLeftColor: primaryColor }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tests Attempted
              </CardTitle>
              <Target className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.testsAttempted || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                Keep practicing to improve!
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: secondaryColor }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Score
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.averageScore || 0}%</div>
              <p className="text-xs text-gray-500 mt-1">
                {(user.averageScore || 0) >= 70 ? 'Great performance!' : 'You can do better!'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Subscription
              </CardTitle>
              <Award className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {user.subscriptionStatus}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {user.subscriptionStatus === 'trial' ? '7-day free trial' : 'Active plan'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Time Spent
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((user.testsAttempted || 0) * 0.5)}h
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total study time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Start New Test */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" style={{ color: primaryColor }} />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => router.push('/exam')}
                className="w-full h-16 text-lg font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                <GraduationCap className="mr-2 h-6 w-6" />
                Start New Test
              </Button>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/performance')}
                  className="h-12"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  My Performance
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/pricing')}
                  className="h-12"
                >
                  <Award className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" style={{ color: secondaryColor }} />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.testsAttempted === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No tests yet</p>
                    <p className="text-sm mt-2">Start your first test to see your progress!</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-600">
                      View detailed history in the History tab
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Notice */}
        {user.subscriptionStatus === 'trial' && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900">Free Trial Active</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    You have {user.subscriptionExpiryDate ? 
                      Math.ceil((new Date(user.subscriptionExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) 
                      : 7} days left in your trial. 
                    Upgrade to continue after trial ends.
                  </p>
                  <Button
                    className="mt-3"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => router.push('/pricing')}
                  >
                    View Plans
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
