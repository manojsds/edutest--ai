# Payment Integration Guide - Cashfree for EduTest AI

## 🎯 Overview

This guide walks you through integrating Cashfree payment gateway for your B2B coaching center subscription model with automatic commission tracking.

---

## 📋 Prerequisites

1. **Cashfree Account**
   - Sign up at: https://www.cashfree.com/
   - Complete KYC verification (1-2 days)
   - Get API credentials (Test & Production)

2. **Business Details Ready**
   - PAN Card
   - GST Number (optional but recommended)
   - Bank account details for settlements

---

## 🔑 Step 1: Get Cashfree API Keys

### Test Environment (Development)
```
1. Log in to Cashfree Dashboard
2. Go to Developers → API Keys
3. Copy:
   - App ID: Test_XXXXXXXXXX
   - Secret Key: test_XXXXXXXXXXXXX
```

### Production Environment (Live)
```
1. Complete KYC verification
2. Go to Developers → API Keys → Production
3. Copy:
   - App ID: XXXXXXXXXX
   - Secret Key: live_XXXXXXXXXXXXX
```

---

## 🛠️ Step 2: Configure Backend

### Update `.env` file

```env
# Cashfree Configuration
CASHFREE_APP_ID=your_app_id_here
CASHFREE_SECRET_KEY=your_secret_key_here
CASHFREE_API_VERSION=2023-08-01
CASHFREE_ENVIRONMENT=TEST  # Change to PRODUCTION for live

# Webhook URL (Cashfree will call this)
CASHFREE_WEBHOOK_URL=https://your-backend.onrender.com/api/payment/webhook
```

---

## 💳 Step 3: Subscription Plans

### Define Your Plans

```javascript
// backend/config/subscriptionPlans.js

const SUBSCRIPTION_PLANS = {
  // B2C Plans (Individual Students)
  b2c_monthly: {
    id: 'b2c_monthly',
    name: 'Monthly Plan',
    amount: 300,  // ₹300
    currency: 'INR',
    interval: 'monthly',
    intervalCount: 1,
    description: 'Unlimited tests for 1 month'
  },
  b2c_quarterly: {
    id: 'b2c_quarterly',
    name: 'Quarterly Plan',
    amount: 799,  // ₹799 (11% discount)
    currency: 'INR',
    interval: 'monthly',
    intervalCount: 3,
    description: 'Unlimited tests for 3 months'
  },
  b2c_yearly: {
    id: 'b2c_yearly',
    name: 'Yearly Plan',
    amount: 2499,  // ₹2,499 (30% discount)
    currency: 'INR',
    interval: 'yearly',
    intervalCount: 1,
    description: 'Unlimited tests for 1 year'
  },

  // B2B Plans (Coaching Centers)
  b2b_student: {
    id: 'b2b_student',
    name: 'Per Student Plan',
    amount: 270,  // ₹270 (coaching center pays)
    currency: 'INR',
    interval: 'monthly',
    intervalCount: 1,
    commission: 30,  // ₹30 to coaching center (10%)
    description: 'Student under coaching center'
  }
};

module.exports = { SUBSCRIPTION_PLANS };
```

---

## 🔌 Step 4: Create Payment Routes

### Create `backend/routes/paymentRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { SUBSCRIPTION_PLANS } = require('../config/subscriptionPlans');

// Cashfree Configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENVIRONMENT || 'TEST';
const CASHFREE_API_URL = CASHFREE_ENV === 'PRODUCTION' 
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

/**
 * POST /api/payment/create-order
 * Create payment order
 */
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const user = req.user;

    // Get plan details
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Create order ID
    const orderId = `order_${Date.now()}_${user.id}`;

    // Prepare Cashfree order
    const orderData = {
      order_id: orderId,
      order_amount: plan.amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: user.id,
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: user.phone || '9999999999'
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment/success?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL}/api/payment/webhook`
      },
      order_note: `Subscription: ${plan.name}`
    };

    // Create order with Cashfree
    const response = await fetch(`${CASHFREE_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': process.env.CASHFREE_API_VERSION
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Payment order creation failed');
    }

    // Save order in database (create Subscription model)
    await db.collection('subscriptions').doc(orderId).set({
      orderId: orderId,
      userId: user.id,
      instituteId: user.instituteId,
      planId: planId,
      amount: plan.amount,
      status: 'pending',
      cashfreeOrderId: result.order_id,
      createdAt: new Date()
    });

    res.json({
      success: true,
      orderId: result.order_id,
      paymentSessionId: result.payment_session_id,
      paymentLink: result.order_url
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment/webhook
 * Cashfree webhook handler
 */
router.post('/webhook', async (req, res) => {
  try {
    const { orderId, orderAmount, txStatus, txMsg } = req.body;

    // Verify signature (important for security)
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    
    // Construct signature string
    const signatureData = timestamp + JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', CASHFREE_SECRET_KEY)
      .update(signatureData)
      .digest('base64');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Payment successful
    if (txStatus === 'SUCCESS') {
      // Get subscription from database
      const subDoc = await db.collection('subscriptions').doc(orderId).get();
      const subscription = subDoc.data();

      // Update user subscription
      await User.updateSubscription(subscription.userId, {
        status: 'active',
        planId: subscription.planId,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      // Update subscription status
      await db.collection('subscriptions').doc(orderId).update({
        status: 'completed',
        txStatus: txStatus,
        txMsg: txMsg,
        completedAt: new Date()
      });

      // Track commission if B2B
      if (subscription.instituteId) {
        const plan = SUBSCRIPTION_PLANS[subscription.planId];
        if (plan.commission) {
          await Institute.addRevenue(
            subscription.instituteId,
            subscription.amount,
            plan.commission
          );
        }
      }
    } else {
      // Payment failed
      await db.collection('subscriptions').doc(orderId).update({
        status: 'failed',
        txStatus: txStatus,
        txMsg: txMsg
      });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payment/status/:orderId
 * Check payment status
 */
router.get('/status/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const subDoc = await db.collection('subscriptions').doc(orderId).get();
    if (!subDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      subscription: subDoc.data()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 🎨 Step 5: Create Frontend Payment Pages

### Pricing Page (`frontend/src/app/pricing/page.tsx`)

```typescript
"use client"

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';

const plans = [
  {
    id: 'b2c_monthly',
    name: 'Monthly',
    price: '₹299',
    duration: '/ month',
    features: [
      'Unlimited test generation',
      'AI explanations',
      'Performance analytics',
      'Test history',
      'Email support'
    ]
  },
  {
    id: 'b2c_quarterly',
    name: 'Quarterly',
    price: '₹799',
    duration: '/ 3 months',
    savings: 'Save 11%',
    popular: true,
    features: [
      'Everything in Monthly',
      'Priority support',
      'Advanced analytics',
      'Custom study plans',
      'Progress reports'
    ]
  },
  {
    id: 'b2c_yearly',
    name: 'Yearly',
    price: '₹2,499',
    duration: '/ year',
    savings: 'Save 30%',
    features: [
      'Everything in Quarterly',
      'Dedicated support',
      'Personalized coaching',
      'Doubt clearing sessions',
      'Certificate of completion'
    ]
  }
];

export default function PricingPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(planId);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      // Redirect to Cashfree payment page
      window.location.href = data.paymentLink;

    } catch (error: any) {
      alert(error.message || 'Payment failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Start your 7-day free trial, no credit card required
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative ${plan.popular ? 'border-indigo-600 border-2 shadow-xl' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="text-4xl font-bold text-indigo-600 mb-1">
                  {plan.price}
                  <span className="text-lg text-gray-600">{plan.duration}</span>
                </div>
                {plan.savings && (
                  <span className="text-green-600 text-sm font-medium">
                    {plan.savings}
                  </span>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full h-12 ${
                    plan.popular 
                      ? 'bg-indigo-600 hover:bg-indigo-700' 
                      : 'bg-gray-800 hover:bg-gray-900'
                  }`}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Get Started'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔒 Step 6: Security Best Practices

### 1. Webhook Signature Verification
```javascript
// Always verify webhook signatures
const signature = req.headers['x-webhook-signature'];
const expectedSignature = crypto
  .createHmac('sha256', CASHFREE_SECRET_KEY)
  .update(signatureData)
  .digest('base64');

if (signature !== expectedSignature) {
  return res.status(400).json({ error: 'Invalid signature' });
}
```

### 2. Environment Variables
```
Never commit:
- CASHFREE_SECRET_KEY
- CASHFREE_APP_ID

Use .env file and .gitignore
```

### 3. HTTPS Only
```
Production webhook URL must be HTTPS:
✅ https://your-backend.com/api/payment/webhook
❌ http://your-backend.com/api/payment/webhook
```

---

## 📊 Step 7: Testing

### Test with Cashfree Sandbox

```
Test Cards:
Card Number: 4242 4242 4242 4242
CVV: Any 3 digits
Expiry: Any future date
OTP: 1234
```

### Test Flow
```
1. Select a plan → Creates order
2. Redirect to Cashfree → Payment page
3. Enter test card → Payment success
4. Webhook triggered → Subscription activated
5. User redirected → Dashboard with active subscription
```

---

## 💰 Commission Tracking

### For B2B Coaching Centers

```javascript
// When payment succeeds
const commissionAmount = plan.amount * (plan.commissionPercentage / 100);

await Institute.addRevenue(instituteId, plan.amount, commissionAmount);

// Store transaction
await db.collection('transactions').add({
  userId: user.id,
  instituteId: instituteId,
  amount: plan.amount,
  commission: commissionAmount,
  planId: plan.id,
  date: new Date()
});
```

---

## 🚀 Go Live Checklist

- [ ] Complete Cashfree KYC
- [ ] Get Production API keys
- [ ] Update .env with production keys
- [ ] Set webhook URL in Cashfree dashboard
- [ ] Test with real card (small amount)
- [ ] Configure settlements (daily/weekly)
- [ ] Set up GST invoice generation
- [ ] Monitor webhook logs

---

## 📞 Support

- **Cashfree Docs**: https://docs.cashfree.com/
- **Integration Support**: support@cashfree.com
- **Dashboard**: https://merchant.cashfree.com/

---

## ✅ Summary

You now have:
✅ Payment integration with Cashfree
✅ Subscription plans (B2C + B2B)
✅ Automatic commission tracking
✅ Webhook handling
✅ Secure payment flow
✅ Test & production setup

**Total setup time: 2-3 hours**
**Cost: 2% transaction fee only (no monthly charges)**

---

**Need help? Contact manojsds for implementation support!**
