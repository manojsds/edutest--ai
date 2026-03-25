const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT token
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    
    jwt.verify(token, jwtSecret, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      // Get user from database
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      req.user = user;
      req.userId = user.id;
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to check if user is an admin
 */
function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Middleware to check if user is institute admin
 */
function requireInstituteAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Institute admin access required' });
  }
  next();
}

/**
 * Middleware to check active subscription
 */
function requireActiveSubscription(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { subscriptionStatus, subscriptionExpiryDate } = req.user;
  
  // Allow if subscription is active or trial
  if (subscriptionStatus === 'active' || subscriptionStatus === 'trial') {
    // Check expiry date if it exists
    if (subscriptionExpiryDate) {
      const expiryDate = new Date(subscriptionExpiryDate);
      if (expiryDate < new Date()) {
        return res.status(403).json({ 
          error: 'Subscription expired',
          message: 'Please renew your subscription to continue'
        });
      }
    }
    return next();
  }

  return res.status(403).json({ 
    error: 'Active subscription required',
    message: 'Please subscribe to access this feature'
  });
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireInstituteAdmin,
  requireActiveSubscription
};
