# Supabase Configuration

This folder contains database migrations and configuration for Supabase.

## Fixing RLS Security Warnings

If you're seeing "RLS Disabled in Public" security warnings in Supabase, you need to run the migration script.

### How to Apply the RLS Migration

1. **Go to your Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration**
   - Copy the contents of `migrations/20241210_enable_rls.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

4. **Verify the Fix**
   - Go to "Database" → "Tables" in the left sidebar
   - Click on each table (stocks, users, predictions, stock_prices)
   - You should see "RLS Enabled" badge on each table
   - Run the Supabase Linter again to confirm no more RLS warnings

## RLS Policy Summary

### stocks table
- **SELECT**: Public (anyone can view stock information)
- **INSERT/UPDATE/DELETE**: Service role only

### stock_prices table
- **SELECT**: Public (anyone can view price history)
- **INSERT/UPDATE/DELETE**: Service role only (cron jobs)

### users table
- **SELECT**: Users can only view their own profile
- **INSERT**: Service role only (registration via API)
- **UPDATE**: Users can only update their own profile
- **DELETE**: Service role only

### predictions table
- **SELECT**: Users can only view their own predictions
- **INSERT**: Users can create predictions for themselves
- **UPDATE**: Users can update their own predictions
- **DELETE**: Users can delete their own predictions

## How RLS Works with This Application

This application uses multiple connection methods:

1. **Prisma (Server-side API routes)**
   - Connects using `DATABASE_URL` with postgres/service credentials
   - Bypasses RLS (superuser/service role privilege)
   - Security is enforced at the application layer in API routes

2. **Supabase JS Client (if used directly)**
   - Would use anon key (public) or authenticated user JWT
   - RLS policies would be enforced
   - Additional security layer at database level

## Troubleshooting

### Policies not working?
- Make sure you're using the correct Supabase key (anon vs service_role)
- Service role key bypasses RLS - use only server-side
- Anon key respects RLS - safe for client-side

### Getting permission denied?
- Check if the user is properly authenticated
- Verify `auth.uid()` is being set correctly in JWT
- Review the specific policy for the operation you're trying

### Need to modify policies?
- Go to Database → Tables → Select table → Policies
- You can edit or add new policies in the Supabase dashboard
