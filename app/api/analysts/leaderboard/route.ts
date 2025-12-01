import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Map timeframe to accuracy field
    const accuracyField = `accuracy${timeframe}` as any;

    // Get all predictions with accuracy data
    const predictions = await prisma.prediction.findMany({
      where: {
        isLocked: true,
        [accuracyField]: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
          },
        },
      },
    });

    // Calculate average accuracy per user
    const userStats = predictions.reduce((acc, pred) => {
      const userId = pred.user.id;
      const accuracy = (pred as any)[accuracyField];

      if (!acc[userId]) {
        acc[userId] = {
          user: pred.user,
          totalAccuracy: 0,
          count: 0,
          predictions: [],
        };
      }

      acc[userId].totalAccuracy += Math.abs(accuracy);
      acc[userId].count += 1;
      acc[userId].predictions.push(pred);

      return acc;
    }, {} as Record<string, any>);

    // Calculate average and sort by accuracy (lower is better)
    const leaderboard = Object.values(userStats)
      .map((stat: any) => ({
        user: stat.user,
        averageAccuracy: stat.totalAccuracy / stat.count,
        predictionCount: stat.count,
        predictions: stat.predictions,
      }))
      .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
      .slice(0, limit);

    return NextResponse.json({ leaderboard, timeframe });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
