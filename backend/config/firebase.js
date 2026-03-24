const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(__dirname, '../edutest-477409-36c78304375d.json');

try {
  let serviceAccount = null;

  // Preferred for cloud deploys (Render/Vercel): set full JSON in env var.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
  } else {
    throw new Error(
      'Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_KEY env var or provide GOOGLE_APPLICATION_CREDENTIALS file path.'
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
  process.exit(1);
}

// Firestore database instance
const db = admin.firestore();

// Cloud Storage bucket
const bucket = admin.storage().bucket();

module.exports = {
  admin,
  db,
  bucket
};
