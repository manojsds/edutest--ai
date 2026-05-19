# EduTest AI — Free Deployment Guide

## Architecture (100% Free)

```
Students → Vercel (Frontend) → Google Cloud Run (Backend) → Firebase Firestore (DB)
                                        ↕
                               Google Cloud (same network)
```

| Service | Platform | Cost |
|---------|----------|------|
| Frontend (Next.js) | Vercel | Free forever |
| Backend (Express) | Google Cloud Run | Free (2M req/month) |
| Database | Firebase Firestore | Free (1GB, 50K reads/day) |
| Auth | Firebase Auth | Free |

---

## Part 1 — Deploy Backend to Google Cloud Run

### Step 1: Install Google Cloud CLI

Download from: https://cloud.google.com/sdk/docs/install

After install, run:
```bash
gcloud auth login
gcloud auth configure-docker
```

### Step 2: Find your Project ID

Go to https://console.firebase.google.com → your project → Project Settings

Your Project ID looks like: `edutest-477409-43991`

### Step 3: Edit the deploy script

Open `backend/deploy-cloudrun.sh` and set your Project ID:
```bash
PROJECT_ID="edutest-477409-43991"   # ← your actual project ID
```

### Step 4: Run the deploy script

```bash
cd backend
bash deploy-cloudrun.sh
```

This will:
1. Build your Docker image using Cloud Build (free)
2. Push it to Google Container Registry
3. Deploy to Cloud Run in Mumbai (asia-south1)
4. Print your backend URL

### Step 5: Set environment variables (secrets)

After deploy, run this command with your actual values:

```bash
gcloud run services update edutest-ai-backend --region asia-south1 \
  --set-env-vars GEMINI_API_KEY=your_actual_gemini_key \
  --set-env-vars GROQ_API_KEY=your_actual_groq_key \
  --set-env-vars JWT_SECRET=some_long_random_string_here \
  --set-env-vars FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}' \
  --set-env-vars CASHFREE_APP_ID=your_cashfree_app_id \
  --set-env-vars CASHFREE_SECRET_KEY=your_cashfree_secret
```

> **How to get FIREBASE_SERVICE_ACCOUNT_KEY:**
> Firebase Console → Project Settings → Service Accounts → Generate New Private Key
> Open the downloaded JSON file → copy the entire contents → paste as the value above

### Step 6: Test your backend

```bash
curl https://your-cloud-run-url.run.app/health
# Should return: {"status":"ok","uptime":...}
```

---

## Part 2 — Deploy Frontend to Vercel

### Step 1: Push your code to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Select your repository
5. Set **Root Directory** to `frontend`
6. Click Deploy

### Step 3: Set environment variables in Vercel

In your Vercel project → Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your Cloud Run URL (e.g. `https://edutest-ai-backend-xxx-el.a.run.app`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase Console → Project Settings → Web App |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From Firebase Console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From Firebase Console |

### Step 4: Redeploy

After setting env vars, click "Redeploy" in Vercel.

### Step 5: Test

Visit your Vercel URL → try generating a test → should work end to end.

---

## Part 3 — Update Backend CORS

After you have your Vercel URL (e.g. `https://edutest-ai.vercel.app`), update the backend:

```bash
gcloud run services update edutest-ai-backend --region asia-south1 \
  --set-env-vars FRONTEND_URL=https://your-app.vercel.app
```

---

## Free Tier Limits (When You'll Need to Upgrade)

| Service | Free Limit | When You Hit It |
|---------|-----------|-----------------|
| Cloud Run | 2M requests/month | ~66K tests/day |
| Firestore reads | 50K/day | ~500 active users/day |
| Firestore writes | 20K/day | ~200 tests/day |
| Firestore storage | 1GB | ~3,000 students |

**Bottom line:** You can comfortably run 500–1,000 students completely free.

---

## Custom Domain (Optional, Free)

### Frontend (Vercel):
Vercel → Project → Settings → Domains → Add your domain

### Backend (Cloud Run):
```bash
gcloud run domain-mappings create \
  --service edutest-ai-backend \
  --domain api.yourdomain.com \
  --region asia-south1
```

---

## Redeploying After Code Changes

### Backend:
```bash
cd backend
bash deploy-cloudrun.sh
```

### Frontend:
Just push to GitHub — Vercel auto-deploys on every push to `main`.

---

## Troubleshooting

**Backend not responding:**
```bash
gcloud run services describe edutest-ai-backend --region asia-south1
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

**Frontend can't reach backend:**
- Check `NEXT_PUBLIC_API_URL` in Vercel env vars
- Check CORS — make sure `FRONTEND_URL` is set in Cloud Run env vars

**Firebase errors:**
- Make sure `FIREBASE_SERVICE_ACCOUNT_KEY` is the full JSON (not a file path)
- Check Firebase Console → Firestore → Rules are set to allow reads/writes
