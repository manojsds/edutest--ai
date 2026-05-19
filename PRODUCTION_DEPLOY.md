# EduTest AI — Production Deployment Guide

## Architecture (100% Free)

```
Students/Coaches
      ↓
Vercel (Frontend - Next.js)     ← free, no cold starts
      ↓
Render (Backend - Express)      ← free tier
      ↓
Firebase Firestore (Database)   ← free 1GB tier
      ↓
Gemini API (AI questions)       ← free tier (60 req/min)
```

---

## Step 1 — Get Your API Keys (15 minutes)

### 1a. Gemini API Key (FREE)
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key — looks like: `AIzaSy...`

### 1b. Firebase Service Account (FREE)
1. Go to https://console.firebase.google.com
2. Select your project: `edutest-477409-43991`
3. Click gear icon → Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Open it in Notepad, copy ALL the content (the entire JSON)

### 1c. Groq API Key (FREE - optional but recommended as backup)
1. Go to https://console.groq.com
2. Sign up free → API Keys → Create Key
3. Copy the key — looks like: `gsk_...`

### 1d. Razorpay Keys (for payments)
1. Go to https://dashboard.razorpay.com
2. Sign up → Settings → API Keys → Generate Test Key
3. Copy Key ID and Key Secret
4. For production: complete KYC and switch to live keys

---

## Step 2 — Deploy Backend to Render (10 minutes)

1. Go to https://render.com and sign in with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Set these settings:
   - **Name**: `edutest-ai-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Click "Advanced" → "Add Environment Variable" and add ALL of these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `GEMINI_API_KEY` | your key from Step 1a |
| `GROQ_API_KEY` | your key from Step 1c |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | paste the ENTIRE firebase JSON here (one line) |
| `JWT_SECRET` | any random 32+ character string (e.g., `edutest_prod_2026_xK9mP2qR7vL4nW8`) |
| `FRONTEND_URL` | your Vercel URL (set after Step 3, come back and update) |
| `LLM_PROVIDER_ORDER` | `gemini,groq` |
| `GEMINI_MODELS` | `gemini-1.5-flash,gemini-1.5-flash-8b` |
| `GROQ_MODELS` | `llama-3.1-8b-instant,llama-3.3-70b-versatile` |
| `LLM_MAX_RETRIES` | `3` |
| `RAZORPAY_KEY_ID` | your Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | your Razorpay secret |

6. Click "Create Web Service"
7. Wait 3-5 minutes for first deploy
8. Copy your backend URL: `https://edutest-ai-backend.onrender.com`

**Test it:** Open `https://your-backend.onrender.com/health` — should show `{"status":"ok"}`

---

## Step 3 — Deploy Frontend to Vercel (5 minutes)

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import your GitHub repo
4. Set these settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`

5. Click "Environment Variables" and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | your Render backend URL from Step 2 |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyAD8YDCy6z-7IiNkETINGAuiiLxmquE5a4` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `edutest-477409-43991.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `edutest-477409-43991` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `edutest-477409-43991.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `211274098331` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:211274098331:web:a327b924672798970cc83e` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | your Razorpay key ID |

6. Click "Deploy"
7. Wait 2-3 minutes
8. Copy your frontend URL: `https://edutest-ai.vercel.app`

9. **Go back to Render** → your backend service → Environment → update `FRONTEND_URL` to your Vercel URL

---

## Step 4 — Enable Google Login in Firebase (5 minutes)

1. Go to https://console.firebase.google.com → your project
2. Click "Authentication" → "Sign-in method"
3. Enable "Google"
4. Add your Vercel domain to "Authorized domains":
   - `edutest-ai.vercel.app` (your actual Vercel URL)
5. Save

---

## Step 5 — Test Everything (10 minutes)

Open your Vercel URL and test this flow:

1. ✅ Homepage loads with exam selector
2. ✅ Select UPSC → type "Modern History" → Generate Test → questions appear
3. ✅ Click "Register your institute" → fill form → get referral code
4. ✅ Open `/?ref=YOURCODE` → see branded header
5. ✅ Sign in with Google → redirected to dashboard
6. ✅ Complete a test → results show with scores

---

## Step 6 — Add Your First Coaching Center (Your Sales Flow)

When your employee talks to a coaching center:

1. Go to `https://your-app.vercel.app/institute/register`
2. Fill in their details (or have them fill it)
3. They get a unique referral code like `ALLEN2026`
4. Share the student signup link: `https://your-app.vercel.app/?ref=ALLEN2026`
5. Students sign up → see Allen branding → take 10 free tests
6. After 10 tests → prompted to subscribe → ₹270/month
7. Allen earns 10% = ₹27/student/month automatically

---

## Render Free Tier — Cold Start Warning

Render free tier **sleeps after 15 minutes of inactivity**. First request after sleep takes 30-50 seconds.

**Fix (free):** Add a keep-alive ping. Add this to your frontend:

The frontend already probes the backend on load — this naturally keeps it warm during business hours.

For 24/7 uptime: upgrade Render to $7/month "Starter" plan. Worth it once you have 10+ paying students.

---

## Monitoring

- **Backend logs**: Render Dashboard → your service → Logs
- **Frontend errors**: Vercel Dashboard → your project → Functions
- **Database**: Firebase Console → Firestore → Data
- **Users**: Firebase Console → Authentication → Users

---

## Custom Domain (Optional, Free)

1. Buy domain from GoDaddy/Namecheap (~₹800/year): e.g., `edutestai.in`
2. Vercel: Settings → Domains → Add domain
3. Follow DNS instructions (takes 10 minutes)
4. Update `FRONTEND_URL` in Render to your custom domain
5. Update Firebase authorized domains

---

## Revenue Tracking

Once live, track in Firebase Console:
- `institutes` collection: see all coaching centers
- `users` collection: see all students + subscription status
- `test_history` collection: see all tests taken

Commission is auto-calculated in the institute dashboard at `/dashboard/institute`.
