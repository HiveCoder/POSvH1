import { call } from './frappe-sdk';
import { IS_WEBSITE_MODE } from './platform';
import { WEBSITE_PAYMENT_MODES } from './website-mock';

interface PaymentMode {
  mode_of_payment: string;
  opening_amount: number;
}

interface PaymentModeResponse {
  message: PaymentMode[];
}

export const getPaymentModes = async (): Promise<string[]> => {
  if (IS_WEBSITE_MODE) {
    return WEBSITE_PAYMENT_MODES;
  }

  // Check local storage first
  const cached = localStorage.getItem('payment_modes');
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    const response = await call.get<PaymentModeResponse>("ury.ury_pos.api.getModeOfPayment");

    const paymentModes = response.message.map((mode:PaymentMode) => mode.mode_of_payment);
    
    // Cache in local storage
    localStorage.setItem('payment_modes', JSON.stringify(paymentModes));
    
    return paymentModes;
  } catch (error) {
    console.error('Failed to fetch payment modes:', error);
    throw error;
  }
}; 