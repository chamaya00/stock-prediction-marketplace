import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mockUsers, mockPredictions, isDemoMode } from '@/lib/mock-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Demo mode - return mock data
    if (isDemoMode()) {
      const mockUser = mockUsers.find(u => u.id === params.id);

      if (!mockUser) {
        return NextResponse.json(
          { error: 'Analyst not found' },
          { status: 404 }
        );
      }

      const userPredictions = mockPredictions.filter(p => p.userId === params.id);

      return NextResponse.json({
        analyst: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          bio: mockUser.bio,
          createdAt: mockUser.createdAt,
          predictions: userPredictions,
          stats: {
            totalPredictions: userPredictions.length,
            lockedPredictions: userPredictions.filter((p: any) => p.isLocked).length,
            accuracy7d: calculateAverageAccuracy(userPredictions, 'accuracy7d'),
            accuracy28d: calculateAverageAccuracy(userPredictions, 'accuracy28d'),
            accuracy60d: calculateAverageAccuracy(userPredictions, 'accuracy60d'),
            accuracy90d: calculateAverageAccuracy(userPredictions, 'accuracy90d'),
            accuracy180d: calculateAverageAccuracy(userPredictions, 'accuracy180d'),
            accuracy365d: calculateAverageAccuracy(userPredictions, 'accuracy365d'),
          },
        },
        demoMode: true
      });
    }

    // Production mode
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
          orderBy: { createdAt: 'desc' as const },
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
    const lockedPredictions = analyst.predictions.filter((p: any) => p.isLocked).length;

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
    // Fallback to demo mode on error
    if (params.id === 'user-1' || params.id === 'user-2') {
      const mockUser = mockUsers.find(u => u.id === params.id);
      const userPredictions = mockPredictions.filter(p => p.userId === params.id);

      if (mockUser) {
        return NextResponse.json({
          analyst: {
            ...mockUser,
            predictions: userPredictions,
            stats: {
              totalPredictions: userPredictions.length,
              lockedPredictions: userPredictions.filter((p: any) => p.isLocked).length,
              accuracy7d: null,
              accuracy28d: null,
              accuracy60d: null,
              accuracy90d: null,
              accuracy180d: null,
              accuracy365d: null,
            },
          },
          demoMode: true
        });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch analyst profile' },
      { status: 500 }
    );
  }
}

function calculateAverageAccuracy(predictions: any[], field: string): number | null {
  const validPredictions = predictions.filter((p: any) => p[field] !== null);

  if (validPredictions.length === 0) return null;

  const sum = validPredictions.reduce((acc: number, p: any) => acc + Math.abs(p[field]), 0);
  return sum / validPredictions.length;
}
