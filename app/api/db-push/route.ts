import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

// This endpoint creates database tables - run once then remove
export async function GET(request: NextRequest) {
  try {
    // Verify secret for security
    const secret = request.nextUrl.searchParams.get('secret');

    if (secret !== process.env.SETUP_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run prisma db push to create tables
    console.log('Running prisma db push...');
    const output = execSync('npx prisma db push --accept-data-loss', {
      encoding: 'utf-8',
      env: process.env,
    });

    console.log('Prisma output:', output);

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully',
      output: output,
    });
  } catch (error: any) {
    console.error('Database push error:', error);
    return NextResponse.json({
      error: 'Failed to create tables',
      details: error.message,
      stderr: error.stderr?.toString(),
    }, { status: 500 });
  }
}
