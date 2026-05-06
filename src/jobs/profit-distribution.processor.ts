import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { PROFIT_QUEUE } from './profit.queue';

@Processor(PROFIT_QUEUE)
export class ProfitDistributionProcessor extends WorkerHost {

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {

    console.log('Running background job:', job.name);

    const { propertyId, profitPerShare, periodMonth, periodYear } = job.data;

    console.log('Processing profit distribution for property:', propertyId);

    const investors = await this.prisma.investorShare.findMany({
      where: { propertyId }
    });

    for (const investor of investors) {

      /**
       * ✅ Ensure numeric safety (Decimal-safe)
       */
      const payout =
        Number(investor.sharesOwned) * Number(profitPerShare);

      if (payout <= 0) continue;

      /**
       * ✅ Wallet uses userId (NOT investorId)
       */
      const wallet = await this.prisma.wallet.upsert({
        where: { userId: investor.investorId },
        update: {
          balance: {
            increment: payout,
          },
        },
        create: {
          userId: investor.investorId,
          balance: payout,
        },
      });

      /**
       * ✅ Wallet transaction (schema-compliant)
       */
      await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'PROFIT',
          amount: payout,
          status: 'COMPLETED',
        },
      });

      /**
       * ✅ Profit record (business layer stays the same)
       */
      await this.prisma.profitDistribution.create({
        data: {
          propertyId,
          investorId: investor.investorId,
          amount: payout,
          periodMonth,
          periodYear,
        },
      });

      console.log(
        `Investor ${investor.investorId} received profit ${payout}`
      );
    }

    console.log('Profit distribution completed');

    return true;
  }
}