import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const prediction = await prisma.prediction.findUnique({
      where: { id: params.id },
      include: {
        stock: true,
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

    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    // Only allow users to see their own predictions (or make public later)
    if (prediction.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ prediction });
  } catch (error) {
    console.error('Prediction detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prediction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const prediction = await prisma.prediction.findUnique({
      where: { id: params.id },
    });

    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    if (prediction.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (prediction.isLocked) {
      return NextResponse.json(
        { error: 'Cannot delete locked prediction' },
        { status: 400 }
      );
    }

    await prisma.prediction.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Prediction deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Prediction deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete prediction' },
      { status: 500 }
    );
  }
}
