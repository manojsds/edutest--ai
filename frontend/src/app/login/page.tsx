'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Loader2 } from 'lucide-react';
import referralBrandMap from '@/lib/referralBrandMap.json';

export default function LoginPage() {
  const { signInWithCredentials, signInWithGoogle, user, institute, isLoading } = useAuth();
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
        `${process.env.NEXT_PUBLIC_API_URL || 'https://edutest-ai-backend.onrender.com'}/api/auth/institute/${referralCode}`
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

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setSigningIn(true);
      await signInWithGoogle({
        referralCode: referralCode.trim() || undefined,
      });

      router.push(
        referralCode
          ? `/dashboard?ref=${encodeURIComponent(referralCode)}`
          : '/dashboard/home'
      );
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed');
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading || loadingBranding || signingIn}
            className="w-full py-6 text-lg font-semibold border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            {signingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </>
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
