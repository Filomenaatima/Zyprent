import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BillingInterval, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CreateSubscriptionParams = {
  investorId: string;
  planId: string;
  status?: SubscriptionStatus;
  startedAt?: Date;
  trialEndsAt?: Date | null;
  currentPeriodEnd: Date;
};

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubscription(params: CreateSubscriptionParams) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: params.planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const investor = await this.prisma.user.findUnique({
      where: { id: params.investorId },
      select: { id: true, role: true, name: true, email: true },
    });

    if (!investor) {
      throw new NotFoundException('Investor not found');
    }

    if (investor.role !== 'INVESTOR') {
      throw new BadRequestException(
        'Subscription can only be attached to an investor',
      );
    }

    return this.prisma.subscription.create({
      data: {
        investorId: params.investorId,
        planId: params.planId,
        status: params.status ?? SubscriptionStatus.TRIAL,
        startedAt: params.startedAt ?? new Date(),
        trialEndsAt: params.trialEndsAt ?? null,
        currentPeriodEnd: params.currentPeriodEnd,
      },
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        plan: true,
        usageSnapshots: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
        platformInvoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async getAdminOverview() {
    const [
      totalSubscriptions,
      trialCount,
      activeCount,
      pastDueCount,
      suspendedCount,
      canceledCount,
      totalPlans,
      activePlans,
      subscriptions,
      invoices,
    ] = await Promise.all([
      this.prisma.subscription.count(),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.TRIAL },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.PAST_DUE },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.SUSPENDED },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.CANCELED },
      }),
      this.prisma.subscriptionPlan.count(),
      this.prisma.subscriptionPlan.count({
        where: { isActive: true },
      }),
      this.prisma.subscription.findMany({
        include: {
          plan: true,
          investor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.platformInvoice.findMany(),
    ]);

    const monthlyPlans = subscriptions.filter(
      (item) => item.plan.billingInterval === 'MONTHLY',
    ).length;

    const yearlyPlans = subscriptions.filter(
      (item) => item.plan.billingInterval === 'YEARLY',
    ).length;

    const totalRevenueBilled = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.amountDue || 0),
      0,
    );

    const paidRevenue = invoices
      .filter((invoice) => invoice.status === 'PAID')
      .reduce((sum, invoice) => sum + Number(invoice.amountDue || 0), 0);

    return {
      summary: {
        totalSubscriptions,
        trialCount,
        activeCount,
        pastDueCount,
        suspendedCount,
        canceledCount,
        totalPlans,
        activePlans,
        monthlyPlans,
        yearlyPlans,
        totalRevenueBilled,
        paidRevenue,
      },
      subscriptions,
    };
  }

  async getAllSubscriptions(filters?: {
    status?: SubscriptionStatus;
    search?: string;
  }) {
    const rows = await this.prisma.subscription.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
      },
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        plan: true,
        usageSnapshots: {
          orderBy: { recordedAt: 'desc' },
          take: 8,
        },
        platformInvoices: {
          orderBy: { createdAt: 'desc' },
          take: 8,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const term = (filters?.search || '').trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((item) =>
      [
        item.investor?.name,
        item.investor?.email,
        item.plan?.name,
        item.status,
        item.plan?.billingInterval,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }

  async getSubscriptionById(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        plan: true,
        usageSnapshots: {
          orderBy: { recordedAt: 'desc' },
        },
        platformInvoices: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async getActiveSubscriptionForInvestor(investorId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        investorId,
        status: {
          in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE],
        },
      },
      include: {
        plan: true,
        usageSnapshots: {
          orderBy: { recordedAt: 'desc' },
        },
        platformInvoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSubscriptionsForInvestor(investorId: string) {
    return this.prisma.subscription.findMany({
      where: { investorId },
      include: {
        plan: true,
        usageSnapshots: {
          orderBy: { recordedAt: 'desc' },
        },
        platformInvoices: {
          orderBy: { createdAt: 'desc' },
        },
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async cancelSubscription(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
      },
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        plan: true,
        usageSnapshots: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
        platformInvoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async recordUsageSnapshot(params: {
    subscriptionId: string;
    metric: Prisma.UsageSnapshotUncheckedCreateInput['metric'];
    value: number;
  }) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: params.subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.usageSnapshot.create({
      data: {
        subscriptionId: params.subscriptionId,
        metric: params.metric,
        value: params.value,
      },
    });
  }

  async createPlan(params: {
    name: string;
    billingInterval: BillingInterval;
    price: number;
    trialDays?: number;
    isActive?: boolean;
  }) {
    return this.prisma.subscriptionPlan.create({
      data: {
        name: params.name,
        billingInterval: params.billingInterval,
        price: params.price,
        trialDays: params.trialDays ?? 0,
        isActive: params.isActive ?? true,
      },
    });
  }

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: [{ isActive: 'desc' }, { price: 'asc' }, { createdAt: 'asc' }],
    });
  }
}