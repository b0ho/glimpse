// Mock Stripe React Native for web platform
// This allows the app to run on web for testing without Stripe native dependencies

export const StripeProvider = ({ children }) => children;

export const CardField = () => null;

export const useStripe = () => ({
  createPaymentMethod: () => Promise.resolve({ paymentMethod: null, error: null }),
  createToken: () => Promise.resolve({ token: null, error: null }),
  confirmPayment: () => Promise.resolve({ paymentIntent: null, error: null }),
});

export const initStripe = () => Promise.resolve();

export default {
  StripeProvider,
  CardField,
  useStripe,
  initStripe,
};