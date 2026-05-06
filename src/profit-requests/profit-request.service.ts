import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfitDistributionsService } from '../profit-distributions/profit-distributions.service';

@Injectable()
export class ProfitRequestService {
  private APPROVAL_THRESHOLD = 0.6;
  private EXPIRY_HOURS = 48;

  constructor(
    private prisma: PrismaService,
    private distributionService: ProfitDistributionsService,
  ) {}

  /**
   * ✅ CREATE REQUEST
   */
  async createRequest(
    userId: string,
    data: { propertyId: string; amount: number },
  ) {
    const { propertyId, amount } = data;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const existing = await this.prisma.profitRequest.findFirst({
      where: {
        propertyId,
        status: 'PENDING',
      },
    });

    if (existing) {
      throw new BadRequestException('Active request already exists');
    }

    /**
     * ✅ CHECK AVAILABLE PROFIT
     */
    const profits = await this.prisma.propertyProfit.findMany({
      where: { propertyId },
    });

    const distributions = await this.prisma.profitDistribution.findMany({
      where: { propertyId },
    });

    const totalProfit = profits.reduce(
      (sum, p) => sum + Number(p.totalProfit),
      0,
    );

    const distributed = distributions.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );

    const available = totalProfit - distributed;

    if (amount > available) {
      throw new BadRequestException('Amount exceeds available profit');
    }

    return this.prisma.profitRequest.create({
      data: {
        propertyId,
        amount,
        createdBy: userId,
        expiresAt: new Date(
          Date.now() + this.EXPIRY_HOURS * 60 * 60 * 1000,
        ),
      },
    });
  }

  /**
   * ✅ VOTE
   */
  async vote(userId: string, data: { requestId: string; vote: boolean }) {
    const { requestId, vote } = data;

    const request = await this.prisma.profitRequest.findUnique({
      where: { id: requestId },
      include: { votes: true },
    });

    if (!request) throw new NotFoundException('Request not found');

    /**
     * 🚫 Prevent double execution
     */
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Voting closed');
    }

    /**
     * ⛔ EXPIRED
     */
    if (request.expiresAt && new Date() > request.expiresAt) {
      await this.prisma.profitRequest.update({
        where: { id: requestId },
        data: {
          status: 'EXPIRED',
          processedAt: new Date(),
        },
      });

      throw new BadRequestException('Request expired');
    }

    const existingVote = await this.prisma.profitVote.findUnique({
      where: {
        requestId_investorId: {
          requestId,
          investorId: userId,
        },
      },
    });

    if (existingVote) {
      throw new BadRequestException('Already voted');
    }

    const share = await this.prisma.investorShare.findFirst({
      where: {
        propertyId: request.propertyId,
        investorId: userId,
      },
    });

    if (!share) {
      throw new BadRequestException('Not an investor');
    }

    await this.prisma.profitVote.create({
      data: {
        requestId,
        investorId: userId,
        vote,
      },
    });

    return this.checkAndExecute(requestId);
  }

  /**
   * 🔥 CORE ENGINE (SAFE VERSION)
   */
  private async checkAndExecute(requestId: string) {
    /**
     * 🔒 Use transaction to avoid race condition
     */
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.profitRequest.findUnique({
        where: { id: requestId },
        include: { votes: true },
      });

      if (!request) {
        throw new NotFoundException('Request not found');
      }

      /**
       * 🚫 Already processed → STOP
       */
      if (request.status !== 'PENDING') {
        return { message: 'Already processed' };
      }

      /**
       * ⛔ EXPIRED
       */
      if (request.expiresAt && new Date() > request.expiresAt) {
        await tx.profitRequest.update({
          where: { id: requestId },
          data: {
            status: 'EXPIRED',
            processedAt: new Date(),
          },
        });

        return { message: 'Request expired' };
      }

      const investors = await tx.investorShare.findMany({
        where: { propertyId: request.propertyId },
      });

      const totalShares = investors.reduce(
        (sum, i) => sum + i.sharesOwned,
        0,
      );

      let yesShares = 0;
      let noShares = 0;

      for (const vote of request.votes) {
        const investor = investors.find(
          (i) => i.investorId === vote.investorId,
        );

        if (!investor) continue;

        if (vote.vote) {
          yesShares += investor.sharesOwned;
        } else {
          noShares += investor.sharesOwned;
        }
      }

      const approvalRatio =
        totalShares === 0 ? 0 : yesShares / totalShares;

      const rejectionRatio =
        totalShares === 0 ? 0 : noShares / totalShares;

      /**
       * ✅ APPROVED
       */
      if (approvalRatio >= this.APPROVAL_THRESHOLD) {
        await tx.profitRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            processedAt: new Date(),
          },
        });

        /**
         * ⚠️ OUTSIDE TX (important)
         */
        await this.distributionService.distributeProfit({
          propertyId: request.propertyId,
          totalProfit: request.amount,
          periodMonth: new Date().getMonth() + 1,
          periodYear: new Date().getFullYear(),
          creditWallet: true,
        });

        return {
          message: 'Approved & distributed',
          approvalRatio: Number((approvalRatio * 100).toFixed(2)),
        };
      }

      /**
       * ❌ REJECTED
       */
      if (rejectionRatio >= this.APPROVAL_THRESHOLD) {
        await tx.profitRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            processedAt: new Date(),
          },
        });

        return {
          message: 'Rejected',
          rejectionRatio: Number((rejectionRatio * 100).toFixed(2)),
        };
      }

      return {
        message: 'Vote recorded',
        approvalRatio: Number((approvalRatio * 100).toFixed(2)),
      };
    });
  }
}