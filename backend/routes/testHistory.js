const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const TestHistory = require('../models/TestHistory');
const User = require('../models/User');
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * POST /api/tests/save
 * Save a completed test result and update user stats
 */
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const {
      subject,
      topic,
      examType,
      userAnswers,
      correctAnswers,
      totalQuestions,
      correctCount,
      wrongCount,
      skippedCount,
      score,
      timeSpent,
      timeLimit,
      weakTopics,
    } = req.body;

    if (!subject || !topic || !Array.isArray(userAnswers)) {
      return res.status(400).json({ error: 'Missing required fields: subject, topic, userAnswers' });
    }

    const historyData = {
      userId: req.userId,
      instituteId: req.user.instituteId || null,
      subject,
      topic,
      examType: examType || 'practice',
      userAnswers,
      correctAnswers: correctAnswers || [],
      totalQuestions: totalQuestions || userAnswers.length,
      correctCount: correctCount || 0,
      wrongCount: wrongCount || 0,
      skippedCount: skippedCount || 0,
      score: score || 0,
      timeSpent: timeSpent || 0,
      timeLimit: timeLimit || 3600,
      weakTopics: weakTopics || [],
    };

    const saved = await TestHistory.create(historyData);

    // Update user stats
    await User.updateTestStats(
      req.userId,
      historyData.totalQuestions,
      historyData.correctCount,
      historyData.score
    );

    // Update daily test count for rate limiting
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    await db.collection('users').doc(req.userId).update({
      [`dailyTests.${today}`]: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ success: true, testId: saved.id });
  } catch (error) {
    console.error('Save test error:', error);
    res.status(500).json({ error: 'Failed to save test', message: error.message });
  }
});

/**
 * GET /api/tests/history
 * Get current user's test history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const history = await TestHistory.findByUserId(req.userId, limit);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get test history' });
  }
});

/**
 * GET /api/tests/performance
 * Get topic-wise performance for current user
 */
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const topicPerformance = await TestHistory.getTopicPerformance(req.userId);

    // Sort by average score ascending (weakest first)
    const sorted = topicPerformance.sort((a, b) => a.averageScore - b.averageScore);

    const weakTopics = sorted.filter(t => t.averageScore < 60);
    const strongTopics = sorted.filter(t => t.averageScore >= 70).reverse();

    res.json({
      success: true,
      topicPerformance: sorted,
      weakTopics: weakTopics.slice(0, 5),
      strongTopics: strongTopics.slice(0, 5),
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({ error: 'Failed to get performance data' });
  }
});

/**
 * GET /api/tests/daily-status
 * Check how many tests the user has taken today (for free tier gate)
 */
router.get('/daily-status', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const userDoc = await db.collection('users').doc(req.userId).get();
    const userData = userDoc.data();

    const dailyCount = userData?.dailyTests?.[today] || 0;
    const subscriptionStatus = userData?.subscriptionStatus || 'trial';
    const subscriptionExpiry = userData?.subscriptionExpiryDate;

    // Determine if subscription is still valid
    let isSubscriptionActive = false;
    if (subscriptionStatus === 'active') {
      isSubscriptionActive = true;
    } else if (subscriptionStatus === 'trial') {
      if (subscriptionExpiry) {
        isSubscriptionActive = new Date(subscriptionExpiry) > new Date();
      } else {
        isSubscriptionActive = true; // No expiry set = still in trial
      }
    }

    // Free tier: 1 test per day. Paid/trial: unlimited
    const dailyLimit = isSubscriptionActive ? null : 1; // null = unlimited
    const canTakeTest = dailyLimit === null || dailyCount < dailyLimit;

    res.json({
      success: true,
      dailyCount,
      dailyLimit,
      canTakeTest,
      subscriptionStatus,
      isSubscriptionActive,
      daysLeft: subscriptionExpiry
        ? Math.max(0, Math.ceil((new Date(subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24)))
        : null,
    });
  } catch (error) {
    console.error('Daily status error:', error);
    res.status(500).json({ error: 'Failed to get daily status' });
  }
});

module.exports = router;
