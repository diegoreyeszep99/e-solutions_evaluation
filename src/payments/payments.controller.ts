import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() payment: CreatePaymentDto,
  ) {
    if (!idempotencyKey || idempotencyKey.length > 128) {
      throw new BadRequestException({
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'Idempotency-Key header is required and must be at most 128 characters',
      });
    }

    return this.paymentsService.create(idempotencyKey, payment);
  }
}
