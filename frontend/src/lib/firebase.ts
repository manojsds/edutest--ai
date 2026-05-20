import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase config from environment variables (same project as backend)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const hasValidFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId &&
  !String(firebaseConfig.apiKey).includes('your-') &&
  !String(firebaseConfig.authDomain).includes('your-') &&
  !String(firebaseConfig.projectId).includes('your-') &&
  !String(firebaseConfig.appId).includes('your-')
);

// Initialize Firebase only when the config is real.
const app = hasValidFirebaseConfig ? initializeApp(firebaseConfig) : null;

// Initialize Firebase Authentication and get a reference to the service
export const auth = app ? getAuth(app) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;

// Customize OAuth experience
if (googleProvider) {
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
}

export default app;
