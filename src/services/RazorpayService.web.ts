/**
 * RazorpayService (Web) - Browser payment integration
 * Uses Razorpay Checkout.js script only. No native SDK.
 */

const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SGNvWrBGzR66Hh';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Credit Pack Definitions
export const CREDIT_PACKS = [
  { id: 'pack_1', credits: 1, price: 10, priceInPaise: 1000, label: '1 Scan', description: '₹10' },
  { id: 'pack_10', credits: 10, price: 79, priceInPaise: 7900, label: '10 Scans', description: '₹79' },
  { id: 'pack_20', credits: 20, price: 149, priceInPaise: 14900, label: '20 Scans', description: '₹149', bestValue: true },
  { id: 'pack_30', credits: 30, price: 199, priceInPaise: 19900, label: '30 Scans', description: '₹199' },
];

declare global {
  interface Window {
    Razorpay: new (options: any) => any;
  }
}

/**
 * Load Razorpay Checkout.js script into document
 */
export const initializeRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
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
 * Resolve amount in paise from planId
 */
const getAmountForPlan = (planId: string): number => {
  if (planId === 'pro_basic') return 9900;
  if (planId === 'pro_unlimited') return 79900;
  if (planId === 'pro_unlimited_yearly') return 799900;
  const pack = CREDIT_PACKS.find(p => p.id === planId);
  return pack ? pack.priceInPaise : 0;
};

/**
 * Create order on backend and open web Razorpay checkout
 */
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

    // 1. Create order on backend
    const endpoint = `${BACKEND_URL}/api/create-order`;
    const payload = {
      userId,
      planId,
      amount: getAmountForPlan(planId),
    };

    const orderResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await orderResponse.text();
    let orderJson: any;
    try {
      orderJson = JSON.parse(responseText);
    } catch (e) {
      onError(`Server error: ${orderResponse.status}`);
      return;
    }

    // 2. Extract order details (handle both wrapped and raw response)
    let order_id: string;
    let orderAmount: number;
    let orderCurrency: string;
    let key_id: string | undefined;

    if (orderJson.success && orderJson.data) {
      order_id = orderJson.data.order_id;
      orderAmount = orderJson.data.amount;
      orderCurrency = orderJson.data.currency;
      key_id = orderJson.data.key_id;
    } else if (orderJson.id) {
      order_id = orderJson.id;
      orderAmount = orderJson.amount;
      orderCurrency = orderJson.currency;
      key_id = undefined;
    } else {
      const errMsg = orderJson.details
        ? `${orderJson.error}: ${orderJson.details}`
        : (orderJson.error || 'Failed to create order');
      onError(errMsg);
      return;
    }

    // 3. Open web Razorpay checkout
    // Suppress Razorpay's built-in alert() calls that cause popups on errors
    const originalAlert = window.alert;
    window.alert = function (msg: any) {
      console.warn('[RazorpayWeb] Suppressed alert:', msg);
    };

    // When order_id is provided, do NOT pass amount/currency — Razorpay fetches them from the order.
    // Passing them separately can cause mismatch errors.
    const options = {
      key: key_id || RAZORPAY_KEY,
      order_id: order_id,
      name: 'MedPlant',
      description: `Payment for ${planId}`,
      image: 'https://cdn-icons-png.flaticon.com/512/3061/3061341.png',
      prefill: {
        email: email,
      },
      theme: {
        color: '#00C896',
      },
      handler: async function (response: any) {
        console.log('[RazorpayWeb] Payment Success:', response);
        window.alert = originalAlert; // Restore alert
        onSuccess(response);
      },
      modal: {
        ondismiss: function () {
          window.alert = originalAlert; // Restore alert
          onError('Payment cancelled');
        },
      },
    };

    console.log('[RazorpayWeb] Opening checkout with options:', JSON.stringify({ key: options.key, order_id, name: options.name }));
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      console.error('[RazorpayWeb] Payment failed:', response.error);
      window.alert = originalAlert; // Restore alert
    });
    rzp.open();

  } catch (error: any) {
    console.error('[RazorpayWeb] Error:', error);
    onError(error.message || 'Something went wrong');
  }
};

// ─── Exported functions (same interface as native) ─────────────────

export const createProBasicSubscription = async (
  userId: string,
  email: string | undefined,
  onSuccess: () => void,
  onError: (error: string) => void
) => {
  await initiatePayment(userId, email, 'pro_basic', onSuccess, onError);
};

export const createProUnlimitedSubscription = async (
  userId: string,
  email: string | undefined,
  onSuccess: () => void,
  onError: (error: string) => void
) => {
  await initiatePayment(userId, email, 'pro_unlimited', onSuccess, onError);
};

export const createProUnlimitedYearlySubscription = async (
  userId: string,
  email: string | undefined,
  onSuccess: () => void,
  onError: (error: string) => void
) => {
  await initiatePayment(userId, email, 'pro_unlimited_yearly', onSuccess, onError);
};

export const purchaseCreditPack = async (
  userId: string,
  email: string | undefined,
  packId: string,
  onSuccess: (newBalance: number) => void,
  onError: (error: string) => void
) => {
  await initiatePayment(userId, email, packId, () => onSuccess(0), onError);
};
