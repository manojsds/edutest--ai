const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fetch = require('node-fetch');
const { authenticateToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Institute = require('../models/Institute');

// ─── Plan definitions ────────────────────────────────────────────────────────
const PLANS = {
  monthly:   { amount: 270,  label: 'Monthly Plan',              durationDays: 30  },
  quarterly: { amount: 720,  label: 'Quarterly Plan (10% off)',  durationDays: 90  },
  annual:    { amount: 2700, label: 'Annual Plan (17% off)',      durationDays: 365 },
};

// ─── Razorpay config ─────────────────────────────────────────────────────────
const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// ─── Cashfree config (fallback) ───────────────────────────────────────────────
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV    = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
const CASHFREE_BASE   = CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// ─── GET /api/plans ───────────────────────────────────────────────────────────
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: Object.entries(PLANS).map(([id, plan]) => ({ id, ...plan, currency: 'INR' })),
    gateway: RAZORPAY_KEY_ID ? 'razorpay' : CASHFREE_APP_ID ? 'cashfree' : 'none',
  });
});

// ─── POST /api/create-order ───────────────────────────────────────────────────
/**
 * Creates a payment order via Razorpay (preferred) or Cashfree (fallback).
 * Returns the data the frontend needs to open the payment modal.
 */
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const { planId = 'monthly' } = req.body;
    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan. Choose: monthly, quarterly, annual' });
    }

    // ── Razorpay ──────────────────────────────────────────────────────────────
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: plan.amount * 100, // paise
          currency: 'INR',
          receipt: `EDU_${req.userId.slice(0, 8)}_${Date.now()}`,
          notes: {
            userId: req.userId,
            planId,
            userEmail: req.user.email,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Razorpay order error:', data);
        return res.status(502).json({ error: 'Payment gateway error', details: data.error?.description });
      }

      return res.json({
        success: true,
        gateway: 'razorpay',
        orderId: data.id,
        amount: plan.amount,
        amountPaise: plan.amount * 100,
        currency: 'INR',
        planLabel: plan.label,
        planId,
        keyId: RAZORPAY_KEY_ID,
        prefill: {
          name: req.user.name,
          email: req.user.email,
          contact: req.user.phone || '',
        },
      });
    }

    // ── Cashfree fallback ─────────────────────────────────────────────────────
    if (CASHFREE_APP_ID && CASHFREE_SECRET) {
      const orderId = `EDU_${req.userId.slice(0, 8)}_${Date.now()}`;
      const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback?order_id={order_id}`;

      const response = await fetch(`${CASHFREE_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': process.env.CASHFREE_API_VERSION || '2023-08-01',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET,
        },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: plan.amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: req.userId,
            customer_name: req.user.name,
            customer_email: req.user.email,
            customer_phone: req.user.phone || '9999999999',
          },
          order_meta: { return_url: returnUrl },
          order_note: `EduTest AI - ${plan.label}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(502).json({ error: 'Payment gateway error', details: data.message });
      }

      return res.json({
        success: true,
        gateway: 'cashfree',
        orderId: data.order_id,
        paymentSessionId: data.payment_session_id,
        amount: plan.amount,
        planLabel: plan.label,
        planId,
        cashfreeEnv: CASHFREE_ENV,
      });
    }

    // No gateway configured
    return res.status(503).json({
      error: 'Payment not configured',
      message: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.',
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create payment order', message: error.message });
  }
});

// ─── POST /api/verify ─────────────────────────────────────────────────────────
/**
 * Verify payment signature and activate subscription.
 * Called after Razorpay/Cashfree payment completes.
 */
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { gateway, planId = 'monthly' } = req.body;
    const plan = PLANS[planId] || PLANS.monthly;

    // ── Razorpay verification ─────────────────────────────────────────────────
    if (gateway === 'razorpay' || RAZORPAY_KEY_ID) {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing Razorpay payment details' });
      }

      // Verify signature
      const expectedSig = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSig !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment signature verification failed' });
      }
    }

    // ── Cashfree verification ─────────────────────────────────────────────────
    if (gateway === 'cashfree' && CASHFREE_APP_ID) {
      const { orderId } = req.body;
      const response = await fetch(`${CASHFREE_BASE}/orders/${orderId}`, {
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET,
        },
      });
      const data = await response.json();
      if (data.order_status !== 'PAID') {
        return res.status(400).json({ error: 'Payment not completed', status: data.order_status });
      }
    }

    // ── Activate subscription ─────────────────────────────────────────────────
    const expiryDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

    await User.updateSubscription(req.userId, {
      status: 'active',
      planId,
      expiryDate: expiryDate.toISOString(),
    });

    // Credit commission to institute
    if (req.user.instituteId) {
      const institute = await Institute.findById(req.user.instituteId);
      if (institute) {
        const commissionRate = institute.commissionPercentage || 10;
        const commission = Math.round(plan.amount * (commissionRate / 100));
        await Institute.addRevenue(req.user.instituteId, plan.amount, commission);
      }
    }

    res.json({
      success: true,
      message: 'Subscription activated',
      subscriptionStatus: 'active',
      expiryDate: expiryDate.toISOString(),
      planLabel: plan.label,
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Payment verification failed', message: error.message });
  }
});

// ─── POST /api/webhook/razorpay ───────────────────────────────────────────────
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody   = req.body.toString();

    if (RAZORPAY_KEY_SECRET && signature) {
      const expectedSig = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSig) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = JSON.parse(rawBody);
    console.log('Razorpay webhook:', event.event);

    if (event.event === 'payment.captured') {
      const notes  = event.payload?.payment?.entity?.notes || {};
      const userId = notes.userId;
      const planId = notes.planId || 'monthly';

      if (userId) {
        const plan       = PLANS[planId] || PLANS.monthly;
        const expiryDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

        await User.updateSubscription(userId, {
          status: 'active',
          planId,
          expiryDate: expiryDate.toISOString(),
        });

        // Credit commission
        const user = await User.findById(userId);
        if (user?.instituteId) {
          const institute = await Institute.findById(user.instituteId);
          if (institute) {
            const commission = Math.round(plan.amount * ((institute.commissionPercentage || 10) / 100));
            await Institute.addRevenue(user.instituteId, plan.amount, commission);
          }
        }

        console.log(`✅ Subscription activated via webhook for user ${userId}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
