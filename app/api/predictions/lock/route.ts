import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint would be called by a cron job daily (e.g., Vercel Cron)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (set in environment variables)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day

    // Lock all predictions created before today that aren't locked yet
    const result = await prisma.prediction.updateMany({
      where: {
        isLocked: false,
        createdAt: {
          lt: now,
        },
      },
      data: {
        isLocked: true,
        lockedAt: new Date(),
      },
    });

    console.log(`Locked ${result.count} predictions`);

    return NextResponse.json({
      message: 'Predictions locked successfully',
      count: result.count,
    });
  } catch (error) {
    console.error('Lock predictions error:', error);
    return NextResponse.json(
      { error: 'Failed to lock predictions' },
      { status: 500 }
    );
  }
}
