# Backend Population Options

This guide explains different ways to populate your stock price database using various backend services.

---

## ✅ Option 1: Chunked Web Interface (Vercel Free Tier)

**Best for:** iPhone users, no additional setup needed

### How It Works:
- Processes **one stock at a time** (fits 10-second Vercel free tier limit)
- Makes 50 sequential API calls from your browser
- Takes **10-13 minutes total**
- Progress saved in database - can pause/resume

### Setup:

1. **Add to Vercel Environment Variables:**
   ```
   ADMIN_SECRET=populate-stock-prices-2025
   MASSIVE_API_KEY=xOemxcCL3tf_K7H9sKRr8mWtZnJtAS5M
   DATABASE_URL=postgres://postgres.aqeduhnhzflypquwegdc:...
   ```

2. **Deploy to Vercel:**
   ```bash
   git push
   ```

3. **Visit:**
   ```
   https://your-app.vercel.app/admin/populate-chunked
   ```

4. **Enter secret and click Start**

5. **Keep browser open for 10-13 minutes**

### Pros:
✅ Works on Vercel free tier
✅ No additional services needed
✅ Can pause and resume
✅ Progress tracking in real-time
✅ Works on iPhone

### Cons:
❌ Must keep browser open
❌ Takes 10-13 minutes
❌ Can't close the tab

---

## 🔄 Option 2: GitHub Actions (Recommended for Background)

**Best for:** One-time population, runs in background, completely free

### How It Works:
- Runs on GitHub's servers (free for public repos)
- Can run for up to 6 hours (way more than we need)
- Trigger manually from your iPhone via GitHub website
- Runs completely in background

### Setup:

1. **Add GitHub Secrets:**
   - Go to: https://github.com/chamaya00/stock-prediction-marketplace/settings/secrets/actions
   - Add these secrets:
     - `DATABASE_URL` = `postgres://postgres.aqeduhnhzflypquwegdc:b7jv2iR9pOnN2pgk@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
     - `MASSIVE_API_KEY` = `xOemxcCL3tf_K7H9sKRr8mWtZnJtAS5M`

2. **Push the workflow:**
   ```bash
   git push
   ```

3. **Trigger from iPhone:**
   - Go to: https://github.com/chamaya00/stock-prediction-marketplace/actions
   - Click "Populate Stock Prices"
   - Click "Run workflow" → "Run workflow"
   - Close your browser - it keeps running!

4. **Check progress:**
   - Refresh the Actions page to see live logs
   - Takes ~10 minutes

### Pros:
✅ **Runs in background** - can close browser
✅ Completely free (for public repos)
✅ Longer timeout (6 hours vs 10 seconds)
✅ Can trigger from iPhone
✅ Easy to re-run if needed
✅ See detailed logs

### Cons:
❌ Requires GitHub repository (you already have this)
❌ Need to set up secrets once

---

## 🚀 Option 3: Supabase Edge Functions

**Best for:** If you want to stay in Supabase ecosystem

### How It Works:
- Deploy a Deno function to Supabase
- Trigger via HTTP request
- Longer timeout than Vercel free tier

### Setup:

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Create Edge Function:**
   ```bash
   supabase functions new populate-prices
   ```

3. **Deploy:**
   ```bash
   supabase functions deploy populate-prices
   ```

4. **Trigger:**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/populate-prices \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

### Pros:
✅ Runs in Supabase (same as your database)
✅ Longer timeout
✅ Can trigger via API

### Cons:
❌ Requires Supabase CLI setup
❌ More complex
❌ Need to write Deno code (different from Node.js)

---

## 📦 Option 4: Railway / Render (Background Worker)

**Best for:** If you want a dedicated backend service

### Railway Setup:

1. **Go to:** https://railway.app
2. **Create new project** → **Deploy from GitHub**
3. **Select your repo**
4. **Add environment variables:**
   - `DATABASE_URL`
   - `MASSIVE_API_KEY`
5. **Add start command:** `npm run populate-prices`
6. **Deploy**

Takes ~10 minutes, then stops automatically.

### Pros:
✅ Dedicated backend
✅ Easy to set up
✅ Free tier available
✅ Runs in background

### Cons:
❌ Another service to manage
❌ Limited free tier hours

---

## 🌩️ Option 5: Upstash QStash (Queue System)

**Best for:** Distributed background jobs

### How It Works:
- Queues 50 jobs (one per stock)
- Executes them with retries
- Works with Vercel free tier

### Setup:

1. **Sign up:** https://upstash.com
2. **Create QStash endpoint**
3. **Modify code to use QStash SDK**
4. **Queue 50 jobs**

### Pros:
✅ Proper queue system
✅ Automatic retries
✅ Works with Vercel free tier

### Cons:
❌ Requires code changes
❌ Another service to learn
❌ More complex setup

---

## 📊 Comparison Table

| Method | Setup Time | Runtime | Can Close Browser? | Cost | Difficulty |
|--------|-----------|---------|-------------------|------|-----------|
| **Chunked Web** | 5 min | 10-13 min | ❌ No | Free | ⭐ Easy |
| **GitHub Actions** | 10 min | ~10 min | ✅ Yes | Free | ⭐⭐ Easy |
| **Supabase Edge** | 20 min | ~10 min | ✅ Yes | Free | ⭐⭐⭐ Medium |
| **Railway** | 15 min | ~10 min | ✅ Yes | Free tier | ⭐⭐ Easy |
| **QStash** | 30 min | ~10 min | ✅ Yes | Free tier | ⭐⭐⭐⭐ Hard |

---

## 🎯 My Recommendations

### **For iPhone Users (No Laptop):**

**1st Choice: GitHub Actions** ⭐ BEST
- Set up secrets once (5 minutes on iPhone)
- Trigger from GitHub website
- Runs in background, can close browser
- Completely free

**2nd Choice: Chunked Web Interface**
- Zero setup if already deployed
- Just visit URL and wait 10 minutes
- Must keep browser open

### **For Desktop Users:**

**1st Choice: GitHub Actions**
- Same as above, easier to set up on desktop

**2nd Choice: Google Cloud Shell**
- If you want full control
- See real-time output

---

## 🚀 Quick Start: GitHub Actions (Recommended)

**iPhone Steps:**

1. **Open Safari** → Go to: https://github.com/chamaya00/stock-prediction-marketplace/settings/secrets/actions

2. **Tap "New repository secret"**

3. **Add DATABASE_URL:**
   - Name: `DATABASE_URL`
   - Secret: `postgres://postgres.aqeduhnhzflypquwegdc:b7jv2iR9pOnN2pgk@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
   - Tap "Add secret"

4. **Add MASSIVE_API_KEY:**
   - Name: `MASSIVE_API_KEY`
   - Secret: `xOemxcCL3tf_K7H9sKRr8mWtZnJtAS5M`
   - Tap "Add secret"

5. **Pull and push workflow:**
   (You'll need to do this from a computer or Cloud Shell once, or I can commit it)

6. **Trigger workflow:**
   - Go to: https://github.com/chamaya00/stock-prediction-marketplace/actions
   - Tap "Populate Stock Prices"
   - Tap "Run workflow" dropdown
   - Tap green "Run workflow" button
   - Close browser - it keeps running!

7. **Check completion** (10 minutes later):
   - Refresh Actions page
   - Green checkmark = success!

**That's it!** Your database is now populated with 2 years of historical prices.

---

## ❓ Which Should You Choose?

**Choose GitHub Actions if:**
- ✅ You want to close your browser while it runs
- ✅ You want a completely free solution
- ✅ You don't mind 5 minutes of one-time setup

**Choose Chunked Web if:**
- ✅ You want zero setup (it's already deployed)
- ✅ You don't mind keeping browser open for 10 minutes
- ✅ You want to see real-time progress

**Both work great!** GitHub Actions is more "fire and forget", while Chunked Web gives you more visibility.
