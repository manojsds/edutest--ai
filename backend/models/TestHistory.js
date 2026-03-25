const { db } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * TestHistory Model  - Optimized for storage
 * Collection: test_history
 */
class TestHistory {
  /**
   * Save test result (optimized storage)
   */
  static async create(data) {
    const historyRef = db.collection('test_history').doc();
    
    // Optimize storage: only store question IDs and user answers (not full questions)
    const historyData = {
      id: historyRef.id,
      userId: data.userId,
      instituteId: data.instituteId || null,
      
      // Test details
      subject: data.subject,
      topic: data.topic,
      examType: data.examType || 'practice',
      
      // Results (compact format)
      questionIds: data.questionIds || [], // Array of question IDs
      userAnswers: data.userAnswers || [], // Array of answer indices [2, 0, 1, 3...]
      correctAnswers: data.correctAnswers || [], // Array of correct indices
      
      // Summary
      totalQuestions: data.totalQuestions || data.userAnswers?.length || 0,
      correctCount: data.correctCount || 0,
      wrongCount: data.wrongCount || 0,
      skippedCount: data.skippedCount || 0,
      score: data.score || 0, // Percentage
      
      // Time tracking
      timeSpent: data.timeSpent || 0, // in seconds
      timeLimit: data.timeLimit || 3600, // in seconds
      
      // Metadata
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await historyRef.set(historyData);
    return { id: historyRef.id, ...historyData };
  }

  /**
   * Get user's test history
   */
  static async findByUserId(userId, limit = 50) {
    const snapshot = await db.collection('test_history')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Get test history by institute
   */
  static async findByInstituteId(instituteId, limit = 100) {
    const snapshot = await db.collection('test_history')
      .where('instituteId', '==', instituteId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Get user's performance by topic
   */
  static async getTopicPerformance(userId) {
    const tests = await TestHistory.findByUserId(userId, 200);
    
    const topicStats = {};
    tests.forEach(test => {
      const topic = test.topic;
      if (!topicStats[topic]) {
        topicStats[topic] = {
          topic: topic,
          testsAttempted: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          averageScore: 0,
          totalTimeSpent: 0
        };
      }
      
      topicStats[topic].testsAttempted += 1;
      topicStats[topic].totalQuestions += test.totalQuestions;
      topicStats[topic].correctAnswers += test.correctCount;
      topicStats[topic].totalTimeSpent += test.timeSpent;
    });
    
    // Calculate averages
    Object.values(topicStats).forEach(stat => {
      stat.averageScore = Math.round(
        (stat.correctAnswers / stat.totalQuestions) * 100
      );
    });
    
    return Object.values(topicStats);
  }

  /**
   * Get institute analytics
   */
  static async getInstituteAnalytics(instituteId) {
    const tests = await TestHistory.findByInstituteId(instituteId, 1000);
    
    const analytics = {
      totalTests: tests.length,
      totalQuestions: 0,
      averageScore: 0,
      topTopics: {},
      activeStudents: new Set()
    };
    
    tests.forEach(test => {
      analytics.totalQuestions += test.totalQuestions;
      analytics.averageScore += test.score;
      analytics.activeStudents.add(test.userId);
      
      // Track popular topics
      if (!analytics.topTopics[test.topic]) {
        analytics.topTopics[test.topic] = 0;
      }
      analytics.topTopics[test.topic] += 1;
    });
    
    analytics.averageScore = Math.round(analytics.averageScore / tests.length) || 0;
    analytics.activeStudentsCount = analytics.activeStudents.size;
    delete analytics.activeStudents;
    
    // Sort topics by popularity
    analytics.topTopics = Object.entries(analytics.topTopics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));
    
    return analytics;
  }
}

module.exports = TestHistory;
