/**
 * RazorpayService type declarations
 * Metro resolves .native.ts or .web.ts at runtime —
 * this file provides TypeScript with the shared interface.
 */

export declare const CREDIT_PACKS: Array<{
  id: string;
  credits: number;
  price: number;
  priceInPaise: number;
  label: string;
  description: string;
  bestValue?: boolean;
}>;

export declare const createProBasicSubscription: (
  userId: string,
  email: string | undefined,
  onSuccess: () => void,
  onError: (error: string) => void
) => Promise<void>;

export declare const createProUnlimitedSubscription: (
  userId: string,
  email: string | undefined,
  onSuccess: () => void,
  onError: (error: string) => void
) => Promise<void>;

export declare const createProUnlimitedYearlySubscription: (
  userId: string,
  email: string | undefined,
  onSuccess: () => void,
  onError: (error: string) => void
) => Promise<void>;

export declare const purchaseCreditPack: (
  userId: string,
  email: string | undefined,
  packId: string,
  onSuccess: (newBalance: number) => void,
  onError: (error: string) => void
) => Promise<void>;

export declare const initializeRazorpay: () => Promise<boolean>;
