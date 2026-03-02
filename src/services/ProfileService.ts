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

  const isUnlimited =
    profile.plan === 'pro_unlimited' ||
    profile.plan === 'pro_unlimited_yearly';

  const hasCredits =
    isUnlimited || (profile.daily_credits ?? 0) > 0 || (profile.is_admin === true);

  return hasCredits;
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
 * Get display name for a plan
 */
export const getPlanDisplayName = (planOrProfile: string | null | undefined | UserProfile): string => {
  // Handle profile object
  if (typeof planOrProfile === 'object' && planOrProfile !== null) {
    if (planOrProfile.is_admin) return 'Admin Unlimited';
    return getPlanDisplayName(planOrProfile.plan || undefined);
  }

  // Handle plan string
  const plan = planOrProfile;
  switch (plan) {
    case 'pro_basic': return 'Pro Basic';
    case 'pro_premium': return 'Pro Premium'; // Added as requested
    case 'pro_unlimited': return 'Pro Premium'; // Map legacy/existing unlimited to Premium if that's the intent, or keep as is? User said "If 'pro_premium' -> display 'Pro Premium'". I will add both to be safe and map pro_unlimited to Pro Premium as well usually implies a rename.
    case 'pro_unlimited_yearly': return 'Pro Premium (Yearly)';
    case 'pay_per_scan': return 'Pay Per Scan';
    default: return 'Free';
  }
};

export function getFirstName(fullName?: string | null): string {
  if (!fullName) return 'User';
  return fullName.split(' ')[0];
}

export function getUserInitials(nameOrEmail?: string | null): string {
  if (!nameOrEmail) return 'U';

  // If it looks like an email, take first 2 chars
  if (nameOrEmail.includes('@')) {
    return nameOrEmail.substring(0, 2).toUpperCase();
  }

  // Otherwise treat as name
  const parts = nameOrEmail.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return nameOrEmail.substring(0, 2).toUpperCase();
}
