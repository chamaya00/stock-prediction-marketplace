import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY;

if (!MASSIVE_API_KEY) {
  console.error('❌ MASSIVE_API_KEY environment variable is not set');
  process.exit(1);
}

interface DailyOpenClose {
  status: string;
  from: string;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  afterHours?: number;
  preMarket?: number;
}

/**
 * Fetch previous day's OHLC data for a single stock
 * API Docs: https://polygon.io/docs/stocks/get_v1_open-close__stocksticker___date
 */
async function fetchDailyOpenClose(symbol: string, date: string): Promise<DailyOpenClose | null> {
  const url = `https://api.polygon.io/v1/open-close/${symbol}/${date}?adjusted=true&apiKey=${MASSIVE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data: DailyOpenClose = await response.json();

    if (data.status === 'OK') {
      return data;
    }

    // Status might be "NOT_FOUND" for weekends/holidays
    return null;
  } catch (error) {
    console.error(`   ❌ Error fetching ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Update all stocks with yesterday's closing prices
 */
async function updateDailyPrices() {
  console.log('📅 Starting daily price update...\n');

  // Calculate yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // If yesterday was a weekend, find the last trading day (Friday)
  const dayOfWeek = yesterday.getDay();
  if (dayOfWeek === 0) { // Sunday
    yesterday.setDate(yesterday.getDate() - 2);
  } else if (dayOfWeek === 6) { // Saturday
    yesterday.setDate(yesterday.getDate() - 1);
  }

  const dateStr = yesterday.toISOString().split('T')[0];
  console.log(`📊 Fetching prices for: ${dateStr} (${yesterday.toLocaleDateString('en-US', { weekday: 'long' })})\n`);

  // Fetch all stocks
  const stocks = await prisma.stock.findMany({
    orderBy: { symbol: 'asc' }
  });

  console.log(`📈 Updating ${stocks.length} stocks...\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    const progress = `[${i + 1}/${stocks.length}]`;

    console.log(`${progress} ${stock.symbol}...`);

    try {
      const data = await fetchDailyOpenClose(stock.symbol, dateStr);

      if (!data) {
        console.log(`   ⚠️  No data (market closed or holiday)`);
        skipCount++;
      } else {
        // Upsert the price data
        await prisma.stockPrice.upsert({
          where: {
            stockId_date: {
              stockId: stock.id,
              date: new Date(data.from)
            }
          },
          create: {
            stockId: stock.id,
            date: new Date(data.from),
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: BigInt(data.volume)
          },
          update: {
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: BigInt(data.volume)
          }
        });

        console.log(`   ✓ Close: $${data.close.toFixed(2)}, Volume: ${data.volume.toLocaleString()}`);
        successCount++;
      }

    } catch (error) {
      console.error(`   ❌ Error:`, error instanceof Error ? error.message : 'Unknown error');
      errorCount++;
    }

    // Rate limit: 5 calls/min = 12 seconds between calls
    if (i < stocks.length - 1) {
      await sleep(12000);
    }
  }

  console.log('\n✅ Daily update complete!\n');
  console.log('📊 Summary:');
  console.log(`   ✓ Updated: ${successCount} stocks`);
  console.log(`   ⚠️  Skipped: ${skipCount} stocks (no data)`);
  console.log(`   ✗ Errors: ${errorCount} stocks`);
  console.log(`   ⏱️  Time taken: ${Math.round((stocks.length * 12) / 60)} minutes`);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution
 */
updateDailyPrices()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
