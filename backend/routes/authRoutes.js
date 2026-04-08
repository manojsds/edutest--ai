const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebase');
const User = require('../models/User');
const Institute = require('../models/Institute');
const { authenticateToken } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days

/**
 * Generate JWT token
 */
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, referralCode, enrollmentNumber } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Name, email, and password are required'
      });
    }

    // Check if email already exists
    const existingUser = await User.emailExists(email);
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email already registered',
        message: 'Please use a different email or login'
      });
    }

    // If referral code provided, validate and get institute
    let instituteId = null;
    let instituteData = null;
    
    if (referralCode && referralCode !== 'direct') {
      instituteData = await Institute.findByReferralCode(referralCode);
      if (!instituteData) {
        return res.status(400).json({ 
          error: 'Invalid referral code',
          message: 'The referral code you entered is not valid'
        });
      }
      instituteId = instituteData.id;
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      instituteId,
      referralCode: referralCode || 'direct',
      enrollmentNumber,
      role: 'student',
      subscriptionStatus: 'trial', // 7-day trial for all new users
      subscriptionExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    const user = await User.create(userData);

    // Increment institute student count if applicable
    if (instituteId) {
      await Institute.incrementStudentCount(instituteId);
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        instituteId: user.instituteId,
        subscriptionStatus: user.subscriptionStatus
      },
      institute: instituteData ? {
        id: instituteData.id,
        name: instituteData.name,
        logoUrl: instituteData.logoUrl,
        primaryColor: instituteData.primaryColor
      } : null
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: 'Signup failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, referralCode } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    // Find user
    let user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last login time
    await User.updateLastLogin(user.id);

    // Validate or link institute based on referral code
    let instituteData = null;
    if (referralCode && referralCode !== 'direct') {
      instituteData = await Institute.findByReferralCode(referralCode);
      if (!instituteData) {
        return res.status(400).json({
          error: 'Invalid referral code',
          message: 'The referral code you entered is not valid'
        });
      }

      if (user.instituteId && user.instituteId !== instituteData.id) {
        return res.status(403).json({
          error: 'Referral mismatch',
          message: 'This account is mapped to a different coaching center'
        });
      }

      if (!user.instituteId) {
        await User.update(user.id, {
          instituteId: instituteData.id,
          referralCode
        });
        await Institute.incrementStudentCount(instituteData.id);
        user = await User.findByEmail(email);
      }
    }

    if (!instituteData && user.instituteId) {
      instituteData = await Institute.findById(user.instituteId);
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        instituteId: user.instituteId,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiryDate: user.subscriptionExpiryDate,
        testsAttempted: user.testsAttempted,
        averageScore: user.averageScore
      },
      institute: instituteData ? {
        id: instituteData.id,
        name: instituteData.name,
        referralCode: instituteData.referralCode,
        logoUrl: instituteData.logoUrl,
        primaryColor: instituteData.primaryColor,
        secondaryColor: instituteData.secondaryColor,
        accentColor: instituteData.accentColor
      } : null
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify JWT token and get user data
 */
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Get institute data if user belongs to one
    let instituteData = null;
    if (req.user.instituteId) {
      instituteData = await Institute.findById(req.user.instituteId);
    }

    res.json({
      success: true,
      user: req.user,
      institute: instituteData ? {
        id: instituteData.id,
        name: instituteData.name,
        logoUrl: instituteData.logoUrl,
        primaryColor: instituteData.primaryColor,
        secondaryColor: instituteData.secondaryColor,
        accentColor: instituteData.accentColor
      } : null
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * GET /api/auth/profile
 * Get current user's profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, profilePicture } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const updatedUser = await User.update(req.user.id, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/auth/google-signin
 * Sign in or create user via Google OAuth
 */
router.post('/google-signin', async (req, res) => {
  try {
    const { idToken, referralCode } = req.body;

    // Validation
    if (!idToken) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'idToken is required'
      });
    }

    // Verify the Firebase token server-side so user identity cannot be spoofed.
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;
    const name = decodedToken.name || 'User';
    const picture = decodedToken.picture || null;

    if (!email || !firebaseUid) {
      return res.status(401).json({
        error: 'Invalid Google token',
        message: 'Token does not contain required user details'
      });
    }

    // Check if user exists
    let user = await User.findByEmail(email);

    if (user) {
      if (user.firebaseUid && user.firebaseUid !== firebaseUid) {
        return res.status(403).json({
          error: 'Account conflict',
          message: 'This email is already linked to another Google account'
        });
      }

      if (!user.firebaseUid) {
        user = await User.update(user.id, {
          firebaseUid,
          authType: 'google',
          profilePicture: user.profilePicture || picture
        });
      }

      // User exists, update last login
      await User.updateLastLogin(user.id);
    } else {
      // Create new user
      let instituteId = null;
      let instituteData = null;
      
      if (referralCode && referralCode !== 'direct') {
        instituteData = await Institute.findByReferralCode(referralCode);
        if (!instituteData) {
          return res.status(400).json({ 
            error: 'Invalid referral code',
            message: 'The referral code you entered is not valid'
          });
        }
        instituteId = instituteData.id;
      }

      // Create user via Google OAuth (no password)
      const userData = {
        name,
        email,
        password: null, // No password for OAuth users
        firebaseUid,
        picture,
        instituteId,
        referralCode: referralCode || 'direct',
        role: 'student',
        subscriptionStatus: 'trial',
        subscriptionExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      user = await User.create(userData);

      // Increment institute student count if applicable
      if (instituteId) {
        await Institute.incrementStudentCount(instituteId);
      }
    }

    // Get institute data if user belongs to one
    let instituteData = null;
    if (user.instituteId) {
      instituteData = await Institute.findById(user.instituteId);
    }

    // Generate JWT token using firebase ID token as bearer
    const token = generateToken(user.id, user.email);

    res.status(200).json({
      success: true,
      message: 'Google sign-in successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        instituteId: user.instituteId,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiryDate: user.subscriptionExpiryDate
      },
      institute: instituteData ? {
        id: instituteData.id,
        name: instituteData.name,
        referralCode: instituteData.referralCode,
        logoUrl: instituteData.logoUrl,
        primaryColor: instituteData.primaryColor,
        secondaryColor: instituteData.secondaryColor,
        accentColor: instituteData.accentColor
      } : null
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ 
      error: 'Google sign-in failed',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/user-profile
 * Get current user profile from JWT token
 */
router.get('/user-profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get institute data if user belongs to one
    let instituteData = null;
    if (user.instituteId) {
      instituteData = await Institute.findById(user.instituteId);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        instituteId: user.instituteId,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiryDate: user.subscriptionExpiryDate,
        testsAttempted: user.testsAttempted,
        averageScore: user.averageScore
      },
      institute: instituteData ? {
        id: instituteData.id,
        name: instituteData.name,
        referralCode: instituteData.referralCode,
        logoUrl: instituteData.logoUrl,
        primaryColor: instituteData.primaryColor,
        secondaryColor: instituteData.secondaryColor,
        accentColor: instituteData.accentColor
      } : null
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/institute/:referralCode
 * Get institute details by referral code (public endpoint)
 */
router.get('/institute/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params;
    
    const institute = await Institute.findByReferralCode(referralCode);
    if (!institute) {
      return res.status(404).json({ 
        error: 'Institute not found',
        message: 'Invalid referral code'
      });
    }

    res.json({
      success: true,
      institute: {
        id: institute.id,
        name: institute.name,
        logoUrl: institute.logoUrl,
        primaryColor: institute.primaryColor,
        secondaryColor: institute.secondaryColor,
        accentColor: institute.accentColor,
        subdomain: institute.subdomain
      }
    });
  } catch (error) {
    console.error('Get institute error:', error);
    res.status(500).json({ error: 'Failed to get institute details' });
  }
});

/**
 * PUT /api/auth/institute/:referralCode/branding
 * Update institute branding (name + logo) by referral code
 * NOTE: Lightweight MVP endpoint. Add proper admin auth for production hardening.
 */
router.put('/institute/:referralCode/branding', async (req, res) => {
  try {
    const brandingAdminKey = process.env.BRANDING_ADMIN_KEY;
    if (!brandingAdminKey && process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        error: 'Branding endpoint is not configured',
        message: 'Missing BRANDING_ADMIN_KEY in environment'
      });
    }

    if (brandingAdminKey) {
      const providedKey = req.headers['x-branding-key'];
      if (providedKey !== brandingAdminKey) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid branding key'
        });
      }
    }

    const { referralCode } = req.params;
    const { name, logoUrl } = req.body;

    if (!name && !logoUrl) {
      return res.status(400).json({
        error: 'Missing fields',
        message: 'Provide at least one field: name or logoUrl'
      });
    }

    const institute = await Institute.findByReferralCode(referralCode);
    if (!institute) {
      return res.status(404).json({
        error: 'Institute not found',
        message: 'Invalid referral code'
      });
    }

    const updateData = {};
    if (typeof name === 'string' && name.trim().length > 0) {
      updateData.name = name.trim();
    }
    if (typeof logoUrl === 'string') {
      updateData.logoUrl = logoUrl.trim() || null;
    }

    const updated = await Institute.update(institute.id, updateData);

    res.json({
      success: true,
      message: 'Branding updated successfully',
      institute: {
        id: updated.id,
        name: updated.name,
        referralCode: updated.referralCode,
        logoUrl: updated.logoUrl,
        primaryColor: updated.primaryColor,
        secondaryColor: updated.secondaryColor,
        accentColor: updated.accentColor,
      }
    });
  } catch (error) {
    console.error('Update branding error:', error);
    res.status(500).json({
      error: 'Failed to update branding',
      message: error.message
    });
  }
});

module.exports = router;
