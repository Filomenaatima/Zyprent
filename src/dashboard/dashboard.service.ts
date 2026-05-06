import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AccountType,
  DispatchStatus,
  InvoiceKind,
  InvoiceStatus,
  LedgerSource,
  MaintenanceStatus,
  PayoutStatus,
  Role,
  WalletTransactionType,
} from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private round(value: number) {
    return Number((value || 0).toFixed(2));
  }

  private async getInvestorAccountId(userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { userId, type: AccountType.USER },
      select: { id: true },
    });

    return account?.id ?? null;
  }

  private async getInvestorAllocatedExpenses(userId: string) {
    const accountId = await this.getInvestorAccountId(userId);

    if (!accountId) {
      return {
        totalAllocatedExpenses: 0,
        byProperty: new Map<string, number>(),
      };
    }

    const entries = await this.prisma.ledgerEntry.findMany({
      where: {
        accountId,
        source: LedgerSource.EXPENSE_PAYMENT,
      },
      select: {
        propertyId: true,
        debit: true,
      },
    });

    const byProperty = new Map<string, number>();
    let totalAllocatedExpenses = 0;

    for (const entry of entries) {
      const amount = Number(entry.debit ?? 0);
      totalAllocatedExpenses += amount;

      if (entry.propertyId) {
        byProperty.set(
          entry.propertyId,
          Number(byProperty.get(entry.propertyId) ?? 0) + amount,
        );
      }
    }

    return {
      totalAllocatedExpenses: this.round(totalAllocatedExpenses),
      byProperty,
    };
  }

  async adminDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const [
      properties,
      investors,
      residents,
      managers,
      providers,
      pendingApprovals,
      activeMaintenance,
      pendingInvoices,
      totalRevenue,
      unreadNotifications,
    ] = await Promise.all([
      this.prisma.property.count(),
      this.prisma.user.count({ where: { role: Role.INVESTOR } }),
      this.prisma.user.count({ where: { role: Role.RESIDENT } }),
      this.prisma.user.count({ where: { role: Role.MANAGER } }),
      this.prisma.user.count({ where: { role: Role.SERVICE_PROVIDER } }),
      this.prisma.serviceProvider.count({
        where: { verificationStatus: 'PENDING' },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          status: {
            in: [
              MaintenanceStatus.PENDING,
              MaintenanceStatus.ASSIGNED,
              MaintenanceStatus.INSPECTION_REQUIRED,
              MaintenanceStatus.QUOTED,
              MaintenanceStatus.APPROVED,
              MaintenanceStatus.IN_PROGRESS,
            ],
          },
        },
      }),
      this.prisma.rentInvoice.count({
        where: {
          status: {
            in: [
              InvoiceStatus.ISSUED,
              InvoiceStatus.PARTIALLY_PAID,
              InvoiceStatus.OVERDUE,
            ],
          },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.notification.count({
        where: { isRead: false },
      }),
    ]);

    return {
      message: 'Admin dashboard',
      stats: {
        properties,
        investors,
        residents,
        managers,
        providers,
      },
      system: {
        pendingApprovals,
        activeMaintenance,
        pendingInvoices,
        unreadNotifications,
      },
      finance: {
        totalRevenue: Number(totalRevenue._sum?.amount ?? 0),
      },
    };
  }

  async investorDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user || user.role !== Role.INVESTOR) {
      throw new ForbiddenException('Access denied');
    }

    const [
      wallet,
      shares,
      activeListings,
      pendingWithdrawals,
      notifications,
      allProfitRows,
      recentProfitRows,
      shareTransactions,
      walletTransactions,
      allocatedExpenseData,
    ] = await Promise.all([
      this.prisma.wallet.findUnique({
        where: { userId },
      }),

      this.prisma.investorShare.findMany({
        where: { investorId: userId },
        include: {
          property: {
            include: {
              units: true,
              maintenanceRequests: {
                where: {
                  status: {
                    in: [
                      MaintenanceStatus.PENDING,
                      MaintenanceStatus.ASSIGNED,
                      MaintenanceStatus.INSPECTION_REQUIRED,
                      MaintenanceStatus.QUOTED,
                      MaintenanceStatus.APPROVED,
                      MaintenanceStatus.IN_PROGRESS,
                    ],
                  },
                },
              },
            },
          },
        },
      }),

      this.prisma.shareListing.count({
        where: {
          investorId: userId,
          isActive: true,
        },
      }),

      this.prisma.withdrawalRequest.count({
        where: {
          investorId: userId,
          status: {
            in: ['PENDING', 'APPROVED', 'PROCESSING'],
          },
        },
      }),

      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      this.prisma.profitDistribution.findMany({
        where: { investorId: userId },
        include: { property: true },
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.profitDistribution.findMany({
        where: { investorId: userId },
        include: { property: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      this.prisma.shareTransaction.findMany({
        where: { investorId: userId },
        include: { property: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      this.prisma.walletTransaction.findMany({
        where: {
          wallet: { userId },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      this.getInvestorAllocatedExpenses(userId),
    ]);

    const totalInvested = shares.reduce(
      (sum, share) => sum + Number(share.amountPaid ?? 0),
      0,
    );

    const totalProfitEarned = allProfitRows.reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0,
    );

    const totalAllocatedExpenses = Number(
      allocatedExpenseData.totalAllocatedExpenses ?? 0,
    );

    const netProfit = this.round(totalProfitEarned - totalAllocatedExpenses);

    const profitByProperty = new Map<string, number>();

    for (const row of allProfitRows) {
      profitByProperty.set(
        row.propertyId,
        Number(profitByProperty.get(row.propertyId) ?? 0) +
          Number(row.amount ?? 0),
      );
    }

    const propertySnapshots = shares.map((share) => {
      const units = share.property.units.length;
      const occupiedUnits = share.property.units.filter(
        (unit) => unit.status === 'OCCUPIED',
      ).length;

      const occupancyRate =
        units > 0 ? Math.round((occupiedUnits / units) * 100) : 0;

      const amountPaid = Number(share.amountPaid ?? 0);
      const sharesOwned = Number(share.sharesOwned ?? 0);
      const allocatedExpenses = this.round(
        Number(allocatedExpenseData.byProperty.get(share.propertyId) ?? 0),
      );
      const profitEarned = this.round(
        Number(profitByProperty.get(share.propertyId) ?? 0),
      );
      const netPropertyProfit = this.round(profitEarned - allocatedExpenses);

      return {
        propertyId: share.propertyId,
        title: share.property.title,
        location: share.property.location,
        sharesOwned,
        amountPaid,
        totalInvested: amountPaid,
        profitEarned,
        allocatedExpenses,
        netProfit: netPropertyProfit,
        roi:
          amountPaid > 0
            ? this.round((netPropertyProfit / amountPaid) * 100)
            : 0,
        pricePerShare:
          sharesOwned > 0 ? this.round(amountPaid / sharesOwned) : 0,
        activeMaintenanceCount: share.property.maintenanceRequests.length,
        units,
        occupiedUnits,
        occupancyRate,
      };
    });

    const totalShares = propertySnapshots.reduce(
      (sum, item) => sum + Number(item.sharesOwned ?? 0),
      0,
    );

    const avgOccupancy =
      propertySnapshots.length > 0
        ? this.round(
            propertySnapshots.reduce(
              (sum, item) => sum + Number(item.occupancyRate ?? 0),
              0,
            ) / propertySnapshots.length,
          )
        : 0;

    const activeMaintenance = propertySnapshots.reduce(
      (sum, item) => sum + Number(item.activeMaintenanceCount ?? 0),
      0,
    );

    const roi =
      totalInvested > 0 ? this.round((netProfit / totalInvested) * 100) : 0;

    const recentActivity = [
      ...recentProfitRows.map((item) => ({
        id: `profit-${item.id}`,
        type: 'PROFIT_DISTRIBUTION',
        direction: 'IN',
        title: 'Profit Distribution',
        subtitle: item.property.title,
        amount: Number(item.amount ?? 0),
        reference: null,
        createdAt: item.createdAt.toISOString(),
      })),

      ...shareTransactions.map((item) => ({
        id: `share-${item.id}`,
        type: item.type,
        direction: item.type === 'SELL' ? 'IN' : 'OUT',
        title:
          item.type === 'BUY'
            ? 'Share Purchase'
            : item.type === 'SELL'
              ? 'Share Sale'
              : 'Share Transfer',
        subtitle: item.property.title,
        amount: Number(item.amount ?? 0),
        reference: null,
        createdAt: item.createdAt.toISOString(),
      })),

      ...walletTransactions
        .filter(
          (item) =>
            item.type === WalletTransactionType.DEPOSIT ||
            item.type === WalletTransactionType.WITHDRAWAL ||
            item.type === WalletTransactionType.PROFIT,
        )
        .map((item) => ({
          id: `wallet-${item.id}`,
          type: item.type,
          direction:
            item.type === WalletTransactionType.WITHDRAWAL ? 'OUT' : 'IN',
          title:
            item.type === WalletTransactionType.DEPOSIT
              ? 'Wallet Deposit'
              : item.type === WalletTransactionType.WITHDRAWAL
                ? 'Wallet Withdrawal'
                : 'Wallet Profit Credit',
          subtitle: item.reference || 'Wallet activity',
          amount: Number(item.amount ?? 0),
          reference: item.reference,
          createdAt: item.createdAt.toISOString(),
        })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 6);

    return {
      message: 'Investor dashboard',
      investor: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      summary: {
        walletBalance: this.round(Number(wallet?.balance ?? 0)),
        totalInvested: this.round(totalInvested),
        totalProfit: netProfit,
        totalProfitEarned: this.round(totalProfitEarned),
        totalAllocatedExpenses: this.round(totalAllocatedExpenses),
        netProfit,
        roi,
        propertyCount: propertySnapshots.length,
        activeListings,
        pendingWithdrawals,
        totalShares: this.round(totalShares),
        avgOccupancy,
        activeMaintenance,
      },
      propertySnapshots,
      recentActivity,
      notifications: notifications.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        isRead: item.isRead,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  async residentDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user || user.role !== Role.RESIDENT) {
      throw new ForbiddenException('Access denied');
    }

    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
      },
    });

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!resident) {
      return {
        message: 'Resident dashboard',
        resident: null,
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        summary: {
          walletBalance: Number(wallet?.balance ?? 0),
          currentDue: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          openMaintenanceCount: 0,
          unreadNotifications: 0,
          openInvoiceCount: 0,
        },
        unitSnapshot: {
          propertyId: null,
          propertyTitle: null,
          propertyLocation: null,
          unitId: null,
          unitNumber: null,
          residentStatus: null,
        },
        currentInvoices: [],
        recentTransactions: [],
        maintenanceRequests: [],
        notifications: [],
      };
    }

    const [
      currentInvoices,
      recentPayments,
      maintenanceRequests,
      notifications,
      openMaintenanceCount,
      unreadNotifications,
    ] = await Promise.all([
      this.prisma.rentInvoice.findMany({
        where: {
          residentId: resident.id,
          status: {
            in: [
              InvoiceStatus.ISSUED,
              InvoiceStatus.PARTIALLY_PAID,
              InvoiceStatus.OVERDUE,
            ],
          },
        },
        include: {
          unit: {
            include: {
              property: true,
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          rentContract: {
            select: {
              id: true,
              startDate: true,
              nextBillingDate: true,
              billingAnchorDay: true,
              initialTermMonths: true,
              isActive: true,
              rentAmount: true,
              depositAmount: true,
              serviceCharge: true,
              garbageFee: true,
            },
          },
        },
        orderBy: [
          { dueDate: 'asc' },
          { kind: 'asc' },
          { createdAt: 'desc' },
        ],
      }),

      this.prisma.payment.findMany({
        where: {
          invoice: {
            residentId: resident.id,
          },
        },
        include: {
          invoice: {
            include: {
              unit: {
                include: {
                  property: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      this.prisma.maintenanceRequest.findMany({
        where: {
          residentId: resident.id,
        },
        include: {
          property: true,
          unit: true,
          assignedProvider: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      this.prisma.maintenanceRequest.count({
        where: {
          residentId: resident.id,
          status: {
            in: [
              MaintenanceStatus.PENDING,
              MaintenanceStatus.ASSIGNED,
              MaintenanceStatus.INSPECTION_REQUIRED,
              MaintenanceStatus.QUOTED,
              MaintenanceStatus.APPROVED,
              MaintenanceStatus.IN_PROGRESS,
            ],
          },
        },
      }),

      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    const currentInvoicesMapped = currentInvoices.map((invoice) => {
      const totalAmount = Number(invoice.totalAmount ?? 0);
      const paidAmount = Number(invoice.paidAmount ?? 0);
      const outstandingAmount = Math.max(0, totalAmount - paidAmount);

      return {
        id: invoice.id,
        kind: invoice.kind,
        kindLabel: this.getInvoiceKindLabel(invoice.kind),
        period: invoice.period,
        dueDate: invoice.dueDate,
        status: invoice.status,
        totalAmount,
        paidAmount,
        outstandingAmount,
        propertyTitle: invoice.unit?.property?.title ?? null,
        propertyLocation: invoice.unit?.property?.location ?? null,
        unitNumber: invoice.unit?.number ?? null,
        rentContract: invoice.rentContract,
        payments: invoice.payments.map((payment) => ({
          id: payment.id,
          amount: Number(payment.amount ?? 0),
          channel: payment.providerRef?.startsWith('WALLET-')
            ? 'WALLET'
            : payment.channel,
          provider: payment.providerRef?.startsWith('WALLET-')
            ? 'INTERNAL_WALLET'
            : payment.provider,
          providerRef: payment.providerRef,
          status: payment.status,
          createdAt: payment.createdAt.toISOString(),
        })),
      };
    });

    const totalCurrentDue = currentInvoicesMapped.reduce(
      (sum, invoice) => sum + invoice.totalAmount,
      0,
    );

    const totalPaidAcrossOpen = currentInvoicesMapped.reduce(
      (sum, invoice) => sum + invoice.paidAmount,
      0,
    );

    const totalOutstandingAcrossOpen = currentInvoicesMapped.reduce(
      (sum, invoice) => sum + invoice.outstandingAmount,
      0,
    );

    return {
      message: 'Resident dashboard',
      resident,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      summary: {
        walletBalance: Number(wallet?.balance ?? 0),
        currentDue: totalCurrentDue,
        paidAmount: totalPaidAcrossOpen,
        outstandingAmount: totalOutstandingAcrossOpen,
        openMaintenanceCount,
        unreadNotifications,
        openInvoiceCount: currentInvoicesMapped.length,
      },
      unitSnapshot: {
        propertyId: resident.unit?.property?.id ?? null,
        propertyTitle: resident.unit?.property?.title ?? null,
        propertyLocation: resident.unit?.property?.location ?? null,
        unitId: resident.unit?.id ?? null,
        unitNumber: resident.unit?.number ?? null,
        residentStatus: resident.status ?? null,
      },
      currentInvoices: currentInvoicesMapped,
      recentTransactions: recentPayments.map((payment) => ({
        id: payment.id,
        type: 'PAYMENT',
        kind: payment.invoice?.kind ?? null,
        kindLabel: payment.invoice
          ? this.getInvoiceKindLabel(payment.invoice.kind)
          : 'Payment',
        title: payment.invoice
          ? `${this.getInvoiceKindLabel(payment.invoice.kind)} Payment`
          : 'Payment',
        subtitle:
          payment.invoice?.unit?.property?.title || 'Property payment',
        amount: Number(payment.amount ?? 0),
        status: payment.status,
        createdAt: payment.createdAt.toISOString(),
        provider: payment.providerRef?.startsWith('WALLET-')
          ? 'INTERNAL_WALLET'
          : payment.provider,
        providerRef: payment.providerRef,
      })),
      maintenanceRequests: maintenanceRequests.map((request) => ({
        id: request.id,
        title: request.title,
        description: request.description,
        category: request.category,
        status: request.status,
        priority: request.priority,
        estimatedCost: Number(request.estimatedCost ?? 0),
        createdAt: request.createdAt.toISOString(),
        propertyTitle: request.property?.title ?? null,
        unitNumber: request.unit?.number ?? null,
        assignedProvider:
          request.assignedProvider?.companyName ||
          request.assignedProvider?.user?.name ||
          null,
      })),
      notifications: notifications.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        isRead: item.isRead,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  async managerDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.MANAGER) {
      throw new ForbiddenException('Access denied');
    }

    const properties = await this.prisma.property.findMany({
      where: { managerId: userId },
      include: {
        units: true,
      },
    });

    const propertyIds = properties.map((property) => property.id);

    const [
      units,
      revenue,
      residents,
      providers,
      overdueInvoices,
      openMaintenance,
    ] = await Promise.all([
      this.prisma.unit.count({
        where: {
          propertyId: { in: propertyIds },
        },
      }),

      this.prisma.payment.aggregate({
        where: {
          invoice: {
            unit: {
              propertyId: { in: propertyIds },
            },
          },
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.resident.count({
        where: {
          unit: {
            propertyId: { in: propertyIds },
          },
        },
      }),

      this.prisma.serviceProvider.count({
        where: {
          managerId: userId,
        },
      }),

      this.prisma.rentInvoice.count({
        where: {
          unit: {
            propertyId: { in: propertyIds },
          },
          status: InvoiceStatus.OVERDUE,
        },
      }),

      this.prisma.maintenanceRequest.count({
        where: {
          propertyId: { in: propertyIds },
          status: {
            in: [
              MaintenanceStatus.PENDING,
              MaintenanceStatus.ASSIGNED,
              MaintenanceStatus.INSPECTION_REQUIRED,
              MaintenanceStatus.QUOTED,
              MaintenanceStatus.APPROVED,
              MaintenanceStatus.IN_PROGRESS,
            ],
          },
        },
      }),
    ]);

    return {
      message: 'Manager dashboard',
      properties,
      totalUnits: units,
      totalResidents: residents,
      totalProviders: providers,
      revenue: Number(revenue._sum?.amount ?? 0),
      alerts: {
        overdueInvoices,
        openMaintenance,
      },
    };
  }

  async providerDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user || user.role !== Role.SERVICE_PROVIDER) {
      throw new ForbiddenException('Access denied');
    }

    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!provider) {
      return {
        message: 'Provider dashboard',
        provider: null,
        summary: {
          pendingDispatches: 0,
          activeJobs: 0,
          completedJobs: 0,
          totalPayouts: 0,
          pendingPayouts: 0,
          averageRating: 0,
          responseRate: 0,
          completionRate: 0,
        },
        dispatches: [],
        activeAssignments: [],
        recentPayouts: [],
        recentReviews: [],
      };
    }

    const [
      allDispatches,
      pendingDispatches,
      activeAssignments,
      completedJobs,
      allAssignedJobs,
      payouts,
      pendingPayoutAggregate,
      reviews,
    ] = await Promise.all([
      this.prisma.maintenanceDispatch.findMany({
        where: {
          providerId: provider.id,
        },
        include: {
          request: {
            include: {
              property: true,
              unit: true,
            },
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
        take: 10,
      }),

      this.prisma.maintenanceDispatch.findMany({
        where: {
          providerId: provider.id,
          status: {
            in: [DispatchStatus.SENT, DispatchStatus.VIEWED],
          },
        },
        include: {
          request: {
            include: {
              property: true,
              unit: true,
            },
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
        take: 10,
      }),

      this.prisma.maintenanceRequest.findMany({
        where: {
          assignedProviderId: provider.id,
          status: {
            in: [
              MaintenanceStatus.ASSIGNED,
              MaintenanceStatus.INSPECTION_REQUIRED,
              MaintenanceStatus.QUOTED,
              MaintenanceStatus.APPROVED,
              MaintenanceStatus.IN_PROGRESS,
            ],
          },
        },
        include: {
          property: true,
          unit: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 10,
      }),

      this.prisma.maintenanceRequest.count({
        where: {
          assignedProviderId: provider.id,
          status: MaintenanceStatus.COMPLETED,
        },
      }),

      this.prisma.maintenanceRequest.count({
        where: {
          assignedProviderId: provider.id,
        },
      }),

      this.prisma.providerPayout.findMany({
        where: {
          providerId: provider.id,
        },
        include: {
          request: {
            include: {
              property: true,
              unit: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),

      this.prisma.providerPayout.aggregate({
        where: {
          providerId: provider.id,
          status: {
            not: PayoutStatus.COMPLETED,
          },
        },
        _sum: {
          providerEarning: true,
        },
      }),

      this.prisma.serviceProviderReview.findMany({
        where: {
          providerId: provider.id,
        },
        include: {
          request: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ]);

    const totalPayouts = payouts.reduce(
      (sum, item) => sum + Number(item.providerEarning ?? 0),
      0,
    );

    const pendingDispatchCount = pendingDispatches.length;
    const activeJobsCount = activeAssignments.length;
    const completedJobsCount = completedJobs;

    const totalDispatchCount = allDispatches.length;
    const respondedDispatchCount = allDispatches.filter(
      (item) => item.status !== DispatchStatus.SENT,
    ).length;

    const responseRate =
      totalDispatchCount > 0
        ? (respondedDispatchCount / totalDispatchCount) * 100
        : 0;

    const completionRate =
      allAssignedJobs > 0 ? (completedJobsCount / allAssignedJobs) * 100 : 0;

    return {
      message: 'Provider dashboard',
      provider: {
        id: provider.id,
        name: provider.user?.name ?? null,
        companyName: provider.companyName,
        type: provider.type,
        rating: Number(provider.rating ?? 0),
        reviewCount: provider.reviewCount ?? reviews.length,
        verificationStatus: provider.verificationStatus,
        city: provider.city,
        serviceRadiusKm: provider.serviceRadiusKm,
      },
      summary: {
        pendingDispatches: pendingDispatchCount,
        activeJobs: activeJobsCount,
        completedJobs: completedJobsCount,
        totalPayouts,
        pendingPayouts: Number(
          pendingPayoutAggregate._sum.providerEarning ?? 0,
        ),
        averageRating: Number(provider.rating ?? 0),
        responseRate,
        completionRate,
      },
      dispatches: pendingDispatches.map((item) => ({
        id: item.id,
        requestId: item.requestId,
        title: item.request.title,
        category: item.request.category,
        priority: item.request.priority,
        propertyTitle: item.request.property?.title ?? null,
        unitNumber: item.request.unit?.number ?? null,
        location: item.request.property?.location ?? null,
        status: item.status,
        sentAt: item.sentAt?.toISOString?.() ?? item.sentAt,
      })),
      activeAssignments: activeAssignments.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        priority: item.priority,
        status: item.status,
        propertyTitle: item.property?.title ?? null,
        unitNumber: item.unit?.number ?? null,
        workScheduledAt: item.workScheduledAt?.toISOString?.() ?? null,
        updatedAt: item.updatedAt?.toISOString?.() ?? item.updatedAt,
      })),
      recentPayouts: payouts.map((item) => ({
        id: item.id,
        totalAmount: Number(item.totalAmount ?? 0),
        providerEarning: Number(item.providerEarning ?? 0),
        platformFee: Number(item.platformFee ?? 0),
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        requestTitle: item.request?.title ?? null,
      })),
      recentReviews: reviews.map((item) => ({
        id: item.id,
        rating: item.rating,
        comment: item.comment,
        requestTitle: item.request?.title ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  private getInvoiceKindLabel(kind: InvoiceKind) {
    switch (kind) {
      case InvoiceKind.RENT:
        return 'Rent';
      case InvoiceKind.GARBAGE:
        return 'Garbage';
      case InvoiceKind.SERVICE_CHARGE:
        return 'Service Charge';
      default:
        return 'Invoice';
    }
  }
}