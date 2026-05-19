const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

try {
  let serviceAccount = null;

  // Preferred for cloud deploys (Render/Vercel): set full JSON in env var.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    serviceAccount = JSON.parse(rawKey);
  } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
  } else {
    throw new Error(
      'Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_KEY or set GOOGLE_APPLICATION_CREDENTIALS to a valid file path.'
    );
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  });

  console.log('✅ Firebase Admin initialized successfully');
  console.log(`📦 Project: ${serviceAccount.project_id}`);
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.error('⚠️  Server will continue without Firebase. Auth routes will not work.');
  // Do NOT exit — allow the questions/explain endpoints to still serve
}

// Firestore database instance
let db = null;
let bucket = null;

try {
  if (admin.apps && admin.apps.length > 0) {
    db = admin.firestore();
    bucket = admin.storage().bucket();
  } else {
    console.warn('⚠️  Firebase not initialized; skipping Firestore and Storage setup.');
  }
} catch (e) {
  console.warn('⚠️  Firebase services unavailable:', e.message);
}

module.exports = {
  admin,
  db,
  bucket
};
