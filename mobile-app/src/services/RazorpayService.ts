/**
 * RazorpayService - Handles payment integration for Web
 * Uses Razorpay Checkout script
 */

import { Platform } from 'react-native';
import { activateProBasic, addCredits } from './SubscriptionService';

// Razorpay Test Key
const RAZORPAY_KEY = 'rzp_test_Rox06vW5C1kke3';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
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
      resolve(false); // Only web supported for now
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
 * @param userId - Current user ID
 * @param email - User email for prefill
 * @param onSuccess - Callback when payment is successful
 * @param onError - Callback when payment fails or cancelled
 */
export const createProBasicSubscription = async (
  userId: string,
  email: string | undefined,
  onSuccess: () => void,
  onError: (error: string) => void
) => {
  try {
    const isLoaded = await initializeRazorpay();
    if (!isLoaded) {
      onError('Razorpay SDK failed to load');
      return;
    }

    const options: RazorpayOptions = {
      key: RAZORPAY_KEY,
      amount: 9900, // ₹99.00 in paise
      currency: 'INR',
      name: 'MedPlant Pro',
      description: 'Pro Basic Subscription (10 Scans/Day)',
      image: 'https://cdn-icons-png.flaticon.com/512/3061/3061341.png', // Fallback plant icon
      prefill: {
        email: email,
      },
      theme: {
        color: '#00C896',
      },
      handler: async function (response: any) {
        console.log('[Razorpay] Payment Success:', response);
        // For subscription mode we would use razorpay_subscription_id
        // For simple recurring via monthly payments logic here, we simulate success
        // In real prod, you'd verify signature on backend.

        // Activate subscription in Supabase
        const result = await activateProBasic(userId, response.razorpay_payment_id || 'manual_sub_id');

        if (result) {
          onSuccess();
        } else {
          onError('Payment successful but activation failed. Contact support.');
        }
      },
      modal: {
        ondismiss: function () {
          onError('Payment cancelled');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error: any) {
    console.error('[Razorpay] Error:', error);
    onError(error.message || 'Something went wrong');
  }
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
 * @param userId - Current user ID
 * @param email - User email for prefill
 * @param packId - Credit pack ID
 * @param onSuccess - Callback when payment is successful
 * @param onError - Callback when payment fails or cancelled
 */
export const purchaseCreditPack = async (
  userId: string,
  email: string | undefined,
  packId: string,
  onSuccess: (newBalance: number) => void,
  onError: (error: string) => void
) => {
  try {
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) {
      onError('Invalid credit pack selected');
      return;
    }

    const isLoaded = await initializeRazorpay();
    if (!isLoaded) {
      onError('Payment gateway failed to load');
      return;
    }

    const options: RazorpayOptions = {
      key: RAZORPAY_KEY,
      amount: pack.priceInPaise,
      currency: 'INR',
      name: 'MedPlant Credits',
      description: `${pack.credits} AI Scan Credit${pack.credits > 1 ? 's' : ''}`,
      image: 'https://cdn-icons-png.flaticon.com/512/3061/3061341.png',
      prefill: {
        email: email,
      },
      theme: {
        color: '#00C896',
      },
      handler: async function (response: any) {
        console.log('[Razorpay] Credit Pack Payment Success:', response);

        // Add credits to user's balance
        const result = await addCredits(userId, pack.credits);

        if (result.success) {
          onSuccess(result.newBalance);
        } else {
          onError('Payment successful but credit update failed. Contact support.');
        }
      },
      modal: {
        ondismiss: function () {
          onError('Payment cancelled');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error: any) {
    console.error('[Razorpay] Credit Pack Error:', error);
    onError(error.message || 'Something went wrong');
  }
};
