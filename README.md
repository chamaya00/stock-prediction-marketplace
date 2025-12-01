# Stock Prediction Marketplace

A platform for stock analysts to build their reputation through accurate price predictions. Make predictions on S&P 500 stocks across multiple timeframes (7d, 28d, 60d, 90d, 180d, 365d) and track your accuracy over time.

## Features

- 🎯 **Multi-Timeframe Predictions**: Predict stock prices at 6 different timeframes
- 🔒 **Automatic Locking**: Predictions lock at the start of each day
- 📊 **Performance Tracking**: Track accuracy of predictions vs actual outcomes
- 🏆 **Leaderboard**: Compete with other analysts globally
- 🔐 **Authentication**: Secure user authentication with NextAuth.js
- 💾 **PostgreSQL Database**: Robust data storage with Prisma ORM
- 🚀 **Optimized for Vercel**: Seamless deployment with Vercel platform

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel (with Cron Jobs)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Vercel account (for deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd stock-prediction-marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

   Update the values in `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/stock_predictions"
   NEXTAUTH_SECRET="your-random-secret"
   NEXTAUTH_URL="http://localhost:3000"
   CRON_SECRET="your-cron-secret"
   ```

   Generate secrets:
   ```bash
   # For NEXTAUTH_SECRET
   openssl rand -base64 32

   # For CRON_SECRET
   openssl rand -base64 32
   ```

4. **Set up the database**

   Push the Prisma schema to your database:
   ```bash
   npx prisma db push
   ```

   Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

5. **Seed the database**

   Populate the database with S&P 500 stocks and demo users:
   ```bash
   npm run db:seed
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Accounts

After seeding, you can use these demo accounts:

- **Email**: analyst1@example.com
  **Password**: password123

- **Email**: analyst2@example.com
  **Password**: password123

## Deployment to Vercel

### 1. Set up Vercel Postgres

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Create a new "Postgres" database
4. Copy the connection strings

### 2. Configure Environment Variables

In your Vercel project settings, add these environment variables:

```env
DATABASE_URL=<your-vercel-postgres-url>
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=<your-vercel-deployment-url>
CRON_SECRET=<random-secret>
```

### 3. Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 4. Set up the database on Vercel

After deployment, run migrations and seed:

```bash
# Push schema to Vercel Postgres
npx prisma db push

# Seed the database
npm run db:seed
```

### 5. Configure Cron Jobs

The `vercel.json` file already configures a daily cron job to lock predictions. Vercel will automatically set this up.

The cron job runs at midnight UTC daily and calls `/api/predictions/lock`.

## Project Structure

```
stock-prediction-marketplace/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/             # Authentication endpoints
│   │   ├── predictions/      # Prediction CRUD + locking
│   │   ├── stocks/           # Stock data endpoints
│   │   └── analysts/         # Analyst profiles & leaderboard
│   ├── auth/                 # Auth pages (signin, signup)
│   ├── dashboard/            # User dashboard
│   ├── predictions/          # Prediction management
│   ├── leaderboard/          # Analyst leaderboard
│   └── layout.tsx            # Root layout with providers
├── components/               # Reusable React components
├── lib/                      # Utility functions
│   ├── auth.ts               # NextAuth configuration
│   └── prisma.ts             # Prisma client
├── prisma/                   # Database schema and seeds
│   ├── schema.prisma         # Database models
│   └── seed.ts               # Seed script
├── types/                    # TypeScript type definitions
└── vercel.json               # Vercel configuration (cron jobs)
```

## Database Schema

### User
- User accounts (analysts)
- Stores: email, name, password (hashed), bio

### Stock
- S&P 500 stocks
- Stores: symbol, name, sector, industry

### Prediction
- Price predictions for multiple timeframes
- Stores: current price, predicted prices (7d, 28d, 60d, 90d, 180d, 365d)
- Tracks: actual prices, accuracy percentages, lock status

### StockPrice (optional)
- Historical stock price data
- Stores: OHLC data and volume

## Key Features Explained

### Prediction Locking

Predictions are automatically locked at the start of each day via a Vercel Cron Job. Once locked, predictions cannot be modified or deleted. This ensures integrity and prevents retroactive changes.

### Accuracy Calculation

Accuracy is calculated as the percentage error between predicted and actual prices:

```
accuracy = ((|actual - predicted|) / actual) × 100
```

Lower percentages indicate more accurate predictions.

### Leaderboard Ranking

Analysts are ranked by their average accuracy across all predictions for a given timeframe. The leaderboard updates in real-time as predictions mature and actual prices are recorded.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in (NextAuth)
- `POST /api/auth/signout` - Sign out

### Stocks
- `GET /api/stocks` - List all stocks (supports search)
- `GET /api/stocks/[symbol]` - Get stock details

### Predictions
- `GET /api/predictions` - Get user's predictions
- `POST /api/predictions` - Create new prediction
- `GET /api/predictions/[id]` - Get specific prediction
- `DELETE /api/predictions/[id]` - Delete unlocked prediction
- `POST /api/predictions/lock` - Lock predictions (cron job)

### Analysts
- `GET /api/analysts/leaderboard` - Get ranked analysts
- `GET /api/analysts/[id]` - Get analyst profile

## Customization

### Adding More Stocks

Edit `prisma/seed.ts` to add more stocks to the S&P 500 list or other stocks:

```typescript
const sp500Stocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics' },
  // Add more stocks here
];
```

### Integrating Real Stock Data

To fetch real-time stock prices, integrate a stock data API (Alpha Vantage, Polygon.io, etc.):

1. Add API key to environment variables
2. Create a service in `lib/stock-data.ts`
3. Call the service in your API routes

### Customizing Timeframes

To modify prediction timeframes, update:
1. Database schema in `prisma/schema.prisma`
2. API routes in `app/api/predictions/`
3. Frontend forms in `app/predictions/create/`

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review the API endpoints

## Roadmap

- [ ] Real-time stock price integration
- [ ] Email notifications for prediction results
- [ ] Advanced analytics dashboard
- [ ] Social features (follow analysts, comments)
- [ ] Mobile app
- [ ] Portfolio tracking
- [ ] AI-powered prediction assistance

---

Built with ❤️ for stock market enthusiasts and aspiring analysts.
