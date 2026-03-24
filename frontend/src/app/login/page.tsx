'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Loader2 } from 'lucide-react';
import referralBrandMap from '@/lib/referralBrandMap.json';

export default function LoginPage() {
  const { signInWithCredentials, user, institute, isLoading } = useAuth();
  const router = useRouter();
  const initialReferralCode = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('ref')
    : null;
  const [referralCode, setReferralCode] = useState(initialReferralCode || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingBranding, setLoadingBranding] = useState(false);
  const [branding, setBranding] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  // Load institute branding if referral code present
  useEffect(() => {
    if (referralCode && referralCode.trim().length > 0) {
      const localBrand = (referralBrandMap as Record<string, any>)[referralCode.trim().toUpperCase()];
      if (localBrand) {
        setBranding(localBrand);
        return;
      }

      setLoadingBranding(true);
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/institute/${referralCode}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.institute) {
            setBranding(data.institute);
          }
        })
        .catch((err) => console.error('Failed to load branding:', err))
        .finally(() => setLoadingBranding(false));
    } else {
      setBranding(null);
    }
  }, [referralCode]);

  const handleCredentialsLogin = async () => {
    try {
      setError(null);
      setSigningIn(true);
      if (!email.trim() || !password.trim()) {
        throw new Error('Email and password are required');
      }

      await signInWithCredentials({
        email: email.trim(),
        password,
        referralCode: referralCode.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setSigningIn(false);
    }
  };

  // Redirect if already logged in
  if (user && !isLoading) {
    if (referralCode) {
      router.push(`/dashboard?ref=${encodeURIComponent(referralCode)}`);
    } else if (institute) {
      router.push(`/dashboard/institute?ref=${institute.referralCode}`);
    } else {
      router.push('/dashboard/home');
    }
    return null;
  }

  const primaryColor = branding?.primaryColor || '#4F46E5';
  const secondaryColor = branding?.secondaryColor || '#818CF8';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}20 0%, ${secondaryColor}20 100%)`,
      }}
    >
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-8">
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} className="h-16 mx-auto mb-4" />
          ) : (
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full" style={{ backgroundColor: primaryColor }}>
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
            </div>
          )}
          <CardTitle className="text-3xl font-bold">
            {referralCode ? `Join ${branding?.name || 'Coaching Center'}` : 'Welcome to EduTest'}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {referralCode
              ? 'Login with your account to access center-branded dashboard'
              : 'Login to continue'}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="email"
              className="w-full border rounded-md p-3"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="w-full border rounded-md p-3"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="text"
              className="w-full border rounded-md p-3"
              placeholder="Referral code (optional)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCredentialsLogin}
            disabled={isLoading || loadingBranding || signingIn}
            className="w-full py-6 text-lg font-semibold text-white"
            style={{
              backgroundColor: primaryColor,
              borderColor: primaryColor,
            }}
          >
            {signingIn || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>

          {referralCode && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
              <p className="font-semibold">✓ Joining {branding?.name || 'Coaching Center'}</p>
              <p className="mt-1">
                After login, you will be redirected to this institute's white-labeled dashboard.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <div className="absolute top-8 right-8 hidden lg:block max-w-xs">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">💡 Have a referral code?</p>
          <p className="text-xs text-gray-600 mt-1">
            If your coaching center gave you a code, add <code className="bg-gray-100 px-1">?ref=CODE</code>{' '}
            to the URL to automatically link your account.
          </p>
        </div>
      </div>
    </div>
  );
}
