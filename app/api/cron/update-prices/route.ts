import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
 */
async function fetchDailyOpenClose(symbol: string, date: string): Promise<DailyOpenClose | null> {
  const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY;

  if (!MASSIVE_API_KEY) {
    throw new Error('MASSIVE_API_KEY not configured');
  }

  const url = `https://api.polygon.io/v1/open-close/${symbol}/${date}?adjusted=true&apiKey=${MASSIVE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data: DailyOpenClose = await response.json();

    if (data.status === 'OK') {
      return data;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cron endpoint to update stock prices daily
 * Secured with CRON_SECRET
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting daily price update...');

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
    console.log(`Fetching prices for: ${dateStr}`);

    // Fetch all stocks
    const stocks = await prisma.stock.findMany({
      orderBy: { symbol: 'asc' }
    });

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Process stocks in batches to respect rate limits
    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];

      try {
        const data = await fetchDailyOpenClose(stock.symbol, dateStr);

        if (!data) {
          skipCount++;
          continue;
        }

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

        successCount++;
      } catch (error) {
        console.error(`Error processing ${stock.symbol}:`, error);
        errorCount++;
      }

      // Rate limit: 5 calls/min = 12 seconds between calls
      if (i < stocks.length - 1) {
        await sleep(12000);
      }
    }

    const summary = {
      success: true,
      date: dateStr,
      updated: successCount,
      skipped: skipCount,
      errors: errorCount,
      total: stocks.length
    };

    console.log('Daily update complete:', summary);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Cron job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Ensure this route can run for up to 10 minutes (600 seconds)
// Vercel Pro allows up to 300 seconds for serverless functions
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';
