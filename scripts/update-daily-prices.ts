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
 * Fetch OHLC data for a single stock on a specific date
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
    console.error(`   ❌ Error fetching ${symbol} on ${date}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Get the last trading day (skip weekends)
 */
function getLastTradingDay(): Date {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dayOfWeek = yesterday.getDay();

  // If yesterday was Sunday (0), go back to Friday
  if (dayOfWeek === 0) {
    yesterday.setDate(yesterday.getDate() - 2);
  }
  // If yesterday was Saturday (6), go back to Friday
  else if (dayOfWeek === 6) {
    yesterday.setDate(yesterday.getDate() - 1);
  }

  return yesterday;
}

/**
 * Get all dates between two dates (inclusive)
 */
function getDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Smart update: Fetches all missing dates up to the most recent trading day
 */
async function updateStockPrices() {
  console.log('📅 Starting smart daily price update...\n');

  const lastTradingDay = getLastTradingDay();
  const targetDate = lastTradingDay.toISOString().split('T')[0];

  console.log(`🎯 Target date: ${targetDate} (${lastTradingDay.toLocaleDateString('en-US', { weekday: 'long' })})\n`);

  // Fetch all stocks
  const stocks = await prisma.stock.findMany({
    include: {
      prices: {
        orderBy: { date: 'desc' },
        take: 1
      }
    },
    orderBy: { symbol: 'asc' }
  });

  console.log(`📊 Checking ${stocks.length} stocks for missing data...\n`);

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let stocksProcessed = 0;

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    const progress = `[${i + 1}/${stocks.length}]`;

    // Get the latest date we have for this stock
    const latestPrice = stock.prices[0];
    const latestDate = latestPrice ? new Date(latestPrice.date) : null;

    let startDate: Date;

    if (!latestDate) {
      // No data at all - this shouldn't happen after initial population
      // but just in case, start from 7 days ago
      startDate = new Date(lastTradingDay);
      startDate.setDate(startDate.getDate() - 7);
      console.log(`${progress} ${stock.symbol} - No data found, fetching last 7 days`);
    } else {
      // Calculate days since last update
      const latestDateOnly = new Date(latestDate.toISOString().split('T')[0]);
      const daysSinceUpdate = Math.floor((lastTradingDay.getTime() - latestDateOnly.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceUpdate <= 0) {
        console.log(`${progress} ${stock.symbol} - ✅ Already up to date (${latestDate.toISOString().split('T')[0]})`);
        totalSkipped++;
        continue;
      }

      startDate = new Date(latestDateOnly);
      startDate.setDate(startDate.getDate() + 1); // Start from day after latest

      console.log(`${progress} ${stock.symbol} - Updating ${daysSinceUpdate} missing days since ${latestDate.toISOString().split('T')[0]}`);
    }

    // Get all trading days between start and target date
    const missingDates = getDateRange(startDate, lastTradingDay);

    if (missingDates.length === 0) {
      console.log(`   ℹ️  No missing dates`);
      totalSkipped++;
      continue;
    }

    let successCount = 0;
    let skipCount = 0;

    // Fetch each missing date
    for (const dateStr of missingDates) {
      try {
        const data = await fetchDailyOpenClose(stock.symbol, dateStr);

        if (!data) {
          // Market closed or no data (holiday, etc.)
          skipCount++;
          continue;
        }

        // Insert the price data
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

        successCount++;

        // Rate limit: 5 calls/min = 12 seconds between calls
        if (missingDates.indexOf(dateStr) < missingDates.length - 1) {
          await sleep(12000);
        }

      } catch (error) {
        console.error(`   ❌ Error fetching ${dateStr}:`, error instanceof Error ? error.message : 'Unknown error');
        totalErrors++;
      }
    }

    if (successCount > 0) {
      console.log(`   ✅ Added ${successCount} days, skipped ${skipCount} (holidays/weekends)`);
      totalUpdated += successCount;
      stocksProcessed++;
    } else {
      console.log(`   ⚠️  No new data available (${skipCount} days were holidays/market closed)`);
    }

    // Rate limit between stocks (if we're going to the next stock)
    if (i < stocks.length - 1 && successCount > 0) {
      await sleep(12000);
    }
  }

  console.log('\n✅ Daily update complete!\n');
  console.log('📊 Summary:');
  console.log(`   📈 Stocks processed: ${stocksProcessed}`);
  console.log(`   ✅ New prices added: ${totalUpdated}`);
  console.log(`   ⏭️  Already up to date: ${totalSkipped}`);
  console.log(`   ❌ Errors: ${totalErrors}`);

  if (totalUpdated > 0) {
    console.log(`\n🎉 Successfully added ${totalUpdated} new price records!`);
  } else if (totalSkipped === stocks.length) {
    console.log(`\n✨ All stocks are already up to date!`);
  }
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
updateStockPrices()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
