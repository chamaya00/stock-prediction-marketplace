import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY;

if (!MASSIVE_API_KEY) {
  console.error('❌ MASSIVE_API_KEY environment variable is not set');
  process.exit(1);
}

interface MassiveBar {
  t: number;  // timestamp
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
}

interface MassiveResponse {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results?: MassiveBar[];
  status: string;
  message?: string;
}

/**
 * Fetch daily aggregates (OHLC) data for a stock symbol
 * API Docs: https://polygon.io/docs/stocks/get_v2_aggs_ticker__stocksticker__range__multiplier___timespan___from___to
 */
async function fetchDailyAggregates(symbol: string): Promise<MassiveBar[]> {
  // Get 2 years of historical data (free tier allows 2 years)
  const to = new Date();
  to.setDate(to.getDate() - 1); // Yesterday
  const from = new Date();
  from.setFullYear(from.getFullYear() - 2); // 2 years ago

  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc&apiKey=${MASSIVE_API_KEY}`;

  console.log(`   Fetching: ${fromStr} to ${toStr}`);

  try {
    const response = await fetch(url);
    const data: MassiveResponse = await response.json();

    if (data.status === 'ERROR') {
      console.error(`   ❌ API Error: ${data.message}`);
      return [];
    }

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      console.log(`   ✓ Received ${data.results.length} price bars`);
      return data.results;
    }

    console.warn(`   ⚠️  No data returned for ${symbol}`);
    return [];
  } catch (error) {
    console.error(`   ❌ Fetch error:`, error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Populate all stocks with historical price data
 */
async function populateAllStocks() {
  console.log('🚀 Starting historical price population...\n');

  // Fetch all stocks from database
  const stocks = await prisma.stock.findMany({
    orderBy: { symbol: 'asc' }
  });

  console.log(`📊 Found ${stocks.length} stocks in database\n`);

  let successCount = 0;
  let errorCount = 0;
  let totalPricesInserted = 0;

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    const progress = `[${i + 1}/${stocks.length}]`;

    console.log(`${progress} Processing ${stock.symbol} (${stock.name})...`);

    try {
      // Fetch historical data from Massive API
      const bars = await fetchDailyAggregates(stock.symbol);

      if (bars.length === 0) {
        console.log(`   ⚠️  Skipping - no data available\n`);
        errorCount++;

        // Still respect rate limit even on skip
        if (i < stocks.length - 1) {
          await sleep(12000); // 5 calls/min = 12 seconds
        }
        continue;
      }

      // Transform and insert into database
      const priceRecords = bars.map(bar => ({
        stockId: stock.id,
        date: new Date(bar.t),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: BigInt(bar.v)
      }));

      // Bulk insert with upsert behavior (skip duplicates)
      const result = await prisma.stockPrice.createMany({
        data: priceRecords,
        skipDuplicates: true
      });

      totalPricesInserted += result.count;
      successCount++;

      console.log(`   ✓ Inserted ${result.count} price records`);
      console.log(`   📈 Latest close: $${bars[bars.length - 1].c.toFixed(2)} on ${new Date(bars[bars.length - 1].t).toISOString().split('T')[0]}\n`);

    } catch (error) {
      console.error(`   ❌ Error processing ${stock.symbol}:`, error instanceof Error ? error.message : 'Unknown error');
      console.log('');
      errorCount++;
    }

    // Rate limit: 5 calls/min = 12 seconds between calls
    if (i < stocks.length - 1) {
      const waitTime = 12;
      console.log(`   ⏳ Waiting ${waitTime}s for rate limit...\n`);
      await sleep(waitTime * 1000);
    }
  }

  console.log('✅ Population complete!\n');
  console.log('📊 Summary:');
  console.log(`   ✓ Successful: ${successCount} stocks`);
  console.log(`   ✗ Failed: ${errorCount} stocks`);
  console.log(`   📈 Total prices inserted: ${totalPricesInserted.toLocaleString()}`);
  console.log(`   ⏱️  Estimated time: ${Math.round((stocks.length * 12) / 60)} minutes`);
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
populateAllStocks()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
