'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function BrandingSetupPage() {
  const [referralCode, setReferralCode] = useState('');
  const [brandingKey, setBrandingKey] = useState('');
  const [brandName, setBrandName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    const key = new URLSearchParams(window.location.search).get('key');
    if (ref) {
      setReferralCode(ref);
      loadInstitute(ref);
    }
    if (key) {
      setBrandingKey(key);
    }
  }, []);

  const loadInstitute = async (ref: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/institute/${ref}`);
      if (!response.ok) return;
      const data = await response.json();
      if (data?.institute) {
        setBrandName(data.institute.name || '');
        setLogoUrl(data.institute.logoUrl || '');
      }
    } catch (e) {
      // ignore load preview failure
    }
  };

  const handleSave = async () => {
    setError(null);
    setMessage(null);

    if (!referralCode.trim()) {
      setError('Referral code is required');
      return;
    }

    if (!brandName.trim() && !logoUrl.trim()) {
      setError('Please provide brand name or logo URL');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/institute/${encodeURIComponent(referralCode.trim())}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-branding-key': brandingKey,
        },
        body: JSON.stringify({
          name: brandName,
          logoUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to update branding');
      }

      setMessage('Branding updated. Use your referral URL to view the white-labeled homepage.');
      setBrandName(data?.institute?.name || brandName);
      setLogoUrl(data?.institute?.logoUrl || logoUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update branding');
    } finally {
      setLoading(false);
    }
  };

  const referralUrl = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${encodeURIComponent(referralCode)}`
    : '';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Institute Branding Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Referral Code</Label>
              <input
                className="w-full border rounded-md p-2"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="e.g. ALLEN001"
              />
            </div>

            <div className="space-y-2">
              <Label>Branding Admin Key</Label>
              <input
                className="w-full border rounded-md p-2"
                value={brandingKey}
                onChange={(e) => setBrandingKey(e.target.value)}
                placeholder="Enter branding admin key"
                type="password"
              />
            </div>

            <div className="space-y-2">
              <Label>Brand Name</Label>
              <input
                className="w-full border rounded-md p-2"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Your coaching center name"
              />
            </div>

            <div className="space-y-2">
              <Label>Brand Logo URL</Label>
              <input
                className="w-full border rounded-md p-2"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://.../logo.png"
              />
            </div>

            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Branding'}
            </Button>

            {message && <p className="text-sm text-green-700">{message}</p>}
            {error && <p className="text-sm text-red-700">{error}</p>}

            {referralUrl && (
              <div className="pt-2 text-sm">
                <p className="font-medium">Referral URL (share with students):</p>
                <p className="text-blue-700 break-all">{referralUrl}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Brand logo" className="h-10 w-10 object-contain" />
              ) : (
                <div className="h-10 w-10 rounded bg-gray-200" />
              )}
              <div>
                <p className="font-semibold">{brandName || 'Your Brand Name'}</p>
                <p className="text-xs text-gray-600">White-labeled homepage view</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
