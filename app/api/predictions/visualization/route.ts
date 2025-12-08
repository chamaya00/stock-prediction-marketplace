import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all stocks with their predictions and historical prices
    const stocks = await prisma.stock.findMany({
      include: {
        predictions: {
          where: {
            isLocked: true, // Only include locked predictions
          },
          select: {
            price7d: true,
            price28d: true,
            price60d: true,
            price90d: true,
            price180d: true,
            price365d: true,
            targetDate7d: true,
            targetDate28d: true,
            targetDate60d: true,
            targetDate90d: true,
            targetDate180d: true,
            targetDate365d: true,
            createdAt: true,
          },
        },
        prices: {
          orderBy: {
            date: 'asc',
          },
          select: {
            date: true,
            close: true,
          },
        },
      },
    });

    // Process each stock to calculate aggregate predictions
    const visualizationData = stocks.map((stock) => {
      // Map to store predictions grouped by target date
      const predictionsByDate = new Map<string, number[]>();

      // Process all predictions for this stock
      stock.predictions.forEach((pred) => {
        const timeframes = [
          { price: pred.price7d, targetDate: pred.targetDate7d },
          { price: pred.price28d, targetDate: pred.targetDate28d },
          { price: pred.price60d, targetDate: pred.targetDate60d },
          { price: pred.price90d, targetDate: pred.targetDate90d },
          { price: pred.price180d, targetDate: pred.targetDate180d },
          { price: pred.price365d, targetDate: pred.targetDate365d },
        ];

        timeframes.forEach(({ price, targetDate }) => {
          if (price && targetDate) {
            const dateKey = targetDate.toISOString().split('T')[0];
            if (!predictionsByDate.has(dateKey)) {
              predictionsByDate.set(dateKey, []);
            }
            predictionsByDate.get(dateKey)!.push(price);
          }
        });
      });

      // Calculate percentiles for each date
      const futurePredictions = Array.from(predictionsByDate.entries())
        .map(([dateKey, predictions]) => {
          const sorted = [...predictions].sort((a, b) => a - b);
          const n = sorted.length;

          const p5 = sorted[Math.floor(n * 0.05)] || sorted[0];
          const p50 = sorted[Math.floor(n * 0.5)] || sorted[Math.floor(n / 2)];
          const p95 = sorted[Math.floor(n * 0.95)] || sorted[n - 1];

          return {
            date: dateKey,
            p5,
            p50,
            p95,
            count: n,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      // Format historical prices
      const historicalPrices = stock.prices.map((price) => ({
        date: price.date.toISOString().split('T')[0],
        close: price.close,
      }));

      return {
        stockId: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        industry: stock.industry,
        historicalPrices,
        futurePredictions,
        predictionCount: stock.predictions.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: visualizationData,
    });
  } catch (error) {
    console.error('Error fetching prediction visualization data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch visualization data',
      },
      { status: 500 }
    );
  }
}
