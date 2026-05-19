# 🚀 Authentication System Setup Complete!

## ✅ What We've Built

### Backend (Firebase + Express)
- ✅ Firebase Firestore database integration
- ✅ User authentication (signup/login/verify)
- ✅ Institute (coaching center) management
- ✅ Referral code system
- ✅ JWT token-based authentication
- ✅ Test history tracking (optimized storage)
- ✅ Commission tracking for B2B
- ✅ Rate limiting for public endpoints

### Frontend (Next.js + React)
- ✅ Beautiful login page with dynamic branding
- ✅ Signup page with referral code detection
- ✅ Student dashboard with statistics
- ✅ Auth context provider for state management
- ✅ Protected routes
- ✅ Institute branding support (logo, colors)

### Features
- ✅ **B2C Mode**: Anyone can use without login (free/limited)
- ✅ **B2B Mode**: Referral code → White-label branding → Login required
- ✅ 7-day free trial for all new users
- ✅ Subscription status tracking
- ✅ Performance analytics ready
- ✅ Commission calculation for coaching centers

---

## 🎨 Color Scheme

### Default Colors (Can be customized per institute)
- **Primary**: `#4F46E5` (Indigo 600) - Buttons, headers
- **Secondary**: `#818CF8` (Indigo 400) - Accents, highlights  
- **Accent**: `#10B981` (Green 500) - Success messages, CTAs
- **Background**: Gradient from indigo to purple

### Institute Branding
Each coaching center can have:
- Custom logo
- Primary color
- Secondary color
- Accent color
- Subdomain (allen.edutest.ai)

---

## 🧪 Testing Instructions

### Step 1: Start Backend Server

```bash
cd backend
npm install  # Already done
npm start
```

Server will run on http://localhost:5000

### Step 2: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on http://localhost:3000

### Step 3: Create Your First Institute (Coaching Center)

Open a new terminal and run this Node.js script:

```bash
node backend/scripts/create-institute.js
```

Or manually create via API:

```bash
curl -X POST http://localhost:5000/api/admin/create-institute \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Allen Career Institute",
    "email": "admin@allen.com",
    "referralCode": "ALLEN2024",
    "primaryColor": "#FF5733",
    "secondaryColor": "#FFC300",
    "commissionPercentage": 10
  }'
```

### Step 4: Test User Flows

#### Flow 1: B2C User (No Referral Code)
1. Visit http://localhost:3000
2. Click "Generate Questions" (no login required)
3. Use up to 20 questions per 15 minutes (rate limited)
4. See "Sign up for unlimited access" message

#### Flow 2: B2B User (With Referral Code)
1. Visit http://localhost:3000/signup?ref=ALLEN2024
2. Notice Allen branding loads automatically
3. Fill signup form
4. Login → Redirected to dashboard
5. See Allen logo and colors throughout

#### Flow 3: Login
1. Visit http://localhost:3000/login
2. Login with credentials created above
3. See personalized dashboard
4. View stats, start tests, check history

---

## 📂 File Structure

```
backend/
├── config/
│   └── firebase.js          # Firebase initialization
├── models/
│   ├── User.js              # User model
│   ├── Institute.js         # Institute/coaching center model
│   └── TestHistory.js       # Optimized test storage
├── middleware/
│   └── authMiddleware.js    # JWT authentication
├── routes/
│   ├── authRoutes.js        # Login/signup/verify
│   ├── explanations.js      # AI explanations
│   └── payment.js           # Payment routes (guide provided)
├── .env                     # Environment variables
└── server.js                # Main server file

frontend/
├── src/
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx     # Login page
│   │   ├── signup/
│   │   │   └── page.tsx     # Signup page
│   │   ├── dashboard/
│   │   │   └── page.tsx     # Student dashboard
│   │   └── layout.tsx       # Root layout with AuthProvider
│   ├── components/
│   │   └── ui/              # Shadcn UI components
│   └── lib/
│       └── authContext.tsx  # Auth state management
└── .env.local               # Frontend environment variables
```

---

## 🔑 Environment Variables

### Backend `.env`
```env
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
RAG_SERVICE_URL=https://edutest-ai.onrender.com
JWT_SECRET=edutest_ai_secret_key_2026_change_this_in_production
CASHFREE_APP_ID=your_cashfree_app_id (later)
CASHFREE_SECRET_KEY=your_cashfree_secret_key (later)
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🧩 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/institute/:referralCode` - Get institute info (public)

### Questions (Existing)
- `POST /api/questions` - Generate AI questions (rate limited)
- `POST /api/explain` - Get AI explanation

---

## 🔐 Authentication Flow

### 1. User Signs Up
```
POST /api/auth/signup
Body: { name, email, password, referralCode }
↓
Creates user in Firestore
↓
Returns JWT token + user data + institute branding
↓
Frontend stores token in localStorage
```

### 2. User Logs In
```
POST /api/auth/login
Body: { email, password }
↓
Verifies password with bcrypt
↓
Returns JWT token + user data + institute branding
↓
Frontend stores token + applies branding
```

### 3. Protected Routes
```
Request with Authorization: Bearer <token>
↓
Middleware verifies JWT
↓
Attaches user object to req.user
↓
Route handler processes request
```

---

## 💰 Monetization Ready

### Free Tier (B2C, No Login)
- 20 questions per 15 minutes
- Basic features only
- No test history
- No analytics

### Trial (After Signup)
- 7 days free
- Unlimited questions
- Full features
- Test history saved

### Paid Subscription
- Monthly: ₹300
- Quarterly: ₹799
- Yearly: ₹2,499
- Integration guide: `PAYMENT_INTEGRATION_GUIDE.md`

### B2B (Coaching Centers)
- Per student: ₹270/month
- Your cut: ₹240 (90%)
- Coaching center commission: ₹30 (10%)
- White-label branding included

---

## 🎯 Next Steps

### Immediate (Today)
1. ✅ Test signup/login flow
2. ✅ Create a test institute with referral code
3. ✅ Test B2C and B2B flows
4. ✅ Verify Firebase data is saving correctly

### Short-term (This Week)
1. Deploy backend to Render with Firebase credentials
2. Deploy frontend to Vercel with API URL
3. Test production deployment
4. Create 2-3 demo accounts

### Medium-term (Next 2 Weeks)
1. Integrate Cashfree payments (see `PAYMENT_INTEGRATION_GUIDE.md`)
2. Build institute admin dashboard
3. Add test history page
4. Create analytics dashboard
5. Build bulk student upload (CSV)

### Long-term (Next Month)
1. Add performance analytics graphs
2. Implement weak area detection
3. Create email notifications
4. Build mobile PWA
5. Add Hindi language support

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check env vars are loaded
echo $FIREBASE_SERVICE_ACCOUNT_KEY

# Install dependencies again
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend build errors
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run build
```

### Firebase errors
```
Error: Firebase app not initialized
→ Check GOOGLE_APPLICATION_CREDENTIALS path
→ Verify JSON file exists and is valid
```

### Authentication not working
```
Check:
1. JWT_SECRET is set in .env
2. Token is being sent in Authorization header
3. Token hasn't expired (7 days validity)
```

---

## 📊 Database Collections

### `users`
- Stores all user accounts (students + admins)
- Password hashed with bcrypt
- Links to institute via `instituteId`

### `institutes`
- Coaching center details
- Branding configuration
- Commission settings
- Revenue tracking

### `test_history`
- Optimized storage (500 bytes per test)
- Only stores question IDs + answers
- Aggregated analytics

### `subscriptions` (when payment integrated)
- Payment tracking
- Subscription status
- Commission calculations

---

## 🎓 How Each Feature Works

### Referral Code System
```
User clicks: edutest.ai/signup?ref=ALLEN2024
↓
Frontend detects ?ref= parameter
↓
Fetches institute details from API
↓
Shows Allen logo, colors, name
↓
User signs up with Allen association
↓
All their data tagged with Allen's instituteId
```

### White-Label Branding
```
Institute data has:
- logoUrl: "https://storage.../allen-logo.png"
- primaryColor: "#FF5733"
- secondaryColor: "#FFC300"

Frontend applies dynamically:
- Header logo
- Button colors
- Card borders
- Gradient backgrounds
```

### Commission Tracking
```
Student pays ₹300/month
↓
Your revenue: ₹270 (90%)
↓
Coaching center commission: ₹30 (10%)
↓
Automatically calculated and tracked
↓
Institute admin sees earnings in dashboard
```

---

## ✅ Deployment Checklist

### Backend (Render)
- [ ] Push code to GitHub
- [ ] Create new Web Service on Render
- [ ] Add environment variables
- [ ] Upload Firebase JSON as secret file
- [ ] Deploy and test

### Frontend (Vercel)
- [ ] Push code to GitHub  
- [ ] Import project on Vercel
- [ ] Add NEXT_PUBLIC_API_URL env variable
- [ ] Deploy and test
- [ ] Configure custom domain

---

## 🎉 Success Metrics

You've built a complete B2B SaaS platform with:
- ✅ Multi-tenant architecture
- ✅ White-label capability
- ✅ Commission tracking
- ✅ Scalable database (Firestore)
- ✅ Modern authentication
- ✅ Beautiful UI/UX
- ✅ Rate limiting protection
- ✅ Payment integration ready

**Cost to run**: ₹0-500/month (Firebase free tier + Render/Vercel free tiers)
**Potential revenue**: ₹2,70,000/month at 10,000 students

---

## 📞 Support

Need help? Check:
1. Firebase Console: https://console.firebase.google.com
2. API Documentation: http://localhost:5000/api (when running)
3. Payment Guide: `PAYMENT_INTEGRATION_GUIDE.md`

---

**Built with ❤️ for EduTest AI - February 2026**
