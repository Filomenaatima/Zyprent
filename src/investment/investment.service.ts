import { Injectable, BadRequestException } from '@nestjs/common';
import {
  AccountType,
  InvestmentSource,
  LedgerSource,
  Prisma,
  ShareTransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvestmentService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateUserAccount(
    tx: Prisma.TransactionClient,
    userId: string,
  ) {
    let account = await tx.account.findFirst({
      where: { userId, type: AccountType.USER },
    });

    if (!account) {
      account = await tx.account.create({
        data: { userId, type: AccountType.USER },
      });
    }

    return account;
  }

  private async getOrCreatePropertyAccount(
    tx: Prisma.TransactionClient,
    propertyId: string,
  ) {
    let account = await tx.account.findFirst({
      where: { propertyId, type: AccountType.PROPERTY },
    });

    if (!account) {
      account = await tx.account.create({
        data: { propertyId, type: AccountType.PROPERTY },
      });
    }

    return account;
  }

  private async syncWalletWithAccount(
    tx: Prisma.TransactionClient,
    userId: string,
  ) {
    const account = await tx.account.findFirst({
      where: { userId, type: AccountType.USER },
    });

    const balance = Number(account?.balance ?? 0);

    await tx.wallet.upsert({
      where: { userId },
      update: { balance: new Prisma.Decimal(balance) },
      create: { userId, balance: new Prisma.Decimal(balance) },
    });

    return balance;
  }

  async createInvestment(
    propertyId: string,
    investorEmailOrId: string,
    amount: number,
  ) {
    const investor = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: investorEmailOrId, role: 'INVESTOR' },
          { id: investorEmailOrId, role: 'INVESTOR' },
        ],
      },
    });

    if (!investor) throw new BadRequestException('Investor user not found');
    if (amount <= 0) {
      throw new BadRequestException('Investment amount must be greater than 0');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { investmentOffer: true },
    });

    if (!property) throw new BadRequestException('Property not found');

    const investment = await this.prisma.investment.create({
      data: {
        propertyId,
        investorId: investor.id,
        amount,
      },
      include: {
        investor: { select: { id: true, name: true, email: true } },
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            slug: true,
            phase: true,
            version: true,
          },
        },
      },
    });

    return { message: 'Investment created', investment };
  }

  async buyInvestmentShares(userId: string, propertyId: string, shares: number) {
    if (!Number.isInteger(shares) || shares <= 0) {
      throw new BadRequestException('Shares must be a positive whole number');
    }

    return this.prisma.$transaction(async (tx) => {
      const investor = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, name: true, email: true },
      });

      if (!investor || investor.role !== 'INVESTOR') {
        throw new BadRequestException('Only investors can buy shares');
      }

      const offer = await tx.investmentOffer.findUnique({
        where: { propertyId },
        include: { property: true },
      });

      if (!offer) throw new BadRequestException('Investment offer not found');
      if (!offer.isActive) throw new BadRequestException('Offer is not active');

      const sharesRemaining = offer.totalShares - offer.sharesSold;

      if (shares > sharesRemaining) {
        throw new BadRequestException(
          `Only ${sharesRemaining} shares remain for this offer`,
        );
      }

      const amount = new Prisma.Decimal(offer.pricePerShare).mul(shares);

      const investorAccount = await this.getOrCreateUserAccount(tx, userId);
      const propertyAccount = await this.getOrCreatePropertyAccount(
        tx,
        propertyId,
      );

      if (new Prisma.Decimal(investorAccount.balance ?? 0).lt(amount)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const reference = `INV-${offer.property.title
        .replace(/\s+/g, '-')
        .toUpperCase()}-${Date.now()}`;

      await tx.account.update({
        where: { id: investorAccount.id },
        data: { balance: { decrement: amount } },
      });

      await tx.account.update({
        where: { id: propertyAccount.id },
        data: { balance: { increment: amount } },
      });

      await tx.ledgerEntry.createMany({
        data: [
          {
            accountId: investorAccount.id,
            debit: amount,
            credit: new Prisma.Decimal(0),
            source: LedgerSource.INVESTMENT,
            propertyId,
            reference,
          },
          {
            accountId: propertyAccount.id,
            debit: new Prisma.Decimal(0),
            credit: amount,
            source: LedgerSource.INVESTMENT,
            propertyId,
            reference,
          },
        ],
      });

      await tx.investmentOffer.update({
        where: { id: offer.id },
        data: {
          sharesSold: { increment: shares },
          isActive: sharesRemaining - shares > 0,
        },
      });

      const existingShare = await tx.investorShare.findUnique({
        where: {
          investorId_propertyId: {
            investorId: userId,
            propertyId,
          },
        },
      });

      const investorShare = existingShare
        ? await tx.investorShare.update({
            where: { id: existingShare.id },
            data: {
              sharesOwned: { increment: shares },
              amountPaid: { increment: amount.toNumber() },
              offerId: offer.id,
              source: InvestmentSource.PLATFORM,
            },
          })
        : await tx.investorShare.create({
            data: {
              investorId: userId,
              propertyId,
              offerId: offer.id,
              sharesOwned: shares,
              amountPaid: amount.toNumber(),
              source: InvestmentSource.PLATFORM,
            },
          });

      const investment = await tx.investment.create({
        data: {
          investorId: userId,
          propertyId,
          amount: amount.toNumber(),
        },
      });

      await tx.shareTransaction.create({
        data: {
          investorId: userId,
          propertyId,
          investorShareId: investorShare.id,
          shares,
          amount: amount.toNumber(),
          type: ShareTransactionType.BUY,
        },
      });

      await this.syncWalletWithAccount(tx, userId);

      return {
        message: 'Shares purchased successfully',
        reference,
        investment,
        property: {
          id: offer.property.id,
          title: offer.property.title,
          location: offer.property.location,
        },
        sharesPurchased: shares,
        amountPaid: amount.toNumber(),
      };
    });
  }

  async getUserInvestments(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: { investorId: userId },
      include: { property: true },
      orderBy: [{ createdAt: 'desc' }],
    });

    const totalInvested = investments.reduce(
      (sum, investment) => sum + Number(investment.amount),
      0,
    );

    return {
      items: investments,
      summary: {
        totalInvestments: investments.length,
        totalInvested,
      },
    };
  }

  async getOpportunities(userId: string) {
    const properties = await this.prisma.property.findMany({
      include: {
        investmentOffer: true,
        shares: { where: { investorId: userId } },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return properties
      .map((property) => {
        const offer = property.investmentOffer;
        if (!offer) return null;

        const sharesRemaining = offer.totalShares - offer.sharesSold;
        const progress =
          offer.totalShares > 0
            ? (offer.sharesSold / offer.totalShares) * 100
            : 0;

        const userShares = property.shares[0];

        return {
          propertyId: property.id,
          title: property.title,
          location: property.location,
          slug: property.slug,
          phase: property.phase,
          version: property.version,
          isPropertyActive: property.isActive,
          pricePerShare: offer.pricePerShare,
          totalShares: offer.totalShares,
          sharesSold: offer.sharesSold,
          sharesRemaining,
          progress: Math.round(progress),
          isActive: offer.isActive,
          isSoldOut: sharesRemaining <= 0,
          userSharesOwned: userShares?.sharesOwned || 0,
          hasInvested: Boolean(userShares && userShares.sharesOwned > 0),
        };
      })
      .filter(Boolean);
  }

  async getMarketplace(propertyId?: string) {
    return this.prisma.shareListing.findMany({
      where: {
        isActive: true,
        ...(propertyId ? { propertyId } : {}),
      },
      include: {
        property: true,
        investor: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ pricePerShare: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getMyHistory(userId: string) {
    return this.prisma.shareTransaction.findMany({
      where: { investorId: userId },
      include: { property: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInactiveOffers() {
    const properties = await this.prisma.property.findMany({
      include: { investmentOffer: true },
      orderBy: [{ createdAt: 'desc' }],
    });

    return properties
      .map((property) => {
        const offer = property.investmentOffer;
        if (!offer) return null;

        const sharesRemaining = offer.totalShares - offer.sharesSold;
        const isSoldOut = sharesRemaining <= 0;

        if (offer.isActive && !isSoldOut) return null;

        return {
          propertyId: property.id,
          title: property.title,
          location: property.location,
          slug: property.slug,
          phase: property.phase,
          version: property.version,
          pricePerShare: offer.pricePerShare,
          totalShares: offer.totalShares,
          sharesSold: offer.sharesSold,
          sharesRemaining,
          isActive: offer.isActive,
          isSoldOut,
        };
      })
      .filter(Boolean);
  }

  async getAdminOverview() {
    const [investments, properties, offers, distributions] = await Promise.all([
      this.prisma.investment.findMany({
        include: {
          property: true,
          investor: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.property.findMany({ include: { investmentOffer: true } }),
      this.prisma.investmentOffer.findMany(),
      this.prisma.profitDistribution.findMany(),
    ]);

    const totalInvested = investments.reduce(
      (sum, inv) => sum + Number(inv.amount),
      0,
    );

    const totalDistributed = distributions.reduce(
      (sum, dist) => sum + Number(dist.amount),
      0,
    );

    return {
      summary: {
        totalInvestments: investments.length,
        totalInvested,
        totalDistributed,
        totalProperties: properties.length,
        activeOffers: offers.filter((offer) => offer.isActive).length,
      },
      investments,
    };
  }

  async distributeProfit(propertyId: string) {
    throw new BadRequestException(
      'Manual profit distribution has moved to the monthly profit distribution job',
    );
  }
}