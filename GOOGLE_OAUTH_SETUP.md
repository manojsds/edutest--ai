# Google OAuth Setup Guide

## 🔧 Setup Firebase for Google Authentication

### Step 1: Enable Google Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **edutest-477409**
3. Navigate to **Authentication** (left sidebar)
4. Click on **Sign-in method** tab
5. Click on **Google** provider
6. Toggle **Enable**
7. Set **Project support email** (your email address)
8. Click **Save**

### Step 2: Get Firebase Web App Credentials

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. If you don't have a web app yet:
   - Click **Add app** button
   - Select **Web** (</> icon)
   - Give it a nickname: "EduTest Frontend"
   - Check "Also set up Firebase Hosting" (optional)
   - Click **Register app**
4. Copy the `firebaseConfig` object values

### Step 3: Update Frontend Environment Variables

Open `frontend/.env.local` and replace these values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy... (from firebaseConfig.apiKey)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=edutest-477409.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=edutest-477409
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=edutest-477409.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789 (from firebaseConfig.messagingSenderId)
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123 (from firebaseConfig.appId)
```

### Step 4: Configure Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings** tab
2. Scroll to **Authorized domains**
3. Add your domains:
   - `localhost` (already added by default)
   - `127.0.0.1` (if testing locally)
   - Your Vercel deployment domain (e.g., `edutest-ai.vercel.app`)
   - Your custom domain (if you have one)

### Step 5: Test the Integration

1. Stop and restart the frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Visit `http://localhost:3000/login`

3. Click "Continue with Google"

4. You should be redirected to Google's sign-in page

5. After signing in, you'll be redirected back with authentication complete

## 🎯 Expected Flow

### B2C Flow (No Referral Code)
```
User visits: /login
↓
Clicks "Continue with Google"
↓
Redirects to Google Sign-In
↓
User selects Google account
↓
Redirects back to app
↓
Backend creates user record
↓
Redirects to: /dashboard/home (B2C independent student)
```

### B2B Flow (With Referral Code)
```
User visits: /login?ref=ALLEN2024
↓
Clicks "Continue with Google"
↓
Referral code stored in sessionStorage
↓
Redirects to Google Sign-In
↓
User selects Google account
↓
Redirects back to app
↓
Backend creates user + links to institute
↓
Redirects to: /dashboard/institute?ref=ALLEN2024 (B2B coaching center student)
```

## 🐛 Troubleshooting

### Issue: "Error (auth/popup-blocked)"
**Solution**: We switched from popup to redirect method. Restart dev server.

### Issue: "Firebase: Error (auth/invalid-api-key)"
**Solution**: Make sure you copied the correct API key from Firebase Console.

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution**: Add your domain to Authorized domains in Firebase Console.

### Issue: "Backend returns 500 error"
**Solution**: 
1. Make sure backend is running: `cd backend && npm start`
2. Check backend logs for errors
3. Verify Firebase Admin SDK is initialized

### Issue: User redirected but not logged in
**Solution**:
1. Check browser console for errors
2. Verify API_URL in frontend/.env.local
3. Make sure backend /api/auth/google-signin endpoint is working

## 📝 Testing Checklist

- [ ] Google Sign-In provider enabled in Firebase Console
- [ ] Web app credentials added to frontend/.env.local
- [ ] Authorized domains configured
- [ ] Backend server running on http://localhost:5000
- [ ] Frontend dev server running on http://localhost:3000
- [ ] Can click "Continue with Google" button
- [ ] Redirects to Google sign-in page
- [ ] Can select Google account
- [ ] Redirects back to app successfully
- [ ] User data saved to Firestore
- [ ] Dashboard displays user information

## 🚀 Production Deployment Notes

### Frontend (Vercel)
1. Add all NEXT_PUBLIC_FIREBASE_* variables to Vercel environment variables
2. Set NEXT_PUBLIC_API_URL to your Render backend URL
3. Deploy

### Backend (Render)
1. Set FIREBASE_SERVICE_ACCOUNT_KEY as a secret environment variable (full JSON)
2. Optionally use GOOGLE_APPLICATION_CREDENTIALS only for local file-based setup
3. Deploy

### Firebase Console
1. Add Vercel domain to Authorized domains
2. Test production deployment

## 🎓 How It Works

### Authentication Flow
1. **Frontend**: User clicks "Continue with Google"
2. **Frontend**: Stores referral code (if present) in sessionStorage
3. **Frontend**: Calls `signInWithRedirect(auth, googleProvider)`
4. **Browser**: Redirects to Google OAuth page
5. **Google**: User signs in and authorizes app
6. **Browser**: Redirects back to app with auth token
7. **Frontend**: `getRedirectResult()` retrieves user data
8. **Frontend**: Sends user data + referral code to backend
9. **Backend**: Creates/updates user in Firestore
10. **Backend**: Links user to institute (if referral code valid)
11. **Backend**: Returns user data + institute branding
12. **Frontend**: Redirects to appropriate dashboard (B2C or B2B)

### Security
- Firebase ID tokens are verified on backend
- Tokens expire after 1 hour (auto-refreshed by Firebase)
- Backend uses Firebase Admin SDK for secure verification
- No passwords stored for OAuth users
- Institute association validated before linking

## 📚 Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth/web/start)
- [Google Sign-In Setup](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
