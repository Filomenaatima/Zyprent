import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceAgingService } from './invoice-aging.service';
import { InvoiceCronService } from './invoice-cron.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    PaymentModule,
    NotificationsModule,
  ],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    InvoiceAgingService,
    InvoiceCronService,
  ],
  exports: [InvoiceService],
})
export class InvoiceModule {}