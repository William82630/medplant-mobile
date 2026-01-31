-- FIX: Enable INSERT for authenticated users (required for triggers/signup)
-- Run this in Supabase SQL Editor

-- 1. Enable RLS (just in case)
ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing insert policy if any (to avoid conflicts)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."user_profiles";

-- 3. Create the missing INSERT policy
CREATE POLICY "Enable insert for authenticated users only" 
ON "public"."user_profiles" 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 4. Additionally, ensure SERVICE_ROLE can always bypass (usually implicit, but good to be safe)
DROP POLICY IF EXISTS "Enable all access for service_role" ON "public"."user_profiles";
CREATE POLICY "Enable all access for service_role" 
ON "public"."user_profiles" 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
