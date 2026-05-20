'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2, Building2, ArrowLeft } from 'lucide-react';

const EXAM_OPTIONS = [
  'UPSC', 'JEE Main', 'JEE Advanced', 'NEET UG',
  'SSC CGL', 'Bank PO', 'GATE', 'CAT', 'KCET', 'KPSC', 'State PSC', 'Other',
];

export default function InstituteRegisterPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://edutest-ai.onrender.com';

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    instituteName: '',
    contactName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    examFocus: 'UPSC',
    studentCount: '',
    referralCode: '',
    city: '',
  });

  const [createdCode, setCreatedCode] = useState('');

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Auto-generate referral code from institute name
  const suggestCode = (name: string) => {
    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10) + new Date().getFullYear();
    set('referralCode', code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.instituteName || !form.email || !form.password || !form.contactName) {
      setError('Please fill all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!form.referralCode || form.referralCode.length < 4) {
      setError('Referral code must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/institute/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteName: form.instituteName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          examFocus: form.examFocus,
          studentCount: parseInt(form.studentCount) || 0,
          referralCode: form.referralCode.toUpperCase(),
          city: form.city,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Registration failed');

      setCreatedCode(form.referralCode.toUpperCase());
      setStep('success');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center shadow-xl">
          <CardContent className="pt-10 pb-10 px-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
            <p className="text-gray-600 mb-6">
              Your institute is registered. Share this referral code with your students:
            </p>
            <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-6 mb-6">
              <p className="text-sm text-indigo-600 font-medium mb-1">Your Referral Code</p>
              <p className="text-4xl font-mono font-bold text-indigo-700">{createdCode}</p>
              <p className="text-xs text-indigo-500 mt-2">
                Students sign up at: <span className="font-semibold">edutest.ai/?ref={createdCode}</span>
              </p>
            </div>
            <div className="space-y-3">
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => router.push('/login')}
              >
                Go to Admin Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/?ref=${createdCode}`
                  );
                  alert('Signup link copied!');
                }}
              >
                Copy Student Signup Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/')}
          className="mb-6 gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Register Your Institute</h1>
          <p className="text-gray-600 mt-2">
            Free to join. Earn 10% commission on every student subscription.
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Institute Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Institute Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Institute Name *</Label>
                  <Input
                    placeholder="e.g. Allen Career Institute"
                    value={form.instituteName}
                    onChange={e => {
                      set('instituteName', e.target.value);
                      if (!form.referralCode) suggestCode(e.target.value);
                    }}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input
                    placeholder="e.g. Bangalore"
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Contact Person Name *</Label>
                  <Input
                    placeholder="Your name"
                    value={form.contactName}
                    onChange={e => set('contactName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Primary Exam Focus</Label>
                  <select
                    className="w-full border rounded-md p-2.5 text-sm"
                    value={form.examFocus}
                    onChange={e => set('examFocus', e.target.value)}
                  >
                    {EXAM_OPTIONS.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Approx. Student Count</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 200"
                    value={form.studentCount}
                    onChange={e => set('studentCount', e.target.value)}
                  />
                </div>
              </div>

              {/* Referral Code */}
              <div className="space-y-1.5">
                <Label>Your Referral Code *</Label>
                <Input
                  placeholder="e.g. ALLEN2024"
                  value={form.referralCode}
                  onChange={e => set('referralCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  className="font-mono font-semibold tracking-wider"
                  required
                />
                <p className="text-xs text-gray-500">
                  Students use this code to join your institute. Keep it simple and memorable.
                </p>
              </div>

              {/* Login credentials */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Admin Login Credentials</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="admin@yourinstitute.com"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Password *</Label>
                      <Input
                        type="password"
                        placeholder="Min 8 characters"
                        value={form.password}
                        onChange={e => set('password', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Confirm Password *</Label>
                      <Input
                        type="password"
                        placeholder="Repeat password"
                        value={form.confirmPassword}
                        onChange={e => set('confirmPassword', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission highlight */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-yellow-900">💰 How you earn:</p>
                <p className="text-yellow-800 mt-1">
                  Students pay ₹270/month. You earn ₹27 per student automatically.
                  50 students = <strong>₹1,350/month</strong> passive income.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Registering...</>
                ) : (
                  'Register Institute — Free'
                )}
              </Button>

              <p className="text-center text-sm text-gray-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Login here
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
