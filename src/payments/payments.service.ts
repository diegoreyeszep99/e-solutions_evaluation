import { ConflictException, Injectable } from '@nestjs/common';
import {
  CorePaymentService,
  PaymentResult,
} from './core-payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

interface IdempotencyRecord {
  fingerprint: string;
  result: Promise<PaymentResult>;
}

@Injectable()
export class PaymentsService {
  private readonly records = new Map<string, IdempotencyRecord>();

  constructor(private readonly corePaymentService: CorePaymentService) {}

  create(
    idempotencyKey: string,
    payment: CreatePaymentDto,
  ): Promise<PaymentResult> {
    const fingerprint = `${payment.amountInMinorUnits}:${payment.currency}`;
    const existing = this.records.get(idempotencyKey);

    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new ConflictException({
          code: 'IDEMPOTENCY_KEY_CONFLICT',
          message: 'Idempotency key was already used for another payment',
        });
      }

      return existing.result;
    }

    const result = this.corePaymentService.createPayment(payment);
    this.records.set(idempotencyKey, { fingerprint, result });
    return result;
  }
}
