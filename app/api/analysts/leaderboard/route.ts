import { NextRequest, NextResponse } from 'next/server';
import { mockUsers, isDemoMode } from '@/lib/mock-data';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';

    // Demo mode - return mock data
    if (isDemoMode()) {
      return NextResponse.json({
        leaderboard: [
          {
            user: mockUsers[1],
            averageAccuracy: 0.81,
            predictionCount: 5,
          },
          {
            user: mockUsers[0],
            averageAccuracy: 1.68,
            predictionCount: 3,
          },
        ],
        timeframe,
        demoMode: true
      });
    }

    // Production mode
    const limit = parseInt(searchParams.get('limit') || '50');
    const accuracyField = `accuracy${timeframe}` as any;

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

    const userStats = predictions.reduce((acc: Record<string, any>, pred: any) => {
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
    // Fallback to demo mode
    return NextResponse.json({
      leaderboard: [
        {
          user: mockUsers[1],
          averageAccuracy: 0.81,
          predictionCount: 5,
        },
        {
          user: mockUsers[0],
          averageAccuracy: 1.68,
          predictionCount: 3,
        },
      ],
      timeframe: '7d',
      demoMode: true
    });
  }
}
