/**
 * SubscriptionService - Manages user subscriptions and credits
 * Handles Pay-Per-Scan credits (credits_remaining)
 */

import { supabase } from '../lib/supabase';

// Subscription types
export interface UserSubscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro_basic';
  is_pro: boolean;
  credits_remaining: number;
  last_reset_date: string;
  subscription_id: string | null;
  plan_start_date: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

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
      return existing;
    }

    // Create new subscription record for free tier
    if (fetchError?.code === 'PGRST116') {
      const { data: newSub, error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan: 'free',
          is_pro: false,
          credits_remaining: 0,
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
 * Check if user has credits available (or is admin)
 */
export function hasCredits(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;

  // Admins have unlimited access
  if (subscription.is_admin) return true;

  // Check credit balance
  return subscription.credits_remaining > 0;
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

    // Check credit balance
    if (subscription.credits_remaining <= 0) {
      return { success: false, remaining: 0 };
    }

    // Deduct one credit
    const newCredits = subscription.credits_remaining - 1;
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        credits_remaining: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[SubscriptionService] Error deducting credit:', error);
      return { success: false, remaining: subscription.credits_remaining };
    }

    console.log('[SubscriptionService] Credit used. Remaining:', newCredits);
    return { success: true, remaining: newCredits };
  } catch (error) {
    console.error('[SubscriptionService] Error in useCredit:', error);
    return { success: false, remaining: 0 };
  }
}

/**
 * Add credits to user's balance after successful payment
 * @param userId - User ID
 * @param amount - Number of credits to add
 */
export async function addCredits(userId: string, amount: number): Promise<{ success: boolean; newBalance: number }> {
  try {
    // Get current subscription
    const subscription = await getOrCreateSubscription(userId);

    if (!subscription) {
      return { success: false, newBalance: 0 };
    }

    // Calculate new balance
    const newBalance = (subscription.credits_remaining || 0) + amount;

    // Update in database
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        credits_remaining: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[SubscriptionService] Error adding credits:', error);
      return { success: false, newBalance: subscription.credits_remaining || 0 };
    }

    console.log('[SubscriptionService] Credits added. New balance:', newBalance);
    return { success: true, newBalance };
  } catch (error) {
    console.error('[SubscriptionService] Error in addCredits:', error);
    return { success: false, newBalance: 0 };
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
        credits_remaining: 10, // Initial grant, logic to be refined later
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
  return subscription.credits_remaining;
}

