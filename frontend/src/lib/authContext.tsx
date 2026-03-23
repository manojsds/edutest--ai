'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Keep Firebase setup local to avoid module-resolution issues in some deploy setups.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  instituteId?: string;
  instituteName?: string;
  subscriptionStatus?: string;
  subscriptionExpiryDate?: string;
  role?: string;
  testsAttempted?: number;
  averageScore?: number;
  totalQuestions?: number;
  correctAnswers?: number;
}

interface Institute {
  id: string;
  name: string;
  referralCode: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

interface AuthContextType {
  user: User | null;
  institute: Institute | null;
  token: string | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Check for redirect result on mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User signed in via redirect
          const idToken = await result.user.getIdToken();
          const referralCode = sessionStorage.getItem('referralCode') || null;
          sessionStorage.removeItem('referralCode'); // Clean up

          // Create or get user in backend
          const response = await fetch(`${API_URL}/api/auth/google-signin`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: result.user.email,
              name: result.user.displayName,
              picture: result.user.photoURL,
              referralCode: referralCode,
              firebaseUid: result.user.uid,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(idToken);

            if (data.institute) {
              setInstitute(data.institute);
              router.push(`/dashboard/institute?ref=${data.institute.referralCode}`);
            } else {
              router.push('/dashboard/home');
            }
          }
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    handleRedirectResult();
  }, []);

  // Check user on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);

          // Get or create user in backend
          const response = await fetch(`${API_URL}/api/auth/user-profile`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            if (data.institute) setInstitute(data.institute);
          } else {
            // User doesn't exist in backend yet - will be created on first action
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              picture: firebaseUser.photoURL || undefined,
            });
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      } else {
        setUser(null);
        setToken(null);
        setInstitute(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const referralCode = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('ref')
        : null;
      
      // Store referral code in sessionStorage before redirect
      if (referralCode) {
        sessionStorage.setItem('referralCode', referralCode);
      }

      // Start redirect flow
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
      setInstitute(null);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/auth/user-profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        if (data.institute) setInstitute(data.institute);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        institute,
        token,
        isLoading,
        signInWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
