import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../lib/supabase';

// Initialize Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Plan Pricing Configuration (Server-Side Validation)
const PRICING: Record<string, number> = {
  'pro_basic': 9900,         // ₹99.00
  'pro_unlimited': 79900,    // ₹799.00
  'pro_unlimited_yearly': 799900, // ₹7,999.00
  'pack_1': 1000,            // ₹10.00
  'pack_10': 7900,           // ₹79.00
  'pack_20': 14900,          // ₹149.00
  'pack_30': 19900,          // ₹199.00
};

// Credit Mapping Configuration
const CREDITS: Record<string, number> = {
  'pack_1': 1,
  'pack_10': 10,
  'pack_20': 20,
  'pack_30': 30,
};

export class RazorpayService {

  /**
   * Create a new order on Razorpay and store in database
   */
  static async createOrder(userId: string, planId: string): Promise<any> {
    const amount = PRICING[planId];
    if (!amount) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    const options = {
      amount: amount,
      currency: "INR",
      receipt: `rcpt_${userId.substring(0, 8)}_${Date.now()}`,
      notes: {
        userId: userId,
        planId: planId
      }
    };

    try {
      // 1. Create order on Razorpay
      const order = await razorpay.orders.create(options);

      // 2. Store order in database
      const { error } = await supabase
        .from('payment_orders')
        .insert({
          order_id: order.id,
          user_id: userId,
          plan_id: planId,
          amount: amount,
          currency: 'INR',
          status: 'created',
          receipt: options.receipt
        });

      if (error) {
        console.error('[RazorpayService] DB Insert Error:', error);
        throw new Error('Failed to save order details');
      }

      return {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      };
    } catch (error) {
      console.error('[RazorpayService] Create Order Error:', error);
      throw error;
    }
  }

  /**
   * Verify Webhook Signature
   */
  static verifyWebhookSignature(body: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[RazorpayService] Missing RAZORPAY_WEBHOOK_SECRET');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Handle Webhook Event
   */
  static async handleWebhookEvent(payload: any) {
    const event = payload.event;
    console.log(`[RazorpayService] Processing Event: ${event}`);

    // Idempotency: Check if already processed via `payment_orders` status
    // (Note: Razorpay might send same event multiple times)

    if (event === 'payment.captured' || event === 'order.paid') {
      await this.handlePaymentSuccess(payload.payload.payment.entity, payload.payload.order.entity);
    }
    // Add logic for subscription.charged if doing recurring billing via Razorpay Subscriptions API
    // (Currently assuming one-off payments for credits/monthly access similar to current flow)
  }

  private static async handlePaymentSuccess(payment: any, order: any) {
    const orderId = order.id;
    const paymentId = payment.id;

    console.log(`[RazorpayService] Payment Success for Order: ${orderId}, Payment: ${paymentId}`);

    // 1. Fetch Order from DB to get Plan details
    const { data: dbOrder, error: fetchError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (fetchError || !dbOrder) {
      console.error(`[RazorpayService] Order not found in DB: ${orderId}`);
      return;
    }

    // 2. Idempotency Check
    if (dbOrder.status === 'paid') {
      console.log(`[RazorpayService] Order ${orderId} already processed. Skipping.`);
      return;
    }

    // 3. Mark Order as PAID
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (updateError) {
      console.error(`[RazorpayService] Failed to mark order as paid: ${orderId}`);
      // Don't return, try to activate anyway (can retry status update later or handle manually)
    }

    // 4. Activate Subscription / Add Credits
    const planId = dbOrder.plan_id;
    const userId = dbOrder.user_id;

    if (CREDITS[planId]) {
      await this.addCredits(userId, CREDITS[planId]);
    } else if (planId === 'pro_basic') {
      await this.activateProBasic(userId, paymentId);
    } else if (planId.startsWith('pro_unlimited')) {
      const isYearly = planId === 'pro_unlimited_yearly';
      await this.activateProUnlimited(userId, paymentId, isYearly);
    } else {
      console.warn(`[RazorpayService] Unknown Plan ID: ${planId}`);
    }
  }


  // --- Helper Methods (Server-Side Logic Only) ---

  private static async addCredits(userId: string, amount: number) {
    // Determine existing balance first? Or just increment? 
    // Better to fetch current sub, then update.
    // NOTE: This logic mirrors SubscriptionService.ts but runs securely on backend.

    // Using RPC or raw SQL would be atomic, but simple select-update is okay for now if traffic low.
    // Ideally use: daily_credits = daily_credits + amount

    const { data: sub } = await supabase.from('user_subscriptions').select('daily_credits').eq('user_id', userId).single();
    const currentCredits = sub?.daily_credits || 0;
    const newCredits = currentCredits + amount;

    await supabase.from('user_subscriptions').update({
      daily_credits: newCredits,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId);

    console.log(`[RazorpayService] Added ${amount} credits to user ${userId}`);
  }

  private static async activateProBasic(userId: string, paymentId: string) {
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await supabase.from('user_subscriptions').upsert({
      user_id: userId,
      plan: 'pro_basic',
      is_pro: true,
      daily_credits: 10, // Limit for Basic
      last_reset_date: now.toISOString().split('T')[0],
      subscription_id: paymentId,
      plan_start_date: now.toISOString(),
      plan_end_date: expires.toISOString(),
      updated_at: now.toISOString()
    });

    await supabase.from('user_profiles').update({
      is_pro: true,
      pro_since: now.toISOString(),
      pro_expires: expires.toISOString()
    }).eq('id', userId);

    console.log(`[RazorpayService] Activated Pro Basic for ${userId}`);
  }

  private static async activateProUnlimited(userId: string, paymentId: string, isYearly: boolean) {
    const now = new Date();
    const days = isYearly ? 365 : 30;
    const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const planName = isYearly ? 'pro_unlimited_yearly' : 'pro_unlimited';

    await supabase.from('user_subscriptions').upsert({
      user_id: userId,
      plan: planName,
      is_pro: true,
      daily_credits: 100, // Unlimited Fair Use
      last_reset_date: now.toISOString().split('T')[0],
      subscription_id: paymentId,
      plan_start_date: now.toISOString(),
      plan_end_date: expires.toISOString(),
      updated_at: now.toISOString()
    });

    await supabase.from('user_profiles').update({
      is_pro: true,
      pro_since: now.toISOString(),
      pro_expires: expires.toISOString()
    }).eq('id', userId);

    console.log(`[RazorpayService] Activated Pro Unlimited (${planName}) for ${userId}`);
  }
}
