import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValuationService } from '../valuation/valuation.service';

type PortfolioPropertyRow = {
  propertyId: string;
  title: string | null;
  location: string | null;
  sharesOwned: number;
  totalInvested: number;
  entryPricePerShare: number;
  currentPricePerShare: number;
  totalProfitEarned: number;
};

@Injectable()
export class PortfolioService {
  constructor(
    private prisma: PrismaService,
    private valuation: ValuationService,
  ) {}

  private round(value: number) {
    return Number((value || 0).toFixed(2));
  }

  private maskName(
    currentUserId: string,
    investorId: string,
    name?: string | null,
    email?: string | null,
  ) {
    if (currentUserId === investorId) return 'You';

    if (name?.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return `${parts[0].slice(0, 1)}***`;
      return `${parts[0]} ${parts[1].slice(0, 1)}.`;
    }

    if (email?.trim()) {
      return `${email.split('@')[0].slice(0, 3)}***`;
    }

    return 'Anonymous Investor';
  }

  private getSafeCurrentSharePrice(params: {
    invested: number;
    sharesOwned: number;
    valuationCurrentSharePrice?: number | null;
  }) {
    const { invested, sharesOwned, valuationCurrentSharePrice } = params;

    const entryPrice =
      sharesOwned > 0 ? invested / sharesOwned : 0;

    if (entryPrice <= 0) return 0;

    const candidate = Number(valuationCurrentSharePrice ?? 0);

    // Keep portfolio realistic:
    // - ignore zero/negative values
    // - ignore extreme jumps from valuation service
    // - fallback to entry price
    if (candidate <= 0) return entryPrice;

    // Safety cap: allow appreciation but prevent absurd multipliers
    if (candidate > entryPrice * 2) return entryPrice;

    return candidate;
  }

  async getInvestorPortfolio(userId: string) {
    const shares = await this.prisma.investorShare.findMany({
      where: { investorId: userId },
      include: {
        property: {
          include: {
            investmentOffer: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    const profitRows = await this.prisma.profitDistribution.groupBy({
      by: ['propertyId'],
      where: { investorId: userId },
      _sum: {
        amount: true,
      },
    });

    const profitMap = new Map<string, number>(
      profitRows.map((row) => [row.propertyId, Number(row._sum.amount ?? 0)]),
    );

    const uniquePropertyIds = [...new Set(shares.map((item) => item.propertyId))];

    const valuationEntries = await Promise.all(
      uniquePropertyIds.map(async (propertyId) => {
        try {
          const result =
            await this.valuation.calculatePropertyValue(propertyId);
          return [propertyId, result] as const;
        } catch {
          return [propertyId, null] as const;
        }
      }),
    );

    const valuationMap = new Map(valuationEntries);

    const grouped = new Map<string, PortfolioPropertyRow>();

    for (const share of shares) {
      const sharesOwned = Number(share.sharesOwned ?? 0);
      const totalInvested = Number(share.amountPaid ?? 0);

      const entryPricePerShare =
        sharesOwned > 0 ? totalInvested / sharesOwned : 0;

      const valuation = valuationMap.get(share.propertyId);

      const currentPricePerShare = this.getSafeCurrentSharePrice({
        invested: totalInvested,
        sharesOwned,
        valuationCurrentSharePrice: Number(
          valuation?.currentSharePrice ?? 0,
        ),
      });

      const existing = grouped.get(share.propertyId);

      if (!existing) {
        grouped.set(share.propertyId, {
          propertyId: share.propertyId,
          title: share.property?.title ?? null,
          location: share.property?.location ?? null,
          sharesOwned,
          totalInvested,
          entryPricePerShare,
          currentPricePerShare,
          totalProfitEarned: Number(profitMap.get(share.propertyId) ?? 0),
        });
      } else {
        existing.sharesOwned += sharesOwned;
        existing.totalInvested += totalInvested;

        // Recalculate weighted entry price
        existing.entryPricePerShare =
          existing.sharesOwned > 0
            ? existing.totalInvested / existing.sharesOwned
            : 0;

        // Keep safe current price in line with updated totals
        existing.currentPricePerShare = this.getSafeCurrentSharePrice({
          invested: existing.totalInvested,
          sharesOwned: existing.sharesOwned,
          valuationCurrentSharePrice: Number(
            valuation?.currentSharePrice ?? 0,
          ),
        });

        existing.totalProfitEarned = Number(
          profitMap.get(share.propertyId) ?? 0,
        );
      }
    }

    const properties = Array.from(grouped.values()).map((item) => {
      const currentValue = item.sharesOwned * item.currentPricePerShare;
      const unrealizedReturn = currentValue - item.totalInvested;
      const totalReturn = unrealizedReturn + item.totalProfitEarned;
      const roi =
        item.totalInvested > 0
          ? (totalReturn / item.totalInvested) * 100
          : 0;

      return {
        propertyId: item.propertyId,
        title: item.title,
        location: item.location,
        sharesOwned: this.round(item.sharesOwned),
        totalInvested: this.round(item.totalInvested),
        currentValue: this.round(currentValue),
        totalProfitEarned: this.round(item.totalProfitEarned),
        unrealizedReturn: this.round(unrealizedReturn),
        totalReturn: this.round(totalReturn),
        roi: this.round(roi),
        entryPricePerShare: this.round(item.entryPricePerShare),
        currentPricePerShare: this.round(item.currentPricePerShare),
        priceMovementDirection:
          item.currentPricePerShare > item.entryPricePerShare
            ? 'UP'
            : item.currentPricePerShare < item.entryPricePerShare
            ? 'DOWN'
            : 'FLAT',
        priceMovementPercent: this.round(
          item.entryPricePerShare > 0
            ? ((item.currentPricePerShare - item.entryPricePerShare) /
                item.entryPricePerShare) *
                100
            : 0,
        ),
      };
    });

    const totalInvested = properties.reduce(
      (sum, item) => sum + item.totalInvested,
      0,
    );

    const totalSharesHeld = properties.reduce(
      (sum, item) => sum + item.sharesOwned,
      0,
    );

    const totalPortfolioValue = properties.reduce(
      (sum, item) => sum + item.currentValue,
      0,
    );

    const totalProfitEarned = properties.reduce(
      (sum, item) => sum + item.totalProfitEarned,
      0,
    );

    const unrealizedReturn = totalPortfolioValue - totalInvested;
    const totalReturn = unrealizedReturn + totalProfitEarned;
    const roi =
      totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    const propertyAllocation = properties.map((item) => ({
      propertyId: item.propertyId,
      title: item.title,
      location: item.location,
      invested: item.totalInvested,
      allocationPercent:
        totalInvested > 0
          ? this.round((item.totalInvested / totalInvested) * 100)
          : 0,
    }));

    const topHolding =
      properties.length > 0
        ? [...properties].sort((a, b) => b.totalInvested - a.totalInvested)[0]
        : null;

    const topPerformer =
      properties.length > 0
        ? [...properties].sort((a, b) => b.roi - a.roi)[0]
        : null;

    const avgEntryPrice =
      totalSharesHeld > 0 ? totalInvested / totalSharesHeld : 0;

    return {
      totalInvested: this.round(totalInvested),
      totalOwnershipPercentage: this.round(totalSharesHeld),
      walletBalance: this.round(Number(wallet?.balance ?? 0)),
      totalPortfolioValue: this.round(totalPortfolioValue),
      totalProfitEarned: this.round(totalProfitEarned),
      unrealizedReturn: this.round(unrealizedReturn),
      totalReturn: this.round(totalReturn),
      roi: this.round(roi),

      summary: {
        propertiesCount: properties.length,
        sharesHeld: this.round(totalSharesHeld),
        walletBalance: this.round(Number(wallet?.balance ?? 0)),
        totalInvested: this.round(totalInvested),
        totalPortfolioValue: this.round(totalPortfolioValue),
        totalProfitEarned: this.round(totalProfitEarned),
        unrealizedReturn: this.round(unrealizedReturn),
        totalReturn: this.round(totalReturn),
        roi: this.round(roi),
      },

      propertyAllocation,
      portfolioSignals: {
        topHolding: topHolding?.title ?? null,
        topPerformer: topPerformer?.title ?? null,
        avgEntryPrice: this.round(avgEntryPrice),
      },

      // IMPORTANT:
      // Use this single list in frontend for property cards and holdings.
      properties,
    };
  }

  async getInvestorLeaderboard(currentUserId: string, limit = 5) {
    const shares = await this.prisma.investorShare.findMany({
      include: {
        investor: true,
        property: {
          include: {
            investmentOffer: true,
          },
        },
      },
    });

    const profitRows = await this.prisma.profitDistribution.groupBy({
      by: ['investorId'],
      _sum: {
        amount: true,
      },
    });

    const profitMap = new Map<string, number>(
      profitRows.map((row) => [row.investorId, Number(row._sum.amount ?? 0)]),
    );

    const uniquePropertyIds = [...new Set(shares.map((item) => item.propertyId))];

    const valuationEntries = await Promise.all(
      uniquePropertyIds.map(async (propertyId) => {
        try {
          const result =
            await this.valuation.calculatePropertyValue(propertyId);
          return [propertyId, result] as const;
        } catch {
          return [propertyId, null] as const;
        }
      }),
    );

    const valuationMap = new Map(valuationEntries);

    const investorMap = new Map<
      string,
      {
        investorId: string;
        name: string;
        totalInvested: number;
        totalCurrentValue: number;
        totalProfitEarned: number;
        sharesOwned: number;
      }
    >();

    for (const share of shares) {
      const invested = Number(share.amountPaid ?? 0);
      const sharesOwned = Number(share.sharesOwned ?? 0);
      const valuation = valuationMap.get(share.propertyId);

      const safeCurrentSharePrice = this.getSafeCurrentSharePrice({
        invested,
        sharesOwned,
        valuationCurrentSharePrice: Number(
          valuation?.currentSharePrice ?? 0,
        ),
      });

      const currentValue = sharesOwned * safeCurrentSharePrice;

      const existing = investorMap.get(share.investorId);

      if (!existing) {
        investorMap.set(share.investorId, {
          investorId: share.investorId,
          name: this.maskName(
            currentUserId,
            share.investorId,
            share.investor?.name,
            share.investor?.email,
          ),
          totalInvested: invested,
          totalCurrentValue: currentValue,
          totalProfitEarned: Number(profitMap.get(share.investorId) ?? 0),
          sharesOwned,
        });
      } else {
        existing.totalInvested += invested;
        existing.totalCurrentValue += currentValue;
        existing.sharesOwned += sharesOwned;
      }
    }

    return Array.from(investorMap.values())
      .map((item) => {
        const unrealizedReturn = item.totalCurrentValue - item.totalInvested;
        const totalReturn = unrealizedReturn + item.totalProfitEarned;
        const roi =
          item.totalInvested > 0
            ? (totalReturn / item.totalInvested) * 100
            : 0;

        return {
          rank: 0,
          investorId: item.investorId,
          name: item.name,
          totalInvested: this.round(item.totalInvested),
          totalCurrentValue: this.round(item.totalCurrentValue),
          totalProfitEarned: this.round(item.totalProfitEarned),
          unrealizedReturn: this.round(unrealizedReturn),
          totalReturn: this.round(totalReturn),
          sharesOwned: this.round(item.sharesOwned),
          roi: this.round(roi),
        };
      })
      .sort((a, b) => b.roi - a.roi)
      .slice(0, Math.max(1, limit))
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }
}