import type { CreatePaymentRequestDto } from '../dto/create-payment-request.dto';

export type PaymentResult = {
  paymentId: string;
  status: 'confirmed';
};

export type PaymentRequestFingerprint = Readonly<{
  [Key in keyof CreatePaymentRequestDto]: CreatePaymentRequestDto[Key];
}>;

export type IdempotencyRecord = {
  fingerprint: PaymentRequestFingerprint;
  result: Promise<PaymentResult>;
};
