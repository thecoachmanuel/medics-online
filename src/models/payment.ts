// Payment model interface for Paystack
export type PaymentResponse = {
  reference: string;
  status: string;
  message: string;
};
