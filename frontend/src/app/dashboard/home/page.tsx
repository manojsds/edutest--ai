'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Zap, LogOut } from 'lucide-react';

export default function B2CHome() {
  const { user, logout, institute } = useAuth();
  const router = useRouter();
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinCoachingCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralCode.trim()) {
      setError('Please enter a referral code');
      return;
    }

    setLoading(true);
    setError('');

    // For now, redirect to login with referral code to rejoin
    // In a real app, you'd update the user's institute association here
    router.push(`/login?ref=${referralCode}`);
  };

  const handleStartTest = () => {
    router.push('/exam');
  };

  const handleLogout = async () => {
    await logout();
  };

  if (institute) {
    // If user belongs to a coaching center, redirect to institute dashboard
    router.push(`/dashboard/institute?ref=${institute.referralCode}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Welcome, {user?.name}! 🎓</h1>
            <p className="text-gray-600 mt-2">Prepare for your exams with AI-powered testing</p>
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
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Start Test */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              Start a Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Take our AI-powered tests and improve your exam preparation with instant feedback and
              detailed explanations.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
              ✓ Personalized difficulty levels
              <br />
              ✓ AI explanations for every question
              <br />✓ Track your progress
            </div>
            <Button
              onClick={handleStartTest}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Start Test Now
            </Button>
          </CardContent>
        </Card>

        {/* Join Coaching Center */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-500" />
              Join a Coaching Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              If you're a student at a registered coaching center, enter the referral code to get
              access to your center's dashboard and special features.
            </p>
            <form onSubmit={handleJoinCoachingCenter} className="space-y-3">
              <Input
                placeholder="Enter referral code (e.g., ALLEN2024)"
                value={referralCode}
                onChange={(e) => {
                  setReferralCode(e.target.value.toUpperCase());
                  setError('');
                }}
                className="h-11"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? 'Checking...' : 'Join Center'}
              </Button>
            </form>
            <div className="text-xs text-gray-500 text-center">
              Don't have a code? Continue as an independent student
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="max-w-6xl mx-auto mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">📋 Your Account</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-600">Email</p>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-600">Trial Status</p>
            <p className="font-medium text-green-600">7-Day Free Trial</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-600">Coaching Center</p>
            <p className="font-medium text-gray-900">None (Independent)</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-600">Account Type</p>
            <p className="font-medium text-blue-600">B2C Student</p>
          </div>
        </div>
      </div>
    </div>
  );
}
