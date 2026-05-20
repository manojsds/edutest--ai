'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

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
  signInWithCredentials: (payload: {
    email: string;
    password: string;
    referralCode?: string;
  }) => Promise<void>;
  signInWithGoogle: (payload?: {
    referralCode?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  institute: null,
  token: null,
  isLoading: true,
  signInWithCredentials: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);
const TOKEN_KEY = 'edutest_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'https://edutest-ai.onrender.com';

  // Initialize session from stored JWT
  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        if (!savedToken) {
          setIsLoading(false);
          return;
        }

        setToken(savedToken);

        const response = await fetch(`${API_URL}/api/auth/user-profile`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${savedToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setInstitute(data.institute || null);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          setInstitute(null);
        }
      } catch (error) {
        console.error('Session bootstrap failed:', error);
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setInstitute(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapSession();
  }, []);

  const signInWithCredentials = async ({ email, password, referralCode }: {
    email: string;
    password: string;
    referralCode?: string;
  }) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Login failed');
      }

      if (!data?.token || !data?.user) {
        throw new Error('Invalid login response');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setInstitute(data.institute || null);
    } catch (error) {
      console.error('Credentials sign-in failed:', error);
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async ({ referralCode }: { referralCode?: string } = {}) => {
    try {
      setIsLoading(true);

      if (!auth || !googleProvider) {
        throw new Error('Firebase authentication is not configured. Set the NEXT_PUBLIC_FIREBASE_* environment variables.');
      }

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await fetch(`${API_URL}/api/auth/google-signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Google sign-in failed');
      }

      if (!data?.token || !data?.user) {
        throw new Error('Invalid Google sign-in response');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setInstitute(data.institute || null);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
      setInstitute(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);
    if (!activeToken) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/user-profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        if (data.institute) setInstitute(data.institute);
      } else if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setInstitute(null);
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
        signInWithCredentials,
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
  return useContext(AuthContext);
}
