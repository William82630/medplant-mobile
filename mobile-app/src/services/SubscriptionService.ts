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
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// Pro Basic plan constants
const PRO_BASIC_DAILY_CREDITS = 10;
export const ADMIN_EMAILS = ['willsblogger82@gmail.com', 'willsvankal@gmail.com'];

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

      // Admin bypass for existing records that might not have is_admin set properly
      const { data: { user } } = await supabase.auth.getUser();
      const isHardcodedAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

      if (isHardcodedAdmin && !existing.is_admin) {
        return { ...(updated || existing), is_admin: true };
      }

      return updated || existing;
    }

    // Create or update subscription record for free tier (upsert for safety)
    if (fetchError?.code === 'PGRST116') {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email;
      const isHardcodedAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);

      const { data: newSub, error: createError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          plan: 'free',
          is_pro: false,
          daily_credits: 0,
          is_admin: isHardcodedAdmin,
        }, { onConflict: 'user_id' })
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
      console.log('[SubscriptionService] Admin user - no credit deduction');
      return { success: true, remaining: -1 }; // -1 indicates unlimited
    }

    // Pro Unlimited users don't consume credits
    if (subscription.plan === 'pro_unlimited') {
      console.log('[SubscriptionService] Pro Unlimited user - no credit deduction');
      return { success: true, remaining: -1 }; // -1 indicates unlimited
    }

    // Check credit balance (works for Pro Basic AND Pay-Per-Scan users)
    if (subscription.daily_credits <= 0) {
      console.log('[SubscriptionService] No credits available');
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
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[SubscriptionService] Error activating Pro Basic:', error);
      return null;
    }

    // 2. Also update user_profiles table for persistence
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        is_pro: true,
        pro_since: now.toISOString(),
        pro_expires: proExpires.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[SubscriptionService] Error updating user_profiles:', profileError);
      // Don't fail - subscription is still active
    } else {
      console.log('[SubscriptionService] user_profiles updated with Pro status');
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
      console.error('[SubscriptionService] Error adding credits:', error);
      return { success: false, newBalance: subscription.daily_credits || 0 };
    }

    console.log('[SubscriptionService] Credits added. New balance:', newBalance);
    return { success: true, newBalance };
  } catch (error) {
    console.error('[SubscriptionService] Error in addCredits:', error);
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
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[SubscriptionService] Error activating Pro Unlimited:', error);
      return null;
    }

    // 2. Also update user_profiles table for persistence
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        is_pro: true,
        pro_since: now.toISOString(),
        pro_expires: proExpires.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[SubscriptionService] Error updating user_profiles:', profileError);
      // Don't fail - subscription is still active
    } else {
      console.log('[SubscriptionService] user_profiles updated with Pro Unlimited status');
    }

    console.log('[SubscriptionService] Pro Unlimited activated for user:', userId);
    return updated;
  } catch (error) {
    console.error('[SubscriptionService] Error in activateProUnlimited:', error);
    return null;
  }
}
