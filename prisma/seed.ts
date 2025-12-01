import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Top 50 S&P 500 stocks by market cap (as of 2024)
const sp500Stocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', industry: 'Software' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', sector: 'Technology', industry: 'Internet Services' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', industry: 'E-commerce' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', industry: 'Social Media' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', sector: 'Financial Services', industry: 'Insurance' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', industry: 'Banking' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services', industry: 'Credit Services' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', industry: 'Pharmaceuticals' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Defensive', industry: 'Discount Stores' },
  { symbol: 'MA', name: 'Mastercard Incorporated', sector: 'Financial Services', industry: 'Credit Services' },
  { symbol: 'PG', name: 'Procter & Gamble Company', sector: 'Consumer Defensive', industry: 'Household Products' },
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated', sector: 'Healthcare', industry: 'Healthcare Plans' },
  { symbol: 'HD', name: 'The Home Depot Inc.', sector: 'Consumer Cyclical', industry: 'Home Improvement' },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Communication Services', industry: 'Entertainment' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'BAC', name: 'Bank of America Corporation', sector: 'Financial Services', industry: 'Banking' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', sector: 'Consumer Defensive', industry: 'Discount Stores' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', industry: 'Pharmaceuticals' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', industry: 'Pharmaceuticals' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer Defensive', industry: 'Beverages' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Defensive', industry: 'Beverages' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', sector: 'Healthcare', industry: 'Diagnostics' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare', industry: 'Pharmaceuticals' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', sector: 'Technology', industry: 'Networking' },
  { symbol: 'ACN', name: 'Accenture plc', sector: 'Technology', industry: 'IT Services' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', industry: 'Software' },
  { symbol: 'NKE', name: 'NIKE Inc.', sector: 'Consumer Cyclical', industry: 'Footwear' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services', industry: 'Entertainment' },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology', industry: 'Software' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', industry: 'Software' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare', industry: 'Medical Devices' },
  { symbol: 'DHR', name: 'Danaher Corporation', sector: 'Healthcare', industry: 'Diagnostics' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare', industry: 'Pharmaceuticals' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', sector: 'Communication Services', industry: 'Telecom' },
  { symbol: 'TXN', name: 'Texas Instruments Incorporated', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Communication Services', industry: 'Entertainment' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Financial Services', industry: 'Banking' },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb Company', sector: 'Healthcare', industry: 'Pharmaceuticals' },
  { symbol: 'QCOM', name: 'QUALCOMM Incorporated', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financial Services', industry: 'Banking' },
  { symbol: 'UPS', name: 'United Parcel Service Inc.', sector: 'Industrials', industry: 'Package Delivery' },
  { symbol: 'HON', name: 'Honeywell International Inc.', sector: 'Industrials', industry: 'Conglomerates' },
  { symbol: 'LOW', name: "Lowe's Companies Inc.", sector: 'Consumer Cyclical', industry: 'Home Improvement' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo users
  console.log('Creating demo users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const demoUser1 = await prisma.user.upsert({
    where: { email: 'analyst1@example.com' },
    update: {},
    create: {
      email: 'analyst1@example.com',
      name: 'Sarah Johnson',
      password: hashedPassword,
      bio: 'Professional stock analyst with 10 years of experience in tech sector analysis.',
    },
  });

  const demoUser2 = await prisma.user.upsert({
    where: { email: 'analyst2@example.com' },
    update: {},
    create: {
      email: 'analyst2@example.com',
      name: 'Michael Chen',
      password: hashedPassword,
      bio: 'Quantitative analyst specializing in momentum trading strategies.',
    },
  });

  console.log(`Created demo users: ${demoUser1.email}, ${demoUser2.email}`);

  // Create S&P 500 stocks
  console.log('Creating S&P 500 stocks...');
  for (const stock of sp500Stocks) {
    await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: {},
      create: stock,
    });
  }
  console.log(`Created ${sp500Stocks.length} S&P 500 stocks`);

  // Create sample predictions
  console.log('Creating sample predictions...');
  const appleStock = await prisma.stock.findUnique({ where: { symbol: 'AAPL' } });
  const teslaStock = await prisma.stock.findUnique({ where: { symbol: 'TSLA' } });

  if (appleStock && teslaStock) {
    const now = new Date();

    await prisma.prediction.create({
      data: {
        userId: demoUser1.id,
        stockId: appleStock.id,
        currentPrice: 175.50,
        price7d: 180.00,
        price28d: 185.00,
        price60d: 190.00,
        price90d: 195.00,
        price180d: 205.00,
        price365d: 220.00,
        targetDate7d: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        targetDate28d: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
        targetDate60d: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        targetDate90d: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        targetDate180d: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
        targetDate365d: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        isLocked: false,
      },
    });

    await prisma.prediction.create({
      data: {
        userId: demoUser2.id,
        stockId: teslaStock.id,
        currentPrice: 245.00,
        price7d: 250.00,
        price28d: 260.00,
        price60d: 270.00,
        price90d: 280.00,
        price180d: 300.00,
        price365d: 350.00,
        targetDate7d: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        targetDate28d: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
        targetDate60d: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        targetDate90d: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        targetDate180d: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
        targetDate365d: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        isLocked: false,
      },
    });

    console.log('Created sample predictions');
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
