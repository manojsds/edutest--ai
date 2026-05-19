const express = require('express');
const router = express.Router();
const { authenticateToken, requireInstituteAdmin } = require('../middleware/authMiddleware');
const Institute = require('../models/Institute');
const User = require('../models/User');
const TestHistory = require('../models/TestHistory');
const { db } = require('../config/firebase');

/**
 * All routes here require authentication + institute admin role
 * GET /api/institute/dashboard  - Full dashboard data
 * GET /api/institute/students   - Student list
 * GET /api/institute/analytics  - Test analytics
 * GET /api/institute/commission - Commission summary
 */

/**
 * GET /api/institute/dashboard
 * Full institute dashboard — students, analytics, commission
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Allow institute admins OR super_admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Institute admin access required' });
    }

    // Find the institute this admin belongs to
    let institute = null;
    if (req.user.instituteId) {
      institute = await Institute.findById(req.user.instituteId);
    }
    if (!institute) {
      return res.status(404).json({ error: 'No institute found for this admin' });
    }

    // Get students
    const students = await User.findByInstituteId(institute.id, 200);

    // Get test analytics
    const analytics = await TestHistory.getInstituteAnalytics(institute.id);

    // Commission calculation
    const subscriptionPrice = 270; // ₹270/student/month
    const activeStudents = students.filter(
      s => s.subscriptionStatus === 'active'
    ).length;
    const monthlyRevenue = activeStudents * subscriptionPrice;
    const commissionRate = institute.commissionPercentage || 10;
    const monthlyCommission = Math.round(monthlyRevenue * (commissionRate / 100));

    // Student performance summary
    const studentSummary = students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      subscriptionStatus: s.subscriptionStatus,
      testsAttempted: s.testsAttempted || 0,
      averageScore: s.averageScore || 0,
      lastLoginAt: s.lastLoginAt,
      createdAt: s.createdAt,
    }));

    res.json({
      success: true,
      institute: {
        id: institute.id,
        name: institute.name,
        referralCode: institute.referralCode,
        logoUrl: institute.logoUrl,
        primaryColor: institute.primaryColor,
        commissionPercentage: commissionRate,
        status: institute.status,
      },
      stats: {
        totalStudents: students.length,
        activeStudents,
        trialStudents: students.filter(s => s.subscriptionStatus === 'trial').length,
        expiredStudents: students.filter(s => s.subscriptionStatus === 'expired').length,
        monthlyRevenue,
        monthlyCommission,
        totalCommissionEarned: institute.commissionEarned || 0,
      },
      analytics,
      students: studentSummary,
    });
  } catch (error) {
    console.error('Institute dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard', message: error.message });
  }
});

/**
 * GET /api/institute/students
 * Paginated student list for the institute
 */
router.get('/students', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Institute admin access required' });
    }

    if (!req.user.instituteId) {
      return res.status(404).json({ error: 'No institute found for this admin' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const students = await User.findByInstituteId(req.user.instituteId, limit);

    const studentList = students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      enrollmentNumber: s.enrollmentNumber,
      subscriptionStatus: s.subscriptionStatus,
      subscriptionExpiryDate: s.subscriptionExpiryDate,
      testsAttempted: s.testsAttempted || 0,
      averageScore: s.averageScore || 0,
      totalQuestions: s.totalQuestions || 0,
      correctAnswers: s.correctAnswers || 0,
      lastLoginAt: s.lastLoginAt,
      createdAt: s.createdAt,
    }));

    res.json({ success: true, students: studentList, total: studentList.length });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

/**
 * GET /api/institute/commission
 * Commission summary and payout history
 */
router.get('/commission', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Institute admin access required' });
    }

    if (!req.user.instituteId) {
      return res.status(404).json({ error: 'No institute found for this admin' });
    }

    const institute = await Institute.findById(req.user.instituteId);
    if (!institute) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    const students = await User.findByInstituteId(institute.id, 500);
    const activeStudents = students.filter(s => s.subscriptionStatus === 'active').length;
    const subscriptionPrice = 270;
    const commissionRate = institute.commissionPercentage || 10;

    const monthlyRevenue = activeStudents * subscriptionPrice;
    const monthlyCommission = Math.round(monthlyRevenue * (commissionRate / 100));

    res.json({
      success: true,
      commission: {
        rate: commissionRate,
        activeStudents,
        subscriptionPricePerStudent: subscriptionPrice,
        monthlyRevenue,
        monthlyCommission,
        totalEarned: institute.commissionEarned || 0,
        nextPayoutDate: getNextPayoutDate(),
      },
    });
  } catch (error) {
    console.error('Commission error:', error);
    res.status(500).json({ error: 'Failed to get commission data' });
  }
});

function getNextPayoutDate() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}

module.exports = router;
