import { NextRequest, NextResponse } from 'next/server';
import { mockStocks, isDemoMode } from '@/lib/mock-data';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Demo mode - return mock data
    if (isDemoMode()) {
      let stocks = mockStocks;
      if (search) {
        const searchLower = search.toLowerCase();
        stocks = mockStocks.filter(
          s => s.symbol.toLowerCase().includes(searchLower) ||
               s.name.toLowerCase().includes(searchLower)
        );
      }
      return NextResponse.json({
        stocks,
        count: stocks.length,
        demoMode: true
      });
    }

    // Production mode
    const sector = searchParams.get('sector');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = {
      ...(search && {
        OR: [
          { symbol: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(sector && { sector }),
    };

    const stocks = await prisma.stock.findMany({
      where,
      take: limit,
      orderBy: { symbol: 'asc' },
    });

    return NextResponse.json({ stocks, count: stocks.length });
  } catch (error) {
    console.error('Stocks API error:', error);
    // Fallback to demo mode on error
    return NextResponse.json({
      stocks: mockStocks,
      count: mockStocks.length,
      demoMode: true
    });
  }
}
