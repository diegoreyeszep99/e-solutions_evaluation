import { ConflictException, Injectable } from '@nestjs/common';
import {
  CorePaymentService,
  PaymentResult,
} from './core-payment.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';

type PaymentRequestFingerprint = Readonly<{
  [Key in keyof CreatePaymentRequestDto]: CreatePaymentRequestDto[Key];
}>;

interface IdempotencyRecord {
  fingerprint: PaymentRequestFingerprint;
  result: Promise<PaymentResult>;
}

function paymentRequestFingerprint(
  paymentRequest: CreatePaymentRequestDto,
): PaymentRequestFingerprint {
  return {
    amountInMinorUnits: paymentRequest.amountInMinorUnits,
    currency: paymentRequest.currency,
  };
}

function fingerprintsMatch(
  left: PaymentRequestFingerprint,
  right: PaymentRequestFingerprint,
): boolean {
  const keys = Object.keys(left) as (keyof PaymentRequestFingerprint)[];
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => left[key] === right[key])
  );
}

@Injectable()
export class PaymentsService {
  private readonly records = new Map<string, IdempotencyRecord>();

  constructor(private readonly corePaymentService: CorePaymentService) {}

  create(
    idempotencyKey: string,
    paymentRequest: CreatePaymentRequestDto,
  ): Promise<PaymentResult> {
    const fingerprint = paymentRequestFingerprint(paymentRequest);
    const existing = this.records.get(idempotencyKey);

    if (existing) {
      if (!fingerprintsMatch(existing.fingerprint, fingerprint)) {
        throw new ConflictException({
          code: 'IDEMPOTENCY_KEY_CONFLICT',
          message: 'Idempotency key was already used for another payment request',
        });
      }

      return existing.result;
    }

    const result = this.corePaymentService.createPayment(paymentRequest);
    this.records.set(idempotencyKey, { fingerprint, result });
    return result;
  }
}
