'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function SignupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const referralCode = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('ref')
    : null;

  // Redirect to login page (we only use Google OAuth now)
  useEffect(() => {
    if (!user) {
      const loginUrl = referralCode ? `/login?ref=${referralCode}` : '/login';
      router.push(loginUrl);
    } else {
      // Already logged in, go to dashboard
      router.push('/dashboard/home');
    }
  }, [user, referralCode, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to sign in...</p>
      </div>
    </div>
  );
}
