import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analyst = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        createdAt: true,
        predictions: {
          include: {
            stock: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!analyst) {
      return NextResponse.json(
        { error: 'Analyst not found' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const totalPredictions = analyst.predictions.length;
    const lockedPredictions = analyst.predictions.filter(p => p.isLocked).length;

    // Calculate average accuracy for each timeframe
    const accuracyStats = {
      accuracy7d: calculateAverageAccuracy(analyst.predictions, 'accuracy7d'),
      accuracy28d: calculateAverageAccuracy(analyst.predictions, 'accuracy28d'),
      accuracy60d: calculateAverageAccuracy(analyst.predictions, 'accuracy60d'),
      accuracy90d: calculateAverageAccuracy(analyst.predictions, 'accuracy90d'),
      accuracy180d: calculateAverageAccuracy(analyst.predictions, 'accuracy180d'),
      accuracy365d: calculateAverageAccuracy(analyst.predictions, 'accuracy365d'),
    };

    return NextResponse.json({
      analyst: {
        ...analyst,
        stats: {
          totalPredictions,
          lockedPredictions,
          ...accuracyStats,
        },
      },
    });
  } catch (error) {
    console.error('Analyst profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyst profile' },
      { status: 500 }
    );
  }
}

function calculateAverageAccuracy(predictions: any[], field: string): number | null {
  const validPredictions = predictions.filter(p => p[field] !== null);

  if (validPredictions.length === 0) return null;

  const sum = validPredictions.reduce((acc, p) => acc + Math.abs(p[field]), 0);
  return sum / validPredictions.length;
}
