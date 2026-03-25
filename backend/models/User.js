const { db } = require('../config/firebase');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

/**
 * User (Student/Admin) Model
 * Collection: users
 */
class User {
  /**
   * Create a new user
   */
  static async create(data) {
    const userRef = db.collection('users').doc();
    
    // Hash password only if provided (OAuth users won't have password)
    let hashedPassword = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }
    
    const userData = {
      id: userRef.id,
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword, // null for OAuth users
      firebaseUid: data.firebaseUid || null,
      
      // Institute association
      instituteId: data.instituteId || null,
      referralCode: data.referralCode || 'direct',
      enrollmentNumber: data.enrollmentNumber || null,
      
      // Role
      role: data.role || 'student', // student, admin, super_admin
      
      // Subscription
      subscriptionStatus: data.subscriptionStatus || 'trial', // trial, active, expired, cancelled
      subscriptionPlanId: data.subscriptionPlanId || null,
      subscriptionExpiryDate: data.subscriptionExpiryDate || null,
      
      // Profile
      phone: data.phone || null,
      profilePicture: data.picture || data.profilePicture || null,
      
      // Stats
      testsAttempted: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      averageScore: 0,
      
      // Auth type
      authType: data.firebaseUid ? 'google' : 'email', // google or email
      
      // Metadata
      lastLoginAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData);
    
    // Remove password from returned object
    const { password, ...userWithoutPassword } = userData;
    return { id: userRef.id, ...userWithoutPassword };
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const snapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Find user by Firebase UID
   */
  static async findByFirebaseUid(firebaseUid) {
    const snapshot = await db.collection('users')
      .where('firebaseUid', '==', firebaseUid)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return null;
    
    const userData = { id: doc.id, ...doc.data() };
    // Remove password from returned object
    delete userData.password;
    return userData;
  }

  /**
   * Find users by institute ID
   */
  static async findByInstituteId(instituteId, limit = 100) {
    const snapshot = await db.collection('users')
      .where('instituteId', '==', instituteId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() };
      delete data.password;
      return data;
    });
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    if (!hashedPassword) return false; // OAuth users don't have passwords
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update user
   */
  static async update(id, data) {
    // Don't allow password update through this method
    if (data.password) delete data.password;
    
    const updateData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(id).update(updateData);
    return await User.findById(id);
  }

  /**
   * Update last login time
   */
  static async updateLastLogin(id) {
    await db.collection('users').doc(id).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Update subscription
   */
  static async updateSubscription(id, subscriptionData) {
    await db.collection('users').doc(id).update({
      subscriptionStatus: subscriptionData.status,
      subscriptionPlanId: subscriptionData.planId,
      subscriptionExpiryDate: subscriptionData.expiryDate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Update test statistics
   */
  static async updateTestStats(id, questionsAnswered, correctAnswers, score) {
    const user = await db.collection('users').doc(id).get();
    const userData = user.data();
    
    const newTestsAttempted = (userData.testsAttempted || 0) + 1;
    const newTotalQuestions = (userData.totalQuestions || 0) + questionsAnswered;
    const newCorrectAnswers = (userData.correctAnswers || 0) + correctAnswers;
    const newAverageScore = Math.round(
      ((userData.averageScore || 0) * (userData.testsAttempted || 0) + score) / newTestsAttempted
    );
    
    await db.collection('users').doc(id).update({
      testsAttempted: newTestsAttempted,
      totalQuestions: newTotalQuestions,
      correctAnswers: newCorrectAnswers,
      averageScore: newAverageScore,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Check if email exists
   */
  static async emailExists(email) {
    const user = await User.findByEmail(email);
    return !!user;
  }
}

module.exports = User;
