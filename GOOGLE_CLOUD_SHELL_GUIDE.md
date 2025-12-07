# Running Stock Price Population from Google Cloud Shell (iPhone)

This guide shows how to populate your database with historical stock prices using Google Cloud Shell from your iPhone.

## Prerequisites

- Google account (for Cloud Shell)
- Database URL (Vercel Postgres or any PostgreSQL database)
- Massive.com API key: `xOemxcCL3tf_K7H9sKRr8mWtZnJtAS5M`

---

## Step 1: Open Google Cloud Shell

### On iPhone:

1. Open Safari or Chrome on your iPhone
2. Go to: **https://shell.cloud.google.com**
3. Sign in with your Google account
4. You'll see a terminal in your browser

**Tip:** For better experience, tap the "Full Screen" button in the terminal.

---

## Step 2: Clone Your Repository

In the Cloud Shell terminal, run:

```bash
git clone https://github.com/chamaya00/stock-prediction-marketplace.git
cd stock-prediction-marketplace
```

Check out your branch:

```bash
git checkout claude/alphavantage-stock-integration-011jw58G54aDE5xzYHXkpR7K
```

---

## Step 3: Set Up Environment Variables

Create the `.env.local` file with your settings:

```bash
cat > .env.local << 'EOF'
# Massive.com API Key
MASSIVE_API_KEY=xOemxcCL3tf_K7H9sKRr8mWtZnJtAS5M

# Database connection
DATABASE_URL="YOUR_DATABASE_URL_HERE"
EOF
```

**⚠️ IMPORTANT:** Replace `YOUR_DATABASE_URL_HERE` with your actual database URL.

### Where to get your DATABASE_URL:

#### If using Vercel Postgres:
1. Go to vercel.com on your phone
2. Navigate to your project → Storage → Your Postgres DB
3. Tap ".env.local" tab
4. Copy the `POSTGRES_PRISMA_URL` value

Then run:
```bash
# Edit the file to add your real DATABASE_URL
nano .env.local
# Use on-screen keyboard to replace YOUR_DATABASE_URL_HERE
# Press Ctrl+X, then Y, then Enter to save
```

---

## Step 4: Install Dependencies

```bash
npm install
```

This takes ~2-3 minutes. Wait for it to complete.

---

## Step 5: Run the Population Script

Now run the script to fetch 2 years of historical data:

```bash
npm run populate-prices
```

### What to expect:

```
🚀 Starting historical price population...

📊 Found 50 stocks in database

[1/50] Processing AAPL (Apple Inc.)...
   Fetching: 2023-12-07 to 2025-12-06
   ✓ Received 505 price bars
   ✓ Inserted 505 price records
   📈 Latest close: $175.43 on 2025-12-06

   ⏳ Waiting 12s for rate limit...

[2/50] Processing MSFT...
```

**⏱️ Total time:** ~10 minutes for all 50 stocks

**💡 Tip:** Keep your phone screen on or the Cloud Shell session might timeout. You can also run it in the background (see below).

---

## Step 6: Verify Data Was Inserted

After the script completes, verify the data:

```bash
npm run db:studio
```

Cloud Shell will show a "Web Preview" button. Tap it to open Prisma Studio and view your data.

Or run a quick query:

```bash
npx prisma db execute --stdin << 'SQL'
SELECT
  s.symbol,
  COUNT(sp.id) as price_count,
  MAX(sp.date) as latest_date
FROM stocks s
LEFT JOIN stock_prices sp ON s.stock_id = sp.stock_id
GROUP BY s.symbol
ORDER BY s.symbol
LIMIT 10;
SQL
```

---

## Alternative: Run in Background (If Screen Turns Off)

If you're worried about your iPhone screen turning off and interrupting the process:

### Option 1: Use `nohup` (recommended)

```bash
nohup npm run populate-prices > populate.log 2>&1 &
```

This runs the script in the background. Check progress with:

```bash
tail -f populate.log
```

Press `Ctrl+C` to stop watching (the script keeps running).

### Option 2: Use `screen`

```bash
screen -S populate
npm run populate-prices
```

Detach with: `Ctrl+A`, then `D`

Reattach later with:
```bash
screen -r populate
```

---

## Troubleshooting

### "Cannot find module '@prisma/client'"

Run:
```bash
npx prisma generate
```

### "Connection timeout" or "ECONNREFUSED"

Your `DATABASE_URL` is incorrect. Double-check:
1. The URL is from Vercel Postgres (or your DB provider)
2. Use `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`)
3. The database is accessible from the internet

### "Rate limit exceeded"

The script already handles rate limits (12s between calls). If you see this, just wait and it will retry.

### Cloud Shell session timeout

Google Cloud Shell sessions timeout after **20 minutes of inactivity**. To prevent this:
- Use the `nohup` method above
- Or keep the terminal active by occasionally tapping the screen

---

## Quick Command Reference

```bash
# Clone and setup
git clone https://github.com/chamaya00/stock-prediction-marketplace.git
cd stock-prediction-marketplace
git checkout claude/alphavantage-stock-integration-011jw58G54aDE5xzYHXkpR7K

# Create .env.local (then edit with your DATABASE_URL)
cat > .env.local << 'EOF'
MASSIVE_API_KEY=xOemxcCL3tf_K7H9sKRr8mWtZnJtAS5M
DATABASE_URL="your-database-url-here"
EOF

# Install and run
npm install
npm run populate-prices

# Or run in background
nohup npm run populate-prices > populate.log 2>&1 &
tail -f populate.log
```

---

## After Completion

Once the script finishes:

1. ✅ Your database now has 2 years of historical stock prices
2. ✅ ~25,000 price records inserted
3. ✅ Ready to deploy to Vercel for automated daily updates

Deploy to Vercel (from Cloud Shell):

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Make sure your Vercel environment variables are set:
- `MASSIVE_API_KEY`
- `CRON_SECRET`
- Database variables (automatically set if using Vercel Postgres)

---

## Mobile-Friendly Tips

1. **Landscape mode:** Rotate your iPhone for wider terminal view
2. **Font size:** Cloud Shell has zoom controls in the settings (⚙️ icon)
3. **Copy/Paste:** Long-press in terminal to paste commands
4. **Background tab:** Chrome/Safari keeps Cloud Shell running in background tabs

---

**You're all set!** 🚀 Just follow the steps above and your database will be populated in ~10 minutes.
