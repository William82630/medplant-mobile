/**
 * SubscriptionService - Manages user subscriptions and credits
 * Handles Pro Basic plan with 10 daily AI scans
 */

import { supabase } from '../lib/supabase';

// Subscription types
export interface UserSubscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro_basic' | 'pro_unlimited';
  is_pro: boolean;
  daily_credits: number;
  last_reset_date: string;
  subscription_id: string | null;
  plan_start_date: string | null;
  plan_end_date: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// Pro Basic plan constants
const PRO_BASIC_DAILY_CREDITS = 10;


// REMOVED HARDCODED ADMIN EMAILS - Database is source of truth


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
      // 1. Check Expiry first
      let currentSub = existing;
      if (currentSub.is_pro && currentSub.plan_end_date) {
        const now = new Date();
        const expiry = new Date(currentSub.plan_end_date);
        if (expiry < now) {
          console.log('[Admin: Sub] Subscription expired. Downgrading to Free.');
          currentSub = await downgradeToFree(currentSub);
        }
      }

      // 2. Check and reset daily credits if needed
      const updated = await checkAndResetDailyCredits(currentSub);

      return updated || currentSub;
    }

    // Create or update subscription record for free tier (upsert for safety)
    if (fetchError?.code === 'PGRST116') {
      const { data: newSub, error: createError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          plan: 'free',
          is_pro: false,
          daily_credits: 0,
          is_admin: false, // Default to false, let DB handle it
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (createError) {
        console.error('[Admin: Sub] Error creating subscription:', createError);
        return null;
      }

      return newSub;
    }

    if (fetchError) {
      console.error('[Admin: Sub] Error fetching subscription:', fetchError);
      return null;
    }

    return null;
  } catch (error) {
    console.error('[Admin: Sub] Unexpected error:', error);
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

    // Double check expiry (safety)
    if (subscription.plan_end_date && new Date(subscription.plan_end_date) < new Date()) {
      return subscription; // Do not reset if expired
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
      console.error('[Admin: Credit] Error resetting credits:', error);
      return subscription;
    }

    console.log('[Admin: Credit] Daily credits reset to', PRO_BASIC_DAILY_CREDITS);
    return updated;
  } catch (error) {
    return subscription;
  }
}

/**
 * Refresh subscription data (wrapper for getOrCreateSubscription)
 */
export async function refreshSubscription(userId: string): Promise<UserSubscription | null> {
  return getOrCreateSubscription(userId);
}

/**
 * Check if user has credits available (or is admin/pro)
 */
export function hasCredits(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;

  // Admins have unlimited access
  if (subscription.is_admin) return true;

  // Pro Unlimited users have unlimited access
  if (subscription.plan === 'pro_unlimited') return true;

  // Anyone with credits can access (Pro Basic or Pay-Per-Scan users)
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
      console.log('[Admin: Credit] Admin user - no credit deduction');
      return { success: true, remaining: -1 }; // -1 indicates unlimited
    }

    // Pro Unlimited users don't consume credits
    if (subscription.plan === 'pro_unlimited') {
      console.log('[Admin: Credit] Pro Unlimited user - no credit deduction');
      return { success: true, remaining: -1 }; // -1 indicates unlimited
    }

    // Check credit balance (works for Pro Basic AND Pay-Per-Scan users)
    if (subscription.daily_credits <= 0) {
      console.log('[Admin: Credit] No credits available');
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
      console.error('[Admin: Credit] Error deducting credit:', error);
      return { success: false, remaining: subscription.daily_credits };
    }

    console.log('[Admin: Credit] Credit used. Remaining:', newCredits);
    return { success: true, remaining: newCredits };
  } catch (error) {
    console.error('[Admin: Credit] Error in useCredit:', error);
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
    const now = new Date();
    const proExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // 1. Update user_subscriptions table
    const { data: updated, error } = await supabase
      .from('user_subscriptions')
      .update({
        plan: 'pro_basic',
        is_pro: true,
        daily_credits: PRO_BASIC_DAILY_CREDITS,
        last_reset_date: today,
        subscription_id: razorpaySubscriptionId,
        plan_start_date: now.toISOString(),
        plan_end_date: proExpires.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Admin: Sub] Error activating Pro Basic:', error);
      return null;
    }

    // 2. Also update user_profiles table for persistence
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        is_pro: true,
        pro_since: now.toISOString(),
        pro_expires: proExpires.toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[Admin: Sub] Error updating user_profiles:', profileError);
      // Don't fail - subscription is still active
    } else {
      console.log('[Admin: Sub] user_profiles updated with Pro status');
    }

    console.log('[Admin: Sub] Pro Basic activated for user:', userId);
    return updated;
  } catch (error) {
    console.error('[Admin: Sub] Error in activateProBasic:', error);
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

/**
 * Add credits to user's balance after successful payment (for Pay-Per-Scan)
 * @param userId - User ID
 * @param amount - Number of credits to add
 */
export async function addCredits(userId: string, amount: number): Promise<{ success: boolean; newBalance: number }> {
  try {
    const subscription = await getOrCreateSubscription(userId);

    if (!subscription) {
      return { success: false, newBalance: 0 };
    }

    const newBalance = (subscription.daily_credits || 0) + amount;

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        daily_credits: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[Admin: Credit] Error adding credits:', error);
      return { success: false, newBalance: subscription.daily_credits || 0 };
    }

    console.log('[Admin: Credit] Credits added. New balance:', newBalance);
    return { success: true, newBalance };
  } catch (error) {
    console.error('[Admin: Credit] Error in addCredits:', error);
    return { success: false, newBalance: 0 };
  }
}

/**
 * Activate Pro Unlimited subscription after successful Razorpay payment
 * @param isYearly - If true, subscription expires in 365 days, otherwise 30 days
 */
export async function activateProUnlimited(
  userId: string,
  razorpayPaymentId: string,
  isYearly: boolean = false
): Promise<UserSubscription | null> {
  try {
    const now = new Date();
    const durationDays = isYearly ? 365 : 30;
    const proExpires = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // 1. Update user_subscriptions table
    const { data: updated, error } = await supabase
      .from('user_subscriptions')
      .update({
        plan: 'pro_unlimited',
        is_pro: true,
        subscription_id: razorpayPaymentId,
        plan_start_date: now.toISOString(),
        plan_end_date: proExpires.toISOString(), // 30 or 365 days
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Admin: Sub] Error activating Pro Unlimited:', error);
      return null;
    }

    // 2. Also update user_profiles table for persistence
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        is_pro: true,
        pro_since: now.toISOString(),
        pro_expires: proExpires.toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[Admin: Sub] Error updating user_profiles:', profileError);
      // Don't fail - subscription is still active
    } else {
      console.log('[Admin: Sub] user_profiles updated with Pro Unlimited status');
    }

    console.log('[Admin: Sub] Pro Unlimited activated for user:', userId);
    return updated;
  } catch (error) {
    console.error('[Admin: Sub] Error in activateProUnlimited:', error);
    return null;
  }
}

/**
 * Downgrade user to free tier (internal helper)
 */
async function downgradeToFree(currentSub: UserSubscription): Promise<UserSubscription> {
  try {
    const { data: updated, error } = await supabase
      .from('user_subscriptions')
      .update({
        plan: 'free',
        is_pro: false,
        daily_credits: 0,
        plan_end_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', currentSub.user_id)
      .select()
      .single();

    // Also sync user_profiles
    await supabase
      .from('user_profiles')
      .update({
        is_pro: false,
        pro_expires: null
      })
      .eq('id', currentSub.user_id);

    if (error) throw error;
    return updated;
  } catch (err) {
    console.error('[Admin: Sub] Error downgrading to free:', err);
    return { ...currentSub, is_pro: false, plan: 'free', daily_credits: 0 };
  }
}
