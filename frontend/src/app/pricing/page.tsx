'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ArrowLeft, Zap, Shield } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
    Cashfree: any;
  }
}

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: 270,
    duration: '1 month',
    perDay: '₹9/day',
    popular: false,
    features: [
      'Unlimited AI-generated tests',
      'All 15+ exam types (UPSC, JEE, NEET...)',
      'AI explanations for wrong answers',
      'Weak topic analysis',
      'Performance tracking',
    ],
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    price: 720,
    duration: '3 months',
    perDay: '₹8/day',
    popular: true,
    savings: 'Save ₹90',
    features: [
      'Everything in Monthly',
      '10% discount',
      'Current affairs from live news',
      'Exam blueprint matching',
    ],
  },
  {
    id: 'annual',
    label: 'Annual',
    price: 2700,
    duration: '12 months',
    perDay: '₹7.4/day',
    popular: false,
    savings: 'Save ₹540',
    features: [
      'Everything in Quarterly',
      '17% discount',
      'Priority support',
      'Early access to new features',
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, token, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://edutest-ai-2.onrender.com';

  // Load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!user) { router.push('/login'); return; }

    setLoading(true);
    setError(null);

    try {
      const activeToken = token || localStorage.getItem('edutest_auth_token');

      // Step 1: Create order on backend
      const orderRes = await fetch(`${API_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ planId }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

      // Step 2: Open payment modal
      if (orderData.gateway === 'razorpay') {
        await openRazorpay(orderData, planId, activeToken!);
      } else if (orderData.gateway === 'cashfree') {
        await openCashfree(orderData, planId, activeToken!);
      } else {
        throw new Error('Payment gateway not configured. Please contact support.');
      }

    } catch (e: any) {
      setError(e.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const openRazorpay = (orderData: any, planId: string, activeToken: string) => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window.Razorpay === 'undefined') {
        reject(new Error('Payment SDK not loaded. Please refresh and try again.'));
        return;
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amountPaise,
        currency: 'INR',
        name: 'EduTest AI',
        description: orderData.planLabel,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: { color: '#4F46E5' },
        handler: async (response: any) => {
          try {
            // Step 3: Verify payment
            const verifyRes = await fetch(`${API_URL}/api/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${activeToken}`,
              },
              body: JSON.stringify({
                gateway: 'razorpay',
                planId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed');

            await refreshUser();
            setSuccess(true);
            setLoading(false);
            resolve();
          } catch (e: any) {
            setError(e.message);
            setLoading(false);
            reject(e);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            resolve();
          },
        },
      });

      rzp.open();
    });
  };

  const openCashfree = async (orderData: any, planId: string, activeToken: string) => {
    if (typeof window.Cashfree === 'undefined') {
      throw new Error('Payment SDK not loaded. Please refresh and try again.');
    }

    const cashfree = window.Cashfree({
      mode: orderData.cashfreeEnv === 'production' ? 'production' : 'sandbox',
    });

    const result = await cashfree.checkout({
      paymentSessionId: orderData.paymentSessionId,
      redirectTarget: '_modal',
    });

    if (result.error) throw new Error(result.error.message || 'Payment failed');

    if (result.paymentDetails) {
      const verifyRes = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ gateway: 'cashfree', planId, orderId: orderData.orderId }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed');

      await refreshUser();
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-xl">
          <CardContent className="pt-10 pb-10 px-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're subscribed!</h2>
            <p className="text-gray-600 mb-6">
              Unlimited access activated. Start practicing now.
            </p>
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Start Practicing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-8 gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" /> Unlimited Access
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Choose Your Plan</h1>
          <p className="text-gray-600 text-lg">
            All plans include every feature. Cancel anytime.
          </p>
          {user?.subscriptionStatus === 'trial' && (
            <p className="mt-3 text-sm text-indigo-600 font-medium bg-indigo-50 inline-block px-4 py-2 rounded-full">
              🎉 You're on a free trial — subscribe to keep access after it ends
            </p>
          )}
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {PLANS.map(plan => (
            <Card
              key={plan.id}
              className={`relative transition-all ${
                plan.popular
                  ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-500 scale-105'
                  : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  MOST POPULAR
                </div>
              )}
              {plan.savings && !plan.popular && (
                <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {plan.savings}
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.label}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-500 text-sm ml-1">/ {plan.duration}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{plan.perDay}</p>
                {plan.savings && plan.popular && (
                  <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {plan.savings}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 hover:bg-gray-900'}`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
                  ) : (
                    `Subscribe — ₹${plan.price}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-2 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Secure payment via Razorpay · UPI, Cards, Net Banking, Wallets accepted</span>
          </div>
          <p>Questions? Email us at support@edutestai.in</p>
        </div>
      </div>
    </div>
  );
}
