import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoiceAgingService {
  private readonly logger = new Logger(InvoiceAgingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async ageInvoices(): Promise<void> {
    const today = new Date();

    const result = await this.prisma.rentInvoice.updateMany({
      where: {
        status: {
          in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID],
        },
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: InvoiceStatus.OVERDUE,
      },
    });

    if (result.count === 0) {
      this.logger.log('No invoices to age.');
      return;
    }

    this.logger.log(`Aged ${result.count} invoices to OVERDUE`);
  }
}