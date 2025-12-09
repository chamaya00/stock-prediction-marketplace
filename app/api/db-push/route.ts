import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// This endpoint creates database tables - run once then remove
export async function GET(request: NextRequest) {
  try {
    // Verify secret for security
    const secret = request.nextUrl.searchParams.get('secret');

    if (secret !== process.env.SETUP_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create tables using raw SQL (one at a time)
    console.log('Creating database tables...');

    // Create users table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "bio" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `);

    // Create stocks table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "stocks" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "symbol" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "sector" TEXT,
        "industry" TEXT,
        "marketCap" DOUBLE PRECISION,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `);

    // Create predictions table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "predictions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "stockId" TEXT NOT NULL,
        "currentPrice" DOUBLE PRECISION NOT NULL,
        "price7d" DOUBLE PRECISION,
        "price28d" DOUBLE PRECISION,
        "price60d" DOUBLE PRECISION,
        "price90d" DOUBLE PRECISION,
        "price180d" DOUBLE PRECISION,
        "price365d" DOUBLE PRECISION,
        "targetDate7d" TIMESTAMP(3),
        "targetDate28d" TIMESTAMP(3),
        "targetDate60d" TIMESTAMP(3),
        "targetDate90d" TIMESTAMP(3),
        "targetDate180d" TIMESTAMP(3),
        "targetDate365d" TIMESTAMP(3),
        "actualPrice7d" DOUBLE PRECISION,
        "actualPrice28d" DOUBLE PRECISION,
        "actualPrice60d" DOUBLE PRECISION,
        "actualPrice90d" DOUBLE PRECISION,
        "actualPrice180d" DOUBLE PRECISION,
        "actualPrice365d" DOUBLE PRECISION,
        "accuracy7d" DOUBLE PRECISION,
        "accuracy28d" DOUBLE PRECISION,
        "accuracy60d" DOUBLE PRECISION,
        "accuracy90d" DOUBLE PRECISION,
        "accuracy180d" DOUBLE PRECISION,
        "accuracy365d" DOUBLE PRECISION,
        "isLocked" BOOLEAN NOT NULL DEFAULT false,
        "lockedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `);

    // Add foreign key constraints for predictions
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "predictions"
      DROP CONSTRAINT IF EXISTS "predictions_userId_fkey"
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "predictions"
      ADD CONSTRAINT "predictions_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "predictions"
      DROP CONSTRAINT IF EXISTS "predictions_stockId_fkey"
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "predictions"
      ADD CONSTRAINT "predictions_stockId_fkey"
      FOREIGN KEY ("stockId") REFERENCES "stocks"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    // Create stock_prices table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "stock_prices" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "stockId" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "open" DOUBLE PRECISION NOT NULL,
        "high" DOUBLE PRECISION NOT NULL,
        "low" DOUBLE PRECISION NOT NULL,
        "close" DOUBLE PRECISION NOT NULL,
        "volume" BIGINT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add foreign key for stock_prices
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "stock_prices"
      DROP CONSTRAINT IF EXISTS "stock_prices_stockId_fkey"
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "stock_prices"
      ADD CONSTRAINT "stock_prices_stockId_fkey"
      FOREIGN KEY ("stockId") REFERENCES "stocks"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    // Add unique constraint for stock_prices
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "stock_prices_stockId_date_key"
      ON "stock_prices"("stockId", "date")
    `);

    // Create indexes
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "predictions_userId_idx" ON "predictions"("userId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "predictions_stockId_idx" ON "predictions"("stockId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "predictions_createdAt_idx" ON "predictions"("createdAt")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "stock_prices_stockId_idx" ON "stock_prices"("stockId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "stock_prices_date_idx" ON "stock_prices"("date")`);

    console.log('Database tables created successfully');

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully'
    });
  } catch (error: any) {
    console.error('Database creation error:', error);
    return NextResponse.json({
      error: 'Failed to create tables',
      details: error.message
    }, { status: 500 });
  }
}
