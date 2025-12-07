# Stock Price Integration Setup Guide

This guide explains how to populate your database with real historical stock prices using Massive.com (formerly Polygon.io) and set up automated daily updates.

## Overview

- **Data Provider:** Massive.com (formerly Polygon.io)
- **Free Tier:** 5 API calls/minute, 2 years of historical data
- **Coverage:** 50 S&P 500 stocks
- **Update Frequency:** Daily at 1:00 AM UTC via Vercel Cron

---

## Step 1: Initial Setup

### 1.1 Environment Variables

Your `.env.local` file has been created with:

```bash
MASSIVE_API_KEY=xOemxcCL3tf_K7H9sKRr8mWtZnJtAS5M
CRON_SECRET="massive-stock-price-update-secret-2025"
```

**Important:** Make sure to add these to your Vercel project environment variables:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - `MASSIVE_API_KEY` = `xOemxcCL3tf_K7H9sKRr8mWtZnJtAS5M`
   - `CRON_SECRET` = `massive-stock-price-update-secret-2025`

### 1.2 Install Dependencies

```bash
npm install
```

This will install all dependencies and generate the Prisma client.

### 1.3 Ensure Database is Set Up

Make sure your `DATABASE_URL` is configured in `.env.local` and the database schema is up to date:

```bash
npm run db:push
```

Seed the initial stock data if you haven't already:

```bash
npm run db:seed
```

---

## Step 2: Populate Historical Data (One-Time)

Run the population script to fetch 2 years of historical daily prices for all 50 stocks:

```bash
npm run populate-prices
```

**What this does:**
- Fetches daily OHLC (Open, High, Low, Close) data for each stock
- Retrieves up to 2 years of historical data (free tier limit)
- Respects rate limits: 5 calls/minute = 12 seconds between stocks
- **Estimated time:** ~10 minutes for 50 stocks

**Expected output:**
```
🚀 Starting historical price population...

📊 Found 50 stocks in database

[1/50] Processing AAPL (Apple Inc.)...
   Fetching: 2023-12-07 to 2025-12-06
   ✓ Received 505 price bars
   ✓ Inserted 505 price records
   📈 Latest close: $175.43 on 2025-12-06

   ⏳ Waiting 12s for rate limit...

[2/50] Processing MSFT (Microsoft Corporation)...
   ...

✅ Population complete!

📊 Summary:
   ✓ Successful: 50 stocks
   ✗ Failed: 0 stocks
   📈 Total prices inserted: 25,250
   ⏱️  Estimated time: 10 minutes
```

---

## Step 3: Verify Data Was Inserted

You can verify the data using Prisma Studio:

```bash
npm run db:studio
```

Then navigate to the `StockPrice` table to see the historical data.

Or run a quick SQL query:

```sql
SELECT
  s.symbol,
  s.name,
  COUNT(sp.id) as price_count,
  MAX(sp.date) as latest_date,
  MIN(sp.date) as earliest_date
FROM stocks s
LEFT JOIN stock_prices sp ON s.id = sp.stock_id
GROUP BY s.id, s.symbol, s.name
ORDER BY s.symbol;
```

---

## Step 4: Set Up Automated Daily Updates

### 4.1 Vercel Cron Configuration

The `vercel.json` file has been updated with a cron job:

```json
{
  "crons": [
    {
      "path": "/api/predictions/lock",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/update-prices",
      "schedule": "0 1 * * *"
    }
  ]
}
```

**Schedule:** Runs daily at **1:00 AM UTC** (after market close)

**What it does:**
- Fetches yesterday's closing prices for all 50 stocks
- Skips weekends automatically (finds last trading day)
- Upserts data (updates if exists, creates if new)
- Respects rate limits (12 seconds between calls)

### 4.2 Deploy to Vercel

```bash
git add .
git commit -m "Add Massive.com stock price integration"
git push
```

Vercel will automatically deploy and activate the cron job.

### 4.3 Test the Cron Endpoint Locally

You can test the daily update locally:

```bash
npm run update-prices
```

Or test the API endpoint:

```bash
curl -H "Authorization: Bearer massive-stock-price-update-secret-2025" \
  http://localhost:3000/api/cron/update-prices
```

---

## Step 5: Monitor and Maintain

### 5.1 Check Cron Logs

In Vercel dashboard:
1. Go to your project
2. Navigate to **Logs**
3. Filter by `/api/cron/update-prices`

You should see daily logs like:

```json
{
  "success": true,
  "date": "2025-12-06",
  "updated": 50,
  "skipped": 0,
  "errors": 0,
  "total": 50
}
```

### 5.2 Monitor API Usage

Check your Massive.com dashboard to monitor API usage:
- **Free tier limit:** 5 calls/minute
- **Daily usage:** ~50 calls for updates
- **Monthly usage:** ~1,500 calls

You're well within the free tier limits!

---

## Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run test-api` | Test Massive.com API connection (fetches AAPL last 30 days) |
| `npm run populate-prices` | **One-time:** Populate all 50 stocks with 2 years of historical data |
| `npm run update-prices` | **Daily:** Update all stocks with yesterday's closing price |
| `npm run db:studio` | Open Prisma Studio to view database |

---

## API Endpoints

### GET /api/cron/update-prices

**Purpose:** Automated daily price update via Vercel Cron

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
```

**Response:**
```json
{
  "success": true,
  "date": "2025-12-06",
  "updated": 50,
  "skipped": 0,
  "errors": 0,
  "total": 50
}
```

**Security:** Protected by `CRON_SECRET` environment variable

---

## Troubleshooting

### Issue: "MASSIVE_API_KEY environment variable is not set"

**Solution:** Add the API key to your `.env.local` file:

```bash
MASSIVE_API_KEY=xOemxcCL3tf_K7H9sKRr8mWtZnJtAS5M
```

### Issue: "Cannot find module '@prisma/client'"

**Solution:** Generate the Prisma client:

```bash
npx prisma generate
```

### Issue: "No data returned for stock"

**Possible causes:**
- Weekend or market holiday (script will skip automatically)
- Incorrect stock symbol
- API rate limit exceeded (wait 12 seconds between calls)

**Solution:** The script handles these gracefully and will skip problematic stocks.

### Issue: Cron job not running

**Solution:**
1. Ensure `CRON_SECRET` is set in Vercel environment variables
2. Check Vercel logs for errors
3. Verify `vercel.json` is committed to git
4. Cron jobs only work on production deployments, not preview branches

---

## Rate Limits & Costs

### Free Tier (Current)
- ✅ 5 API calls per minute
- ✅ 2 years of historical data
- ✅ Real-time and end-of-day data
- ✅ Unlimited endpoints access

### Usage Estimates
- **Initial population:** 50 calls (one-time)
- **Daily updates:** 50 calls per day
- **Monthly usage:** ~1,500 calls
- **Cost:** **$0/month** (free tier)

---

## Next Steps

1. ✅ Run `npm run populate-prices` to get 2 years of data
2. ✅ Deploy to Vercel to activate daily cron updates
3. ✅ Monitor logs to ensure daily updates are working
4. 📊 Your prediction platform now has real stock prices!

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Daily Price Update Flow                      │
└─────────────────────────────────────────────────────────────────┘

1. Vercel Cron triggers at 1:00 AM UTC
   ↓
2. GET /api/cron/update-prices (with Authorization header)
   ↓
3. Verify CRON_SECRET
   ↓
4. Calculate yesterday's trading day (skip weekends)
   ↓
5. For each of 50 stocks:
   ├─ Fetch from Massive API: /v1/open-close/{symbol}/{date}
   ├─ Wait 12 seconds (rate limit: 5/min)
   └─ Upsert into database
   ↓
6. Return summary:
   {
     "updated": 50,
     "skipped": 0,
     "errors": 0
   }
```

---

## Additional Resources

- **Massive.com Documentation:** https://massive.com/docs
- **Polygon.io API Docs:** https://polygon.io/docs/stocks
- **Free API Signup:** https://polygon.io/dashboard/signup
- **Vercel Cron Docs:** https://vercel.com/docs/cron-jobs

---

**Questions?** Check the logs in Vercel or run scripts locally to debug.

**Happy Trading!** 📈
