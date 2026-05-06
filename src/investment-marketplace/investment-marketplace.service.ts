import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { BuySharesDto } from './dto/buy-shares.dto';
import { LedgerSource, KycStatus } from '@prisma/client';

@Injectable()
export class InvestmentMarketplaceService {
  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) {}

  /**
   * =========================================
   * CREATE OFFER
   * =========================================
   */
  async createOffer(dto: CreateOfferDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const existingOffer = await this.prisma.investmentOffer.findUnique({
      where: { propertyId: dto.propertyId },
    });

    if (existingOffer) {
      throw new BadRequestException(
        'This property already has an investment offer',
      );
    }

    return this.prisma.investmentOffer.create({
      data: {
        propertyId: dto.propertyId,
        totalShares: dto.totalShares,
        pricePerShare: dto.pricePerShare,
        sharesSold: 0,
        isActive: true,
      },
    });
  }

  /**
   * =========================================
   * GET ALL OFFERS
   * =========================================
   */
  async getOffers() {
    return this.prisma.investmentOffer.findMany({
      include: {
        property: true,
        investorShares: true,
      },
    });
  }

  /**
   * =========================================
   * GET SINGLE OFFER
   * =========================================
   */
  async getOffer(propertyId: string) {
    const offer = await this.prisma.investmentOffer.findUnique({
      where: { propertyId },
      include: {
        property: true,
        investorShares: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('Investment offer not found');
    }

    return offer;
  }

  /**
   * =========================================
   * BUY SHARES (PRIMARY MARKET - PRODUCTION SAFE)
   * =========================================
   */
  async buyShares(dto: BuySharesDto) {
    return this.prisma.$transaction(async (tx) => {
      // =========================================
      // 1. FETCH OFFER
      // =========================================
      const offer = await tx.investmentOffer.findUnique({
        where: { propertyId: dto.propertyId },
      });

      if (!offer || !offer.isActive) {
        throw new BadRequestException('Investment offer not active');
      }

      const remainingShares = offer.totalShares - offer.sharesSold;

      if (dto.shares > remainingShares) {
        throw new BadRequestException('Not enough shares available');
      }

      const amount = dto.shares * offer.pricePerShare;

      // =========================================
      // 2. KYC CHECK
      // =========================================
      const kyc = await tx.kycVerification.findUnique({
        where: { userId: dto.investorId },
      });

      if (!kyc || kyc.status !== KycStatus.APPROVED) {
        throw new BadRequestException(
          'Investor must complete KYC verification before investing',
        );
      }

      // =========================================
      // 3. WALLET BALANCE CHECK
      // =========================================
      const balance = await this.ledger.getBalance(dto.investorId);

      if (balance.toNumber() < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // =========================================
      // 4. UPSERT INVESTOR SHARE
      // =========================================
      const existing = await tx.investorShare.findUnique({
        where: {
          investorId_propertyId: {
            investorId: dto.investorId,
            propertyId: dto.propertyId,
          },
        },
      });

      let investorShare;

      if (existing) {
        investorShare = await tx.investorShare.update({
          where: { id: existing.id },
          data: {
            sharesOwned: {
              increment: dto.shares,
            },
            amountPaid: {
              increment: amount,
            },
            source: 'PLATFORM',
          },
        });
      } else {
        investorShare = await tx.investorShare.create({
          data: {
            investorId: dto.investorId,
            propertyId: dto.propertyId,
            offerId: offer.id,
            sharesOwned: dto.shares,
            amountPaid: amount,
            source: 'PLATFORM',
          },
        });
      }

      // =========================================
      // 5. UPDATE OFFER (SAFE INCREMENT)
      // =========================================
      const updatedOffer = await tx.investmentOffer.update({
        where: { id: offer.id },
        data: {
          sharesSold: {
            increment: dto.shares,
          },
        },
      });

      // =========================================
      // 6. RECORD SHARE TRANSACTION
      // =========================================
      await tx.shareTransaction.create({
        data: {
          investorId: dto.investorId,
          propertyId: dto.propertyId,
          investorShareId: investorShare.id,
          shares: dto.shares,
          amount,
          type: 'BUY',
        },
      });

      // =========================================
      // 7. LEDGER ENTRY (FINANCIAL CORE)
      // =========================================
      await this.ledger.recordDoubleEntry({
        debitAccountId: dto.investorId,
        creditAccountId: dto.propertyId,
        amount,
        source: LedgerSource.INVESTMENT,
        reference: `BUY_SHARES_${offer.id}`,
        propertyId: dto.propertyId,
      });

      // =========================================
      // 8. PRICE DISCOVERY (MARKET DEMAND)
      // =========================================
      const demandRatio =
        updatedOffer.sharesSold / updatedOffer.totalShares;

      let newPrice = updatedOffer.pricePerShare;

      if (demandRatio > 0.9) {
        newPrice = updatedOffer.pricePerShare * 1.25;
      } else if (demandRatio > 0.7) {
        newPrice = updatedOffer.pricePerShare * 1.1;
      }

      await tx.investmentOffer.update({
        where: { id: offer.id },
        data: { pricePerShare: newPrice },
      });

      return {
        message: 'Shares purchased successfully',
        sharesBought: dto.shares,
        totalPaid: amount,
        newSharePrice: newPrice,
      };
    });
  }
}