import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import type { PaymentResult } from './types/payments.types';

@Injectable()
export class CorePaymentService {
  async createPayment(
    _paymentRequest: CreatePaymentRequestDto,
  ): Promise<PaymentResult> {
    const delayMs = Number(process.env.CORE_DELAY_MS ?? 250);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return {
      paymentId: randomUUID(),
      status: 'confirmed',
    };
  }
}
