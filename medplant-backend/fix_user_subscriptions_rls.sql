-- FIX: Enable INSERT/SELECT/UPDATE for user_subscriptions (Fixes Error 42501)
-- Run this in Supabase SQL Editor

-- 1. Enable RLS
ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."user_subscriptions";
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON "public"."user_subscriptions";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."user_subscriptions";
DROP POLICY IF EXISTS "Enable all access for service_role" ON "public"."user_subscriptions";

-- 3. INSERT Policy: Authenticated users can create their own subscription record
CREATE POLICY "Enable insert for authenticated users"
ON "public"."user_subscriptions"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. SELECT Policy: Authenticated users can view their own subscription
CREATE POLICY "Enable select for users based on user_id"
ON "public"."user_subscriptions"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5. UPDATE Policy: Authenticated users can update their own subscription (e.g. usage)
CREATE POLICY "Enable update for users based on user_id"
ON "public"."user_subscriptions"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Service Role Bypass (Backup access for Admin SDK)
CREATE POLICY "Enable all access for service_role"
ON "public"."user_subscriptions"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
