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

  try {
    const response = await fetch(url);
    const data: MassiveResponse = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results;
    }

    return [];
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return [];
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  try {
    // Verify admin secret
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const secret = authHeader?.replace('Bearer ', '') || searchParams.get('secret');

    if (secret !== process.env.ADMIN_SECRET) {
      return new NextResponse('Unauthorized - Invalid admin secret', { status: 401 });
    }

    console.log('Starting historical price population...');

    const stocks = await prisma.stock.findMany({
      orderBy: { symbol: 'asc' }
    });

    let successCount = 0;
    let errorCount = 0;
    let totalPricesInserted = 0;
    const results = [];

    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];

      try {
        console.log(`[${i + 1}/${stocks.length}] Processing ${stock.symbol}...`);

        const bars = await fetchDailyAggregates(stock.symbol);

        if (bars.length === 0) {
          errorCount++;
          results.push({
            symbol: stock.symbol,
            success: false,
            message: 'No data available'
          });

          if (i < stocks.length - 1) {
            await sleep(12000);
          }
          continue;
        }

        const priceRecords = bars.map(bar => ({
          stockId: stock.id,
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

        totalPricesInserted += result.count;
        successCount++;

        results.push({
          symbol: stock.symbol,
          success: true,
          pricesInserted: result.count,
          latestClose: bars[bars.length - 1].c,
          latestDate: new Date(bars[bars.length - 1].t).toISOString().split('T')[0]
        });

        console.log(`✓ ${stock.symbol}: Inserted ${result.count} records`);

      } catch (error) {
        console.error(`Error processing ${stock.symbol}:`, error);
        errorCount++;
        results.push({
          symbol: stock.symbol,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Rate limit: 5 calls/min = 12 seconds between calls
      if (i < stocks.length - 1) {
        await sleep(12000);
      }
    }

    const summary = {
      success: true,
      completed: true,
      totalStocks: stocks.length,
      successCount,
      errorCount,
      totalPricesInserted,
      estimatedTime: `${Math.round((stocks.length * 12) / 60)} minutes`,
      results
    };

    console.log('Population complete:', summary);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Population failed:', error);

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

// Allow long execution time (Vercel Pro allows up to 300 seconds)
export const maxDuration = 300;
export const dynamic = 'force-dynamic';
