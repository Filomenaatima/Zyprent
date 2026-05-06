import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceService } from './invoice.service';
import { InvoiceAgingService } from './invoice-aging.service';

@Injectable()
export class InvoiceCronService {
  private readonly logger = new Logger(InvoiceCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService,
    private readonly invoiceAgingService: InvoiceAgingService,
  ) {}

  /**
   * ✅ DAILY AUTO BILLING (FIXED)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleInvoiceGeneration() {
    this.logger.log('🚀 Running daily invoice job');

    /**
     * 🔥 AGING RESILIENCE (RUN FIRST)
     */
    await this.invoiceAgingService.ageInvoices();

    const today = new Date();

    const contracts = await this.prisma.rentContract.findMany({
      where: {
        isActive: true,
        nextBillingDate: {
          lte: today,
        },
      },
    });

    this.logger.log(`📊 ${contracts.length} contracts ready`);

    for (const contract of contracts) {
      try {
        /**
         * 🔥 MISSED MONTHS RECOVERY
         * Generate up to 12 months safely
         */
        const invoices = await this.invoiceService.generateInvoice(
          contract.id,
          12, // 🔥 FIXED
          false,
        );

        if (invoices.length === 0) {
          this.logger.warn(
            `⚠️ No invoices created for ${contract.id} (already up to date)`,
          );
        } else {
          this.logger.log(
            `✅ Billed ${contract.id} (${invoices.length} invoices)`,
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);

        this.logger.error(
          `❌ Failed ${contract.id}: ${message}`,
        );
      }
    }
  }

  /**
   * ✅ AGING JOB (STILL KEPT SEPARATE)
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleInvoiceAging() {
    this.logger.log('⏳ Running aging job');
    await this.invoiceAgingService.ageInvoices();
  }
}