-- Migration: Enable Row Level Security (RLS) on all tables
-- This migration enables RLS and creates appropriate policies for each table
-- Run this in your Supabase SQL Editor or via migration tool

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. STOCKS TABLE POLICIES
-- Stocks are public reference data - anyone can read
-- Only service role can insert/update/delete
-- ============================================

-- Allow anyone to read stocks (public data)
CREATE POLICY "stocks_select_policy" ON public.stocks
    FOR SELECT
    USING (true);

-- Allow service role to manage stocks (for data seeding/updates)
-- Note: Service role bypasses RLS, but this is explicit documentation
CREATE POLICY "stocks_insert_policy" ON public.stocks
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "stocks_update_policy" ON public.stocks
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "stocks_delete_policy" ON public.stocks
    FOR DELETE
    USING (auth.role() = 'service_role');

-- ============================================
-- 3. STOCK_PRICES TABLE POLICIES
-- Stock prices are public reference data - anyone can read
-- Only service role can insert/update/delete (for cron jobs)
-- ============================================

-- Allow anyone to read stock prices (public data)
CREATE POLICY "stock_prices_select_policy" ON public.stock_prices
    FOR SELECT
    USING (true);

-- Allow service role to manage stock prices (for cron updates)
CREATE POLICY "stock_prices_insert_policy" ON public.stock_prices
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "stock_prices_update_policy" ON public.stock_prices
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "stock_prices_delete_policy" ON public.stock_prices
    FOR DELETE
    USING (auth.role() = 'service_role');

-- ============================================
-- 4. USERS TABLE POLICIES
-- Users can only see and modify their own profile
-- Service role can manage all users (for registration)
-- ============================================

-- Allow users to read their own profile
CREATE POLICY "users_select_own_policy" ON public.users
    FOR SELECT
    USING (
        auth.uid()::text = id
        OR auth.role() = 'service_role'
    );

-- Allow service role to insert new users (registration handled server-side)
CREATE POLICY "users_insert_policy" ON public.users
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Allow users to update their own profile
CREATE POLICY "users_update_own_policy" ON public.users
    FOR UPDATE
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);

-- Only service role can delete users
CREATE POLICY "users_delete_policy" ON public.users
    FOR DELETE
    USING (auth.role() = 'service_role');

-- ============================================
-- 5. PREDICTIONS TABLE POLICIES
-- Users can only see and modify their own predictions
-- Service role can access all (for cron jobs to update accuracy)
-- ============================================

-- Allow users to read their own predictions
CREATE POLICY "predictions_select_own_policy" ON public.predictions
    FOR SELECT
    USING (
        auth.uid()::text = "userId"
        OR auth.role() = 'service_role'
    );

-- Allow users to create predictions for themselves
CREATE POLICY "predictions_insert_own_policy" ON public.predictions
    FOR INSERT
    WITH CHECK (
        auth.uid()::text = "userId"
        OR auth.role() = 'service_role'
    );

-- Allow users to update their own predictions (before locked)
CREATE POLICY "predictions_update_own_policy" ON public.predictions
    FOR UPDATE
    USING (
        auth.uid()::text = "userId"
        OR auth.role() = 'service_role'
    )
    WITH CHECK (
        auth.uid()::text = "userId"
        OR auth.role() = 'service_role'
    );

-- Allow users to delete their own predictions
CREATE POLICY "predictions_delete_own_policy" ON public.predictions
    FOR DELETE
    USING (
        auth.uid()::text = "userId"
        OR auth.role() = 'service_role'
    );

-- ============================================
-- NOTES:
-- ============================================
-- 1. This migration assumes you're using Supabase Auth with JWT tokens
-- 2. The service_role key bypasses RLS entirely, which is used by:
--    - Server-side API routes (Next.js)
--    - Cron jobs for updating prices and prediction accuracy
-- 3. When using Prisma with DATABASE_URL (postgres role), RLS is bypassed
--    because the postgres user is a superuser
-- 4. These policies will be enforced when using:
--    - Supabase JS client with anon key
--    - Supabase JS client with authenticated user JWT
-- ============================================
