#!/bin/bash
# ============================================================
# EduTest AI — Deploy Backend to Google Cloud Run (FREE TIER)
# Run this from the /backend directory
# Prerequisites: gcloud CLI installed and logged in
# ============================================================

set -e

# ---- CONFIGURE THESE ----
PROJECT_ID="your-google-cloud-project-id"   # e.g. edutest-477409-43991
SERVICE_NAME="edutest-ai-backend"
REGION="asia-south1"                         # Mumbai — closest to India
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME"
# --------------------------

echo "🚀 Deploying EduTest AI Backend to Cloud Run..."
echo "   Project:  $PROJECT_ID"
echo "   Service:  $SERVICE_NAME"
echo "   Region:   $REGION"
echo ""

# Step 1: Set project
gcloud config set project $PROJECT_ID

# Step 2: Enable required APIs (only needed once)
echo "📦 Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  --quiet

# Step 3: Build and push Docker image using Cloud Build (free)
echo "🔨 Building Docker image with Cloud Build..."
gcloud builds submit --tag $IMAGE .

# Step 4: Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 60 \
  --set-env-vars "NODE_ENV=production" \
  --quiet

# Step 5: Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format 'value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "   Backend URL: $SERVICE_URL"
echo ""
echo "📋 Next steps:"
echo "   1. Set your environment variables (secrets) — see below"
echo "   2. Update NEXT_PUBLIC_API_URL in your Vercel frontend to: $SERVICE_URL"
echo ""
echo "🔐 Set secrets with:"
echo "   gcloud run services update $SERVICE_NAME --region $REGION \\"
echo "     --set-env-vars GEMINI_API_KEY=your_key \\"
echo "     --set-env-vars GROQ_API_KEY=your_key \\"
echo "     --set-env-vars JWT_SECRET=your_secret \\"
echo "     --set-env-vars FIREBASE_SERVICE_ACCOUNT_KEY='{...json...}' \\"
echo "     --set-env-vars FRONTEND_URL=$SERVICE_URL \\"
echo "     --set-env-vars CASHFREE_APP_ID=your_id \\"
echo "     --set-env-vars CASHFREE_SECRET_KEY=your_secret"
