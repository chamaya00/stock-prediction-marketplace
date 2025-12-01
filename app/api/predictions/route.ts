import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const predictionSchema = z.object({
  stockId: z.string(),
  currentPrice: z.number().positive(),
  price7d: z.number().positive().optional(),
  price28d: z.number().positive().optional(),
  price60d: z.number().positive().optional(),
  price90d: z.number().positive().optional(),
  price180d: z.number().positive().optional(),
  price365d: z.number().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = predictionSchema.parse(body);

    // Check if stock exists
    const stock = await prisma.stock.findUnique({
      where: { id: validatedData.stockId },
    });

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // Calculate target dates
    const now = new Date();
    const targetDates = {
      targetDate7d: validatedData.price7d ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
      targetDate28d: validatedData.price28d ? new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000) : null,
      targetDate60d: validatedData.price60d ? new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) : null,
      targetDate90d: validatedData.price90d ? new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) : null,
      targetDate180d: validatedData.price180d ? new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000) : null,
      targetDate365d: validatedData.price365d ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) : null,
    };

    // Create prediction
    const prediction = await prisma.prediction.create({
      data: {
        userId: session.user.id,
        stockId: validatedData.stockId,
        currentPrice: validatedData.currentPrice,
        price7d: validatedData.price7d,
        price28d: validatedData.price28d,
        price60d: validatedData.price60d,
        price90d: validatedData.price90d,
        price180d: validatedData.price180d,
        price365d: validatedData.price365d,
        ...targetDates,
        isLocked: false,
      },
      include: {
        stock: true,
      },
    });

    return NextResponse.json(
      { prediction, message: 'Prediction created successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Prediction creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create prediction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stockId = searchParams.get('stockId');

    const where = {
      userId: session.user.id,
      ...(stockId && { stockId }),
    };

    const predictions = await prisma.prediction.findMany({
      where,
      include: {
        stock: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ predictions, count: predictions.length });
  } catch (error) {
    console.error('Predictions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}
