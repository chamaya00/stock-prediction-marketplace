import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MassiveBar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
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

async function fetchDailyAggregates(symbol: string): Promise<MassiveBar[]> {
  const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY;

  if (!MASSIVE_API_KEY) {
    throw new Error('MASSIVE_API_KEY not configured');
  }

  const to = new Date();
  to.setDate(to.getDate() - 1);
  const from = new Date();
  from.setFullYear(from.getFullYear() - 2);

  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc&apiKey=${MASSIVE_API_KEY}`;

  const response = await fetch(url);
  const data: MassiveResponse = await response.json();

  if (data.status === 'OK' && data.results && data.results.length > 0) {
    return data.results;
  }

  return [];
}

/**
 * Chunked endpoint that processes ONE stock at a time
 * Designed to work within Vercel free tier 10-second timeout
 */
export async function POST(request: Request) {
  try {
    // Verify admin secret
    const { secret } = await request.json();

    if (secret !== process.env.ADMIN_SECRET) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find next stock that hasn't been populated yet (no prices)
    const stockWithoutPrices = await prisma.stock.findFirst({
      where: {
        prices: {
          none: {}
        }
      },
      orderBy: {
        symbol: 'asc'
      }
    });

    // If no stock found, all are done!
    if (!stockWithoutPrices) {
      const totalStocks = await prisma.stock.count();
      const stocksWithPrices = await prisma.stock.count({
        where: {
          prices: {
            some: {}
          }
        }
      });

      const totalPrices = await prisma.stockPrice.count();

      return NextResponse.json({
        completed: true,
        message: 'All stocks have been populated!',
        totalStocks,
        stocksCompleted: stocksWithPrices,
        totalPrices
      });
    }

    // Process this stock
    console.log(`Processing ${stockWithoutPrices.symbol}...`);

    const bars = await fetchDailyAggregates(stockWithoutPrices.symbol);

    if (bars.length === 0) {
      // No data available, but mark as "attempted" by creating a single dummy record
      // Or we could skip it - for now, return error
      return NextResponse.json({
        completed: false,
        error: `No data available for ${stockWithoutPrices.symbol}`,
        symbol: stockWithoutPrices.symbol,
        progress: await getProgress()
      }, { status: 400 });
    }

    const priceRecords = bars.map(bar => ({
      stockId: stockWithoutPrices.id,
      date: new Date(bar.t),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: BigInt(bar.v)
    }));

    const result = await prisma.stockPrice.createMany({
      data: priceRecords,
      skipDuplicates: true
    });

    const latestBar = bars[bars.length - 1];
    const progress = await getProgress();

    return NextResponse.json({
      completed: false,
      success: true,
      symbol: stockWithoutPrices.symbol,
      name: stockWithoutPrices.name,
      pricesInserted: result.count,
      latestClose: latestBar.c,
      latestDate: new Date(latestBar.t).toISOString().split('T')[0],
      progress
    });

  } catch (error) {
    console.error('Population chunk failed:', error);

    return NextResponse.json(
      {
        completed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: await getProgress()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function getProgress() {
  const totalStocks = await prisma.stock.count();
  const stocksWithPrices = await prisma.stock.count({
    where: {
      prices: {
        some: {}
      }
    }
  });
  const totalPrices = await prisma.stockPrice.count();

  return {
    totalStocks,
    completed: stocksWithPrices,
    remaining: totalStocks - stocksWithPrices,
    totalPrices,
    percentComplete: Math.round((stocksWithPrices / totalStocks) * 100)
  };
}

export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel free tier limit
