import { ConflictException, Injectable } from '@nestjs/common';
import { CorePaymentService } from './core-payment.service';
import type { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import type {
  IdempotencyRecord,
  PaymentResult,
} from './types/payments.types';
import {
  fingerprintsMatch,
  paymentRequestFingerprint,
} from './utils/payments.utils';

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
