# Quick Deploy to Render - 3 Commands

## Step 1: Commit Changes
```bash
git add backend/server.js
git commit -m "Improved RAG + UPSC-style question generation"
```

## Step 2: Push to GitHub
```bash
git push origin main
```

## Step 3: Render Auto-Deploys
✅ Render detects the push and redeploys automatically (2-3 minutes)

---

## Check Deployment Status:
1. Visit: https://dashboard.render.com/
2. Find your service: `edutest-ai-backend`
3. Watch "Events" tab for deployment progress

---

## Manual Deploy (If Auto-Deploy is Off):
1. Go to https://dashboard.render.com/
2. Click your service
3. Click "Manual Deploy" → "Deploy latest commit"

---

## Verify After Deploy:
```bash
# Test health
curl https://your-backend.onrender.com/api/test

# Test RAG questions
curl -X POST https://your-backend.onrender.com/api/questions \
  -H "Content-Type: application/json" \
  -d '{"subject":"UPSC","topic":"Current Affairs India","count":3,"useRecent":true}'
```

---

## What Changed in This Update:
✅ RAG now fetches real news (Google News + Wikipedia + The Hindu)
✅ Questions use UPSC Prelims format
✅ 10% statement-based questions ("Consider the following statements...")
✅ Better context integration (4000+ chars from news)
✅ Citations from real sources (Vision IAS, Indian Express, Al Jazeera)

Done! 🚀
