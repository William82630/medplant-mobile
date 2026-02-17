/**
 * RazorpayService (Native) - Web Checkout via hosted page
 * Opens Razorpay checkout in browser instead of native SDK.
 * No react-native-razorpay dependency.
 */

import * as WebBrowser from 'expo-web-browser';

const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SGNvWrBGzR66Hh';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Credit Pack Definitions
export const CREDIT_PACKS = [
  { id: 'pack_1', credits: 1, price: 10, priceInPaise: 1000, label: '1 Scan', description: '₹10' },
  { id: 'pack_10', credits: 10, price: 79, priceInPaise: 7900, label: '10 Scans', description: '₹79' },
  { id: 'pack_20', credits: 20, price: 149, priceInPaise: 14900, label: '20 Scans', description: '₹149', bestValue: true },
  { id: 'pack_30', credits: 30, price: 199, priceInPaise: 19900, label: '30 Scans', description: '₹199' },
];

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
 * Create order on backend and open web checkout in browser
 */
const initiatePayment = async (
  userId: string,
  email: string | undefined,
  planId: string,
  onSuccess: (data?: any) => void,
  onError: (error: string) => void
) => {
  console.log('[RazorpayWeb] initiatePayment called. planId:', planId);

  try {
    // 1. Create order on backend
    const endpoint = `${BACKEND_URL}/api/create-order`;
    const payload = {
      userId,
      planId,
      amount: getAmountForPlan(planId),
    };

    console.log('[RazorpayWeb] Creating order...', endpoint);

    const orderResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('[RazorpayWeb] Order response status:', orderResponse.status);
    const responseText = await orderResponse.text();
    console.log('[RazorpayWeb] Order response:', responseText);

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

    // 3. Build checkout URL — do NOT pass amount/currency; Razorpay fetches them from order_id
    // redirect_url tells checkout to use callback_url (Razorpay redirects there after payment)
    // which the payment-redirect endpoint converts to a deep link
    const redirectUrl = `${BACKEND_URL}/api/payment-redirect`;
    const checkoutParams = new URLSearchParams({
      key: key_id || RAZORPAY_KEY,
      order_id: order_id,
      name: 'MedPlant',
      description: `Payment for ${planId}`,
      email: email || '',
      callback: 'medplant://payment-success',
      redirect_url: redirectUrl,
    });

    const checkoutUrl = `${BACKEND_URL}/api/checkout?${checkoutParams.toString()}`;
    console.log('[RazorpayWeb] key_id from backend:', key_id, '| fallback:', RAZORPAY_KEY, '| using:', key_id || RAZORPAY_KEY);
    console.log('[RazorpayWeb] order_id:', order_id, '| amount:', orderAmount, '| currency:', orderCurrency);
    console.log('[RazorpayWeb] Opening checkout URL:', checkoutUrl);

    // 4. Open in-app browser and wait for redirect
    const result = await WebBrowser.openAuthSessionAsync(
      checkoutUrl,
      'medplant://'
    );

    console.log('[RazorpayWeb] Browser result:', JSON.stringify(result));

    // 5. Handle result — parse deep link as plain string (no URL() — breaks on custom schemes)
    if (result.type === 'success' && result.url) {
      const returnUrl = result.url;
      console.log('[RazorpayWeb] Return URL:', returnUrl);

      if (returnUrl.includes('payment-success')) {
        // Extract query params from string
        const queryString = returnUrl.split('?')[1] || '';
        const params = new URLSearchParams(queryString);
        const paymentId = params.get('razorpay_payment_id');
        const orderId = params.get('razorpay_order_id');
        const signature = params.get('razorpay_signature');
        const debugStatus = params.get('debug_status');
        console.log('[RazorpayWeb] Payment success! ID:', paymentId);
        console.log('[RazorpayWeb] DEBUG_STATUS:', debugStatus);
        console.log('[RazorpayWeb] Full return URL:', returnUrl);
        // Temporary diagnostic alert — remove after debugging
        if (debugStatus && debugStatus !== 'ActivationSuccess') {
          console.error('[RazorpayWeb] ⚠️ ACTIVATION DID NOT SUCCEED. Status:', debugStatus);
        }
        onSuccess({ razorpay_payment_id: paymentId, razorpay_order_id: orderId, razorpay_signature: signature });
      } else if (returnUrl.includes('payment-failed')) {
        const queryString = returnUrl.split('?')[1] || '';
        const params = new URLSearchParams(queryString);
        const error = params.get('error') || 'Payment failed';
        console.log('[RazorpayWeb] Payment failed:', error);
        onError(error);
      } else if (returnUrl.includes('payment-cancelled')) {
        console.log('[RazorpayWeb] Payment cancelled');
        onError('Payment cancelled');
      } else {
        console.log('[RazorpayWeb] Unknown return URL:', returnUrl);
        onError('Payment status unknown');
      }
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      console.log('[RazorpayWeb] Browser dismissed');
      onError('Payment cancelled');
    } else {
      onError('Payment cancelled');
    }

  } catch (error: any) {
    console.error('[RazorpayWeb] Error:', error);
    onError(error?.message || 'Payment failed');
  }
};

// ─── Exported functions (same interface as web) ────────────────────

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

// Web checkout doesn't need initialization
export const initializeRazorpay = (): Promise<boolean> => Promise.resolve(true);
