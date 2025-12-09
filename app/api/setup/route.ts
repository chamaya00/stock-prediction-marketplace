import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// This endpoint should be removed after initial setup
export async function GET(request: NextRequest) {
  try {
    // Verify secret for security
    const secret = request.nextUrl.searchParams.get('secret');

    if (secret !== process.env.SETUP_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import seed logic
    const { seedDatabase } = await import('@/lib/seed-helper');
    await seedDatabase();

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully'
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({
      error: 'Setup failed',
      details: error.message
    }, { status: 500 });
  }
}
