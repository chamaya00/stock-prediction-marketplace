import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
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
    return NextResponse.json(
      { error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}
