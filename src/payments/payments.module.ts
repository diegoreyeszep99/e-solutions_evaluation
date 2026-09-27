import { Module } from '@nestjs/common';
import { CorePaymentService } from './core-payment.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [CorePaymentService, PaymentsService],
})
export class PaymentsModule {}
