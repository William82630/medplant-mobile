/**
 * SubscriptionService - Manages user subscriptions and credits
 * Handles Pro Basic plan with 10 daily AI scans
 */

import { supabase } from '../lib/supabase';

// Subscription types
export interface UserSubscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro_basic';
  is_pro: boolean;
  daily_credits: number;
  last_reset_date: string;
  subscription_id: string | null;
  plan_start_date: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// Pro Basic plan constants
const PRO_BASIC_DAILY_CREDITS = 10;

/**
 * Get or create subscription record for a user
 */
export async function getOrCreateSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    // Try to get existing subscription
    const { data: existing, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Check and reset daily credits if needed
      const updated = await checkAndResetDailyCredits(existing);
      return updated || existing;
    }

    // Create new subscription record for free tier
    if (fetchError?.code === 'PGRST116') {
      const { data: newSub, error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan: 'free',
          is_pro: false,
          daily_credits: 0,
          is_admin: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('[SubscriptionService] Error creating subscription:', createError);
        return null;
      }

      return newSub;
    }

    if (fetchError) {
      console.error('[SubscriptionService] Error fetching subscription:', fetchError);
      return null;
    }

    return null;
  } catch (error) {
    console.error('[SubscriptionService] Unexpected error:', error);
    return null;
  }
}

/**
 * Check if daily credits need to be reset (new day) and reset if so
 */
export async function checkAndResetDailyCredits(
  subscription: UserSubscription
): Promise<UserSubscription | null> {
  try {
    // Only Pro users get daily credit resets
    if (!subscription.is_pro) {
      return subscription;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastReset = subscription.last_reset_date;

    // If already reset today, no action needed
    if (lastReset === today) {
      return subscription;
    }

    // Reset credits to daily limit
    const { data: updated, error } = await supabase
      .from('user_subscriptions')
      .update({
        daily_credits: PRO_BASIC_DAILY_CREDITS,
        last_reset_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', subscription.user_id)
      .select()
      .single();

    if (error) {
      console.error('[SubscriptionService] Error resetting credits:', error);
      return subscription;
    }

    console.log('[SubscriptionService] Daily credits reset to', PRO_BASIC_DAILY_CREDITS);
    return updated;
  } catch (error) {
    console.error('[SubscriptionService] Error in checkAndResetDailyCredits:', error);
    return subscription;
  }
}

/**
 * Check if user has credits available (or is admin)
 */
export function hasCredits(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;

  // Admins have unlimited access
  if (subscription.is_admin) return true;

  // Free users don't get credits (must upgrade)
  if (!subscription.is_pro) return false;

  // Pro users check credit balance
  return subscription.daily_credits > 0;
}

/**
 * Use one credit for an AI scan or PDF generation
 * Returns true if successful, false if no credits available
 */
export async function useCredit(userId: string): Promise<{ success: boolean; remaining: number }> {
  try {
    // Get current subscription
    const subscription = await getOrCreateSubscription(userId);

    if (!subscription) {
      return { success: false, remaining: 0 };
    }

    // Admins don't use credits
    if (subscription.is_admin) {
      console.log('[SubscriptionService] Admin user - no credit deduction');
      return { success: true, remaining: -1 }; // -1 indicates unlimited
    }

    // Free users can't use credits
    if (!subscription.is_pro) {
      return { success: false, remaining: 0 };
    }

    // Check credit balance
    if (subscription.daily_credits <= 0) {
      return { success: false, remaining: 0 };
    }

    // Deduct one credit
    const newCredits = subscription.daily_credits - 1;
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        daily_credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[SubscriptionService] Error deducting credit:', error);
      return { success: false, remaining: subscription.daily_credits };
    }

    console.log('[SubscriptionService] Credit used. Remaining:', newCredits);
    return { success: true, remaining: newCredits };
  } catch (error) {
    console.error('[SubscriptionService] Error in useCredit:', error);
    return { success: false, remaining: 0 };
  }
}

/**
 * Activate Pro Basic subscription after successful Razorpay payment
 */
export async function activateProBasic(
  userId: string,
  razorpaySubscriptionId: string
): Promise<UserSubscription | null> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: updated, error } = await supabase
      .from('user_subscriptions')
      .update({
        plan: 'pro_basic',
        is_pro: true,
        daily_credits: PRO_BASIC_DAILY_CREDITS,
        last_reset_date: today,
        subscription_id: razorpaySubscriptionId,
        plan_start_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[SubscriptionService] Error activating Pro Basic:', error);
      return null;
    }

    console.log('[SubscriptionService] Pro Basic activated for user:', userId);
    return updated;
  } catch (error) {
    console.error('[SubscriptionService] Error in activateProBasic:', error);
    return null;
  }
}

/**
 * Check if user is admin (unlimited access)
 */
export function isAdmin(subscription: UserSubscription | null): boolean {
  return subscription?.is_admin === true;
}

/**
 * Get remaining credits for display
 */
export function getRemainingCredits(subscription: UserSubscription | null): number | 'unlimited' {
  if (!subscription) return 0;
  if (subscription.is_admin) return 'unlimited';
  if (!subscription.is_pro) return 0;
  return subscription.daily_credits;
}
