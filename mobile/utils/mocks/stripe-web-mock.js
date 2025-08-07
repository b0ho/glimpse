// Mock for @stripe/stripe-react-native in web environment
export const useStripe = () => ({
  initPaymentSheet: async () => ({ error: null }),
  presentPaymentSheet: async () => ({ error: null }),
  confirmPayment: async () => ({ error: null }),
});

export const StripeProvider = ({ children }) => children;

export const CardField = () => null;

export default {
  useStripe,
  StripeProvider,
  CardField,
};