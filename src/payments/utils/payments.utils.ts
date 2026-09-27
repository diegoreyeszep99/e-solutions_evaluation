import type { CreatePaymentRequestDto } from '../dto/create-payment-request.dto';
import type { PaymentRequestFingerprint } from '../types/payments.types';

export function paymentRequestFingerprint(
  paymentRequest: CreatePaymentRequestDto,
): PaymentRequestFingerprint {
  return {
    amountInMinorUnits: paymentRequest.amountInMinorUnits,
    currency: paymentRequest.currency,
  };
}

export function fingerprintsMatch(
  left: PaymentRequestFingerprint,
  right: PaymentRequestFingerprint,
): boolean {
  const keys = Object.keys(left) as (keyof PaymentRequestFingerprint)[];
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => left[key] === right[key])
  );
}
