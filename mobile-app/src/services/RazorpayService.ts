/**
 * RazorpayService - Handles payment integration for Web
 * Uses Razorpay Checkout script
 */

import { Platform } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { activateProBasic, activateProUnlimited, addCredits } from './SubscriptionService';

// Razorpay Key is now fetched from environment variables in App or Backend (but ID needed for SDK init)
// We still need the Key ID on client to initialize the SDK
const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_S9Wcf0x7uc6rng'; // Fallback for dev if env missing

// Backend URL
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string; // Added order_id
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: any) => void;
  modal: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => any;
  }
}

/**
 * Load Razorpay Checkout Script
 */
export const initializeRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web') {
      resolve(true); // Native SDK is always ready
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Create Subscription for Pro Basic Plan
 */
export const createProBasicSubscription = async (
  userId: string,
  email: string | undefined,
  onSuccess: () => void,
  onError: (error: string) => void
) => {
  await initiatePayment(userId, email, 'pro_basic', onSuccess, onError);
};

// Generic Payment Initiator
const initiatePayment = async (
  userId: string,
  email: string | undefined,
  planId: string,
  onSuccess: (data?: any) => void,
  onError: (error: string) => void
) => {
  try {
    const isLoaded = await initializeRazorpay();
    if (!isLoaded) {
      onError('Razorpay SDK failed to load');
      return;
    }

    // 1. Create Order on Backend
    const orderResponse = await fetch(`${BACKEND_URL}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        planId
      }),
    });

    const orderJson = await orderResponse.json();

    if (!orderJson.success) {
      onError(orderJson.error || 'Failed to create order');
      return;
    }

    const { order_id, amount, currency, key_id } = orderJson.data;

    const options: RazorpayOptions = {
      key: key_id || RAZORPAY_KEY,
      amount: amount,
      currency: currency,
      name: 'MedPlant',
      description: `Payment for ${planId}`,
      order_id: order_id, // Mandatory: Bind to backend order
      image: 'https://cdn-icons-png.flaticon.com/512/3061/3061341.png',
      prefill: {
        email: email,
      },
      theme: {
        color: '#00C896',
      },
      handler: async function (response: any) {
        console.log('[Razorpay] Payment Success:', response);
        // Backend handles activation via Webhook
        // Client just needs to know it's done or poll
        onSuccess();
      },
      modal: {
        ondismiss: function () {
          onError('Payment cancelled');
        },
      },
    };

    if (Platform.OS === 'web') {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      RazorpayCheckout.open(options).then((data: any) => {
        console.log(`[Razorpay Mobile] Success: ${data.razorpay_payment_id}`);
        options.handler(data);
      }).catch((error: any) => {
        console.log(`[Razorpay Mobile] Error: ${error.code} | ${error.description}`);
        onError(error.description || 'Payment cancelled');
      });
    }
  } catch (error: any) {
    console.error('[Razorpay] Error:', error);
    onError(error.message || 'Something went wrong');
  }
};

/**
 * Create Subscription for Pro Unlimited Plan (₹799/month)
 */
export const createProUnlimitedSubscription = async (
  userId: string,
  email: string | undefined,
  onSuccess: () => void,
  onError: (error: string) => void
) => {
  await initiatePayment(userId, email, 'pro_unlimited', onSuccess, onError);
};

/**
 * Create Subscription for Pro Unlimited Yearly Plan (₹7,999/year)
 */
export const createProUnlimitedYearlySubscription = async (
  userId: string,
  email: string | undefined,
  onSuccess: () => void,
  onError: (error: string) => void
) => {
  await initiatePayment(userId, email, 'pro_unlimited_yearly', onSuccess, onError);
};

// Credit Pack Definitions
export const CREDIT_PACKS = [
  { id: 'pack_1', credits: 1, price: 10, priceInPaise: 1000, label: '1 Scan', description: '₹10' },
  { id: 'pack_10', credits: 10, price: 79, priceInPaise: 7900, label: '10 Scans', description: '₹79' },
  { id: 'pack_20', credits: 20, price: 149, priceInPaise: 14900, label: '20 Scans', description: '₹149', bestValue: true },
  { id: 'pack_30', credits: 30, price: 199, priceInPaise: 19900, label: '30 Scans', description: '₹199' },
];

/**
 * Purchase Credit Pack (One-time payment)
 */
export const purchaseCreditPack = async (
  userId: string,
  email: string | undefined,
  packId: string,
  onSuccess: (newBalance: number) => void,
  onError: (error: string) => void
) => {
  // Pass a dummy function for onSuccess that matches the signature but we might need to change the caller to handle async update
  // For now, we'll just call onSuccess with 0 or fetch new balance if possible.
  // Ideally, the UI monitors credits.

  await initiatePayment(userId, email, packId, () => onSuccess(0), onError);
};
