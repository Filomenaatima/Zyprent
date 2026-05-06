import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    PaymentModule, // 👈 THIS IS THE FIX
  ],
  controllers: [WebhookController],
})
export class WebhookModule {}
