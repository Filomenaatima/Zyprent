import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvestorShareService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * =========================================
   * CREATE SHARE (OWNERSHIP SAFE)
   * =========================================
   */
  async createShare(data: {
    investorId: string;
    propertyId: string;
    offerId?: string;
    sharesOwned: number; // % ownership
    amountPaid: number;
  }) {
    const { investorId, propertyId, sharesOwned, amountPaid } = data;

    if (sharesOwned <= 0 || sharesOwned > 100) {
      throw new BadRequestException('Shares must be between 0 and 100 (%)');
    }

    return this.prisma.$transaction(async (tx) => {
      const investor = await tx.user.findUnique({
        where: { id: investorId },
      });

      if (!investor) {
        throw new BadRequestException('Investor not found');
      }

      const property = await tx.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        throw new BadRequestException('Property not found');
      }

      const offer = await tx.investmentOffer.findUnique({
        where: { propertyId },
      });

      if (!offer || !offer.isActive) {
        throw new BadRequestException('No active investment offer');
      }

      // ✅ ENFORCE 100% CAP
      const remainingShares = offer.totalShares - offer.sharesSold;

      if (sharesOwned > remainingShares) {
        throw new BadRequestException(
          `Only ${remainingShares}% remaining`,
        );
      }

      // ✅ VALIDATE PRICE
      const expectedAmount = sharesOwned * offer.pricePerShare;

      if (Math.abs(expectedAmount - amountPaid) > 1) {
        throw new BadRequestException(
          `Invalid amount. Expected ${expectedAmount}`,
        );
      }

      const existing = await tx.investorShare.findUnique({
        where: {
          investorId_propertyId: {
            investorId,
            propertyId,
          },
        },
      });

      let shareRecord;

      if (existing) {
        shareRecord = await tx.investorShare.update({
          where: { id: existing.id },
          data: {
            sharesOwned: { increment: sharesOwned },
            amountPaid: { increment: amountPaid },
          },
        });
      } else {
        shareRecord = await tx.investorShare.create({
          data: {
            investorId,
            propertyId,
            offerId: offer.id,
            sharesOwned,
            amountPaid,
            source: 'PLATFORM',
          },
        });
      }

      // ✅ UPDATE SOLD SHARES
      await tx.investmentOffer.update({
        where: { id: offer.id },
        data: {
          sharesSold: { increment: sharesOwned },
        },
      });

      // ✅ AUDIT TRAIL (YOU HAD THIS — RESTORED)
      await tx.shareTransaction.create({
        data: {
          investorId,
          propertyId,
          investorShareId: shareRecord.id,
          shares: sharesOwned,
          amount: amountPaid,
          type: 'BUY',
        },
      });

      return {
        message: 'Investor shares processed successfully',
        data: shareRecord,
      };
    });
  }

  /**
   * =========================================
   * PROPERTY INVESTORS (RESTORED)
   * =========================================
   */
  async getPropertyInvestors(propertyId: string) {
    return this.prisma.investorShare.findMany({
      where: { propertyId },
      include: { investor: true },
    });
  }

  /**
   * =========================================
   * INVESTOR PORTFOLIO (RESTORED)
   * =========================================
   */
  async getInvestorPortfolio(investorId: string) {
    const shares = await this.prisma.investorShare.findMany({
      where: { investorId },
      include: {
        property: {
          include: {
            investmentOffer: true,
          },
        },
      },
    });

    return shares.map((share) => ({
      propertyId: share.propertyId,
      title: share.property?.title,
      location: share.property?.location,

      sharesOwned: share.sharesOwned, // already %
      ownershipPercentage: share.sharesOwned, // ✅ FIXED

      amountPaid: Number(share.amountPaid),
    }));
  }
}