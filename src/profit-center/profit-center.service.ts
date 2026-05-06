import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { ValuationService } from '../valuation/valuation.service';
import {
  AccountType,
  LedgerSource,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';

type MonthlyTrendRow = {
  month: string;
  grossProfit: number;
  expenses: number;
  netProfit: number;
};

@Injectable()
export class ProfitCenterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    private readonly valuationService: ValuationService,
  ) {}

  private round(value: number) {
    return Number((value || 0).toFixed(2));
  }

  private getMonthLabel(year: number, monthIndex: number) {
    return new Date(year, monthIndex, 1).toLocaleString(undefined, {
      month: 'short',
    });
  }

  private async getInvestorAccountId(userId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        userId,
        type: AccountType.USER,
      },
      select: {
        id: true,
      },
    });

    return account?.id ?? null;
  }

  private async getInvestorPropertyRows(userId: string) {
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

    const grouped = new Map<
      string,
      {
        propertyId: string;
        title: string;
        location: string | null;
        sharesOwned: number;
        amountPaid: number;
      }
    >();

    for (const share of shares) {
      const existing = grouped.get(share.propertyId);

      if (!existing) {
        grouped.set(share.propertyId, {
          propertyId: share.propertyId,
          title: share.property?.title ?? 'Unknown Property',
          location: share.property?.location ?? null,
          sharesOwned: Number(share.sharesOwned ?? 0),
          amountPaid: Number(share.amountPaid ?? 0),
        });
      } else {
        existing.sharesOwned += Number(share.sharesOwned ?? 0);
        existing.amountPaid += Number(share.amountPaid ?? 0);
      }
    }

    return Array.from(grouped.values());
  }

  private async getAllocatedExpenseForInvestorProperty(
    userId: string,
    propertyId: string,
  ) {
    const accountId = await this.getInvestorAccountId(userId);

    if (!accountId) return 0;

    const expenses = await this.prisma.ledgerEntry.aggregate({
      where: {
        accountId,
        propertyId,
        source: LedgerSource.EXPENSE_PAYMENT,
      },
      _sum: {
        debit: true,
      },
    });

    return this.round(Number(expenses._sum.debit ?? 0));
  }

  private async getProfitDistributionsByProperty(userId: string) {
    const distributions = await this.prisma.profitDistribution.findMany({
      where: { investorId: userId },
      include: {
        property: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const grouped = new Map<
      string,
      {
        propertyId: string;
        propertyTitle: string;
        totalProfitEarned: number;
        latestDistributionAt: Date | null;
      }
    >();

    for (const row of distributions) {
      const existing = grouped.get(row.propertyId);

      if (!existing) {
        grouped.set(row.propertyId, {
          propertyId: row.propertyId,
          propertyTitle: row.property?.title ?? 'Unknown Property',
          totalProfitEarned: Number(row.amount ?? 0),
          latestDistributionAt: row.createdAt,
        });
      } else {
        existing.totalProfitEarned += Number(row.amount ?? 0);

        if (
          !existing.latestDistributionAt ||
          row.createdAt > existing.latestDistributionAt
        ) {
          existing.latestDistributionAt = row.createdAt;
        }
      }
    }

    return {
      grouped,
      raw: distributions,
    };
  }

  private async buildMonthlyTrend(userId: string): Promise<MonthlyTrendRow[]> {
    const now = new Date();
    const investorAccountId = await this.getInvestorAccountId(userId);

    const investorShares = await this.prisma.investorShare.findMany({
      where: { investorId: userId },
      include: {
        property: {
          include: {
            investmentOffer: true,
          },
        },
      },
    });

    const ownedPropertyIds = [
      ...new Set(investorShares.map((s) => s.propertyId)),
    ];

    if (ownedPropertyIds.length === 0) {
      return [];
    }

    const investorShareMap = new Map<
      string,
      { investorOwnedShares: number; totalEconomicUnits: number }
    >();

    for (const share of investorShares) {
      const totalEconomicUnits =
        Number(share.property?.investmentOffer?.totalShares ?? 0) > 0
          ? Number(share.property?.investmentOffer?.totalShares ?? 0)
          : Number(
              (
                await this.prisma.investorShare.aggregate({
                  where: { propertyId: share.propertyId },
                  _sum: { sharesOwned: true },
                })
              )._sum?.sharesOwned ?? 0,
            );

      investorShareMap.set(share.propertyId, {
        investorOwnedShares: Number(share.sharesOwned ?? 0),
        totalEconomicUnits,
      });
    }

    const rows: MonthlyTrendRow[] = [];

    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
      const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      let grossProfit = 0;
      let expenses = 0;

      for (const propertyId of ownedPropertyIds) {
        const shareMeta = investorShareMap.get(propertyId);

        if (
          !shareMeta ||
          shareMeta.investorOwnedShares <= 0 ||
          shareMeta.totalEconomicUnits <= 0
        ) {
          continue;
        }

        const ratio =
          shareMeta.investorOwnedShares / shareMeta.totalEconomicUnits;

        const propertyProfit = await this.prisma.propertyProfit.findFirst({
          where: {
            propertyId,
            periodMonth: d.getMonth() + 1,
            periodYear: d.getFullYear(),
          },
        });

        if (propertyProfit) {
          grossProfit += Number(propertyProfit.totalProfit ?? 0) * ratio;
        } else {
          const fallbackDistributions =
            await this.prisma.profitDistribution.aggregate({
              where: {
                investorId: userId,
                propertyId,
                periodMonth: d.getMonth() + 1,
                periodYear: d.getFullYear(),
              },
              _sum: {
                amount: true,
              },
            });

          grossProfit += Number(fallbackDistributions._sum?.amount ?? 0);
        }

        if (investorAccountId) {
          const ledgerExpenses = await this.prisma.ledgerEntry.aggregate({
            where: {
              accountId: investorAccountId,
              propertyId,
              source: LedgerSource.EXPENSE_PAYMENT,
              createdAt: {
                gte: startDate,
                lt: endDate,
              },
            },
            _sum: {
              debit: true,
            },
          });

          expenses += Number(ledgerExpenses._sum.debit ?? 0);
        }
      }

      rows.push({
        month: this.getMonthLabel(d.getFullYear(), d.getMonth()),
        grossProfit: this.round(grossProfit),
        expenses: this.round(expenses),
        netProfit: this.round(grossProfit - expenses),
      });
    }

    return rows;
  }

  async getInvestorProfitCenter(userId: string) {
    const propertyRows = await this.getInvestorPropertyRows(userId);
    const { grouped: profitMap, raw: distributionHistory } =
      await this.getProfitDistributionsByProperty(userId);
    const monthlyTrend = await this.buildMonthlyTrend(userId);

    const propertyPerformance = await Promise.all(
      propertyRows.map(async (row) => {
        const valuation =
          await this.valuationService.calculatePropertyValue(row.propertyId);

        const finance = await this.financeService.profitAndLoss(row.propertyId);

        const allocatedExpense =
          await this.getAllocatedExpenseForInvestorProperty(
            userId,
            row.propertyId,
          );

        const totalProfitEarned = Number(
          profitMap.get(row.propertyId)?.totalProfitEarned ?? 0,
        );

        const currentValue =
          Number(row.sharesOwned ?? 0) *
          Number(valuation.currentSharePrice ?? 0);

        const unrealizedReturn = currentValue - row.amountPaid;
        const grossReturn = unrealizedReturn + totalProfitEarned;
        const netReturn = grossReturn - allocatedExpense;

        const roi =
          row.amountPaid > 0 ? (netReturn / row.amountPaid) * 100 : 0;

        const yieldPercent =
          row.amountPaid > 0 ? (totalProfitEarned / row.amountPaid) * 100 : 0;

        const expenseImpactPercent =
          row.amountPaid > 0 ? (allocatedExpense / row.amountPaid) * 100 : 0;

        return {
          propertyId: row.propertyId,
          title: row.title,
          location: row.location,
          sharesOwned: this.round(row.sharesOwned),
          investedCapital: this.round(row.amountPaid),
          totalProfitEarned: this.round(totalProfitEarned),
          allocatedExpenses: this.round(allocatedExpense),
          grossReturn: this.round(grossReturn),
          netReturn: this.round(netReturn),
          unrealizedReturn: this.round(unrealizedReturn),
          currentValue: this.round(currentValue),
          roi: this.round(roi),
          yieldPercent: this.round(yieldPercent),
          expenseImpactPercent: this.round(expenseImpactPercent),
          occupancyRate: this.round(Number(valuation.occupancyRate ?? 0)),
          currentSharePrice: this.round(
            Number(valuation.currentSharePrice ?? 0),
          ),
          entrySharePrice: this.round(Number(valuation.entrySharePrice ?? 0)),
          priceMovementPercent: this.round(
            Number(valuation.priceMovementPercent ?? 0),
          ),
          capRate: this.round(Number(valuation.capRate ?? 0)),
          propertyIncome: this.round(Number(finance.income ?? 0)),
          propertyExpenses: this.round(Number(finance.expenses ?? 0)),
          propertyNetProfit: this.round(Number(finance.netProfit ?? 0)),
        };
      }),
    );

    const totalInvested = propertyPerformance.reduce(
      (sum, item) => sum + item.investedCapital,
      0,
    );

    const totalProfitEarned = propertyPerformance.reduce(
      (sum, item) => sum + item.totalProfitEarned,
      0,
    );

    const totalAllocatedExpenses = propertyPerformance.reduce(
      (sum, item) => sum + item.allocatedExpenses,
      0,
    );

    const totalUnrealizedReturn = propertyPerformance.reduce(
      (sum, item) => sum + item.unrealizedReturn,
      0,
    );

    const grossReturn = totalUnrealizedReturn + totalProfitEarned;
    const netReturn = grossReturn - totalAllocatedExpenses;

    const totalCurrentValue = propertyPerformance.reduce(
      (sum, item) => sum + item.currentValue,
      0,
    );

    const roi = totalInvested > 0 ? (netReturn / totalInvested) * 100 : 0;
    const yieldPercent =
      totalInvested > 0 ? (totalProfitEarned / totalInvested) * 100 : 0;

    const bestProperty =
      propertyPerformance.length > 0
        ? [...propertyPerformance].sort((a, b) => b.roi - a.roi)[0]
        : null;

    const weakestProperty =
      propertyPerformance.length > 0
        ? [...propertyPerformance].sort((a, b) => a.roi - b.roi)[0]
        : null;

    const latestMonth = monthlyTrend[monthlyTrend.length - 1];
    const previousMonth =
      monthlyTrend.length > 1 ? monthlyTrend[monthlyTrend.length - 2] : null;

    const profitThisMonth = Number(latestMonth?.netProfit ?? 0);
    const lastMonthProfit = Number(previousMonth?.netProfit ?? 0);

    const monthlyGrowth =
      lastMonthProfit > 0
        ? ((profitThisMonth - lastMonthProfit) / lastMonthProfit) * 100
        : 0;

    const pendingProfitRequest = await this.prisma.profitRequest.findFirst({
      where: {
        status: 'PENDING',
        property: {
          shares: {
            some: {
              investorId: userId,
            },
          },
        },
      },
      include: {
        property: true,
        votes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const completedWithdrawals = await this.prisma.walletTransaction.aggregate({
      where: {
        wallet: {
          userId,
        },
        type: WalletTransactionType.WITHDRAWAL,
        status: WalletTransactionStatus.COMPLETED,
      },
      _sum: {
        amount: true,
      },
    });

    const totalWithdrawn = Number(completedWithdrawals._sum.amount ?? 0);
    const withdrawableEstimate = Math.max(0, totalProfitEarned - totalWithdrawn);

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    const recentDistributions = distributionHistory.slice(0, 6).map((row) => ({
      id: row.id,
      propertyId: row.propertyId,
      propertyTitle: row.property?.title ?? 'Unknown Property',
      amount: this.round(Number(row.amount ?? 0)),
      periodMonth: row.periodMonth,
      periodYear: row.periodYear,
      createdAt: row.createdAt,
    }));

    const chartExpenseBreakdown = propertyPerformance.map((item) => ({
      name: item.title,
      profit: item.totalProfitEarned,
      expenses: item.allocatedExpenses,
      net: item.netReturn,
    }));

    return {
      hero: {
        totalProfitEarned: this.round(totalProfitEarned),
        netReturn: this.round(netReturn),
        totalCurrentValue: this.round(totalCurrentValue),
        roi: this.round(roi),
        yieldPercent: this.round(yieldPercent),
        profitThisMonth: this.round(profitThisMonth),
        monthlyGrowth: this.round(monthlyGrowth),
        withdrawableEstimate: this.round(withdrawableEstimate),
        walletBalance: this.round(Number(wallet?.balance ?? 0)),
        totalWithdrawn: this.round(totalWithdrawn),
      },

      intelligence: {
        bestProperty: bestProperty
          ? {
              title: bestProperty.title,
              roi: bestProperty.roi,
              netReturn: bestProperty.netReturn,
            }
          : null,
        weakestProperty: weakestProperty
          ? {
              title: weakestProperty.title,
              roi: weakestProperty.roi,
              netReturn: weakestProperty.netReturn,
            }
          : null,
        totalAllocatedExpenses: this.round(totalAllocatedExpenses),
        totalUnrealizedReturn: this.round(totalUnrealizedReturn),
        grossReturn: this.round(grossReturn),
        netReturn: this.round(netReturn),
      },

      charts: {
        monthlyTrend,
        expenseBreakdown: chartExpenseBreakdown,
      },

      propertyPerformance,

      recentDistributions,

      pendingRequest: pendingProfitRequest
        ? {
            id: pendingProfitRequest.id,
            propertyTitle:
              pendingProfitRequest.property?.title ?? 'Unknown Property',
            amount: this.round(Number(pendingProfitRequest.amount ?? 0)),
            createdAt: pendingProfitRequest.createdAt,
            expiresAt: pendingProfitRequest.expiresAt,
            votesCount: pendingProfitRequest.votes.length,
            status: pendingProfitRequest.status,
          }
        : null,
    };
  }
}