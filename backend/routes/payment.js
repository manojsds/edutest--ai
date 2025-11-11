const express = require('express');
const router = express.Router();

// Payment endpoints are disabled during testing. Re-enable when Razorpay keys are available.
router.post('/create-order', (req, res) => {
  res.status(501).json({ message: 'Payment service is disabled for testing' });
});

router.post('/verify', (req, res) => {
  res.status(501).json({ message: 'Payment verification is disabled for testing' });
});

module.exports = router;