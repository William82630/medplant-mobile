import { supabase } from '../lib/supabase';
import {
  getOrCreateSubscription,
  hasCredits as subHasCredits,
  isAdmin as subIsAdmin,
  getRemainingCredits as subGetCredits,
  UserSubscription
} from './SubscriptionService';

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at?: string;
  // Merged subscription fields
  plan?: string;
  is_pro?: boolean;
  daily_credits?: number;
  is_admin?: boolean;
}

/**
 * Get user profile merged with subscription data
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // 1. Fetch profile (full_name, etc.)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // 2. Fetch subscription (credits, plan, etc.)
    const subscription = await getOrCreateSubscription(userId);

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[ProfileService] Error fetching profile:', profileError);
    }

    // Merge them
    return {
      id: userId,
      full_name: profile?.full_name || null,
      avatar_url: profile?.avatar_url || null,
      plan: subscription?.plan || 'free',
      is_pro: subscription?.is_pro || false,
      daily_credits: subscription?.daily_credits || 0,
      is_admin: subscription?.is_admin || false,
    };
  } catch (error) {
    console.error('[ProfileService] Unexpected error:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        ...data,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('[ProfileService] Update error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Compatibility Wrappers for App.tsx
 */

export function hasProAccess(profile: UserProfile | null): boolean {
  return profile?.is_pro === true;
}

export function canPerformScan(profile: UserProfile | null): boolean {
  if (!profile) return false;
  // Reconstruct a temporary subscription object for the check
  const subStub = {
    is_admin: profile.is_admin,
    plan: profile.plan,
    is_pro: profile.is_pro,
    daily_credits: profile.daily_credits || 0,
  } as any;
  return subHasCredits(subStub);
}

export function isAdmin(profile: UserProfile | null): boolean {
  return profile?.is_admin === true;
}

export function getRemainingCredits(profile: UserProfile | null): number | 'unlimited' {
  if (!profile) return 0;
  const subStub = {
    is_admin: profile.is_admin,
    is_pro: profile.is_pro,
    daily_credits: profile.daily_credits || 0,
  } as any;
  return subGetCredits(subStub);
}

/**
 * Display Helpers
 */

export function getPlanDisplayName(plan?: string): string {
  switch (plan) {
    case 'pro_basic': return 'Pro Basic';
    case 'pro_unlimited': return 'Pro Unlimited';
    default: return 'Free Plan';
  }
}

export function getFirstName(fullName?: string | null): string {
  if (!fullName) return 'User';
  return fullName.split(' ')[0];
}
