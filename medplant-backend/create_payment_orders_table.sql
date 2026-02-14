-- Create payment_orders table to track Razorpay orders server-side

CREATE TABLE IF NOT EXISTS "public"."payment_orders" (
    "order_id" text NOT NULL,
    "user_id" uuid NOT NULL REFERENCES auth.users(id),
    "plan_id" text NOT NULL,
    "amount" integer NOT NULL, -- Amount in paise
    "currency" text NOT NULL DEFAULT 'INR',
    "status" text NOT NULL DEFAULT 'created', -- created, paid, failed, cancelled
    "receipt" text,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY ("order_id")
);

-- Enable RLS
ALTER TABLE "public"."payment_orders" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can VIEW their own orders
CREATE POLICY "Enable select for users based on user_id"
ON "public"."payment_orders"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Backend (service_role) has full access
CREATE POLICY "Enable all access for service_role"
ON "public"."payment_orders"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: NO INSERT/UPDATE/DELETE from Client
-- (Deny by default)
