-- SECURE: Revoke UPDATE permission for authenticated users on user_subscriptions
-- Only service_role (Backend) should be able to update subscription status/credits

-- 1. Drop the insecure policy
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."user_subscriptions";

-- 2. Create a restricted policy (Optional: Allow users to UPDATE nothing, or specific implementation)
-- actually, for now, we just DROP the update policy.
-- If users need to update *something* (like metadata?), we can add a specific policy later.
-- For now: NO UPDATES from client.

-- 3. Ensure SELECT is still allowed (re-affirming, usually existing policy is enough)
-- (Existing policy "Enable select for users based on user_id" should remain)

-- 4. Ensure INSERT is still allowed (for initial free tier creation if done from client)
-- (Existing policy "Enable insert for authenticated users" should remain)
