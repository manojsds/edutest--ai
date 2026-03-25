const { db } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * Institute (Coaching Center) Model
 * Collection: institutes
 */
class Institute {
  /**
   * Create a new institute
   */
  static async create(data) {
    const instituteRef = db.collection('institutes').doc();
    const instituteData = {
      id: instituteRef.id,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      referralCode: data.referralCode,
      
      // Branding
      logoUrl: data.logoUrl || null,
      primaryColor: data.primaryColor || '#4F46E5', // Indigo-600
      secondaryColor: data.secondaryColor || '#818CF8', // Indigo-400
      accentColor: data.accentColor || '#10B981', // Green-500
      subdomain: data.subdomain || null, // e.g., 'allen'
      customDomain: data.customDomain || null,
      
      // Business
      commissionPercentage: data.commissionPercentage || 10,
      planType: data.planType || 'standard', // standard, premium, enterprise
      status: data.status || 'active', // active, suspended, trial
      
      // Stats
      studentCount: 0,
      totalRevenue: 0,
      commissionEarned: 0,
      
      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await instituteRef.set(instituteData);
    return { id: instituteRef.id, ...instituteData };
  }

  /**
   * Find institute by ID
   */
  static async findById(id) {
    const doc = await db.collection('institutes').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  /**
   * Find institute by referral code
   */
  static async findByReferralCode(referralCode) {
    const snapshot = await db.collection('institutes')
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Find institute by subdomain
   */
  static async findBySubdomain(subdomain) {
    const snapshot = await db.collection('institutes')
      .where('subdomain', '==', subdomain)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Update institute
   */
  static async update(id, data) {
    const updateData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('institutes').doc(id).update(updateData);
    return await Institute.findById(id);
  }

  /**
   * Increment student count
   */
  static async incrementStudentCount(id) {
    await db.collection('institutes').doc(id).update({
      studentCount: admin.firestore.FieldValue.increment(1)
    });
  }

  /**
   * Add revenue and commission
   */
  static async addRevenue(id, amount, commission) {
    await db.collection('institutes').doc(id).update({
      totalRevenue: admin.firestore.FieldValue.increment(amount),
      commissionEarned: admin.firestore.FieldValue.increment(commission)
    });
  }

  /**
   * Get all institutes
   */
  static async getAll(limit = 50) {
    const snapshot = await db.collection('institutes')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = Institute;
