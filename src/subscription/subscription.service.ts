import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingInterval,
  Prisma,
  Role,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CreateSubscriptionParams = {
  investorId: string;
  planId: string;
  status?: SubscriptionStatus;
  startedAt?: Date;
  trialEndsAt?: Date | null;
  currentPeriodEnd: Date;
};

type ActivateTestSubscriptionParams = {
  userId: string;
  planName: string;
  amount: number;
  paymentRef?: string;
};

const SUBSCRIPTION_REQUIRED_ROLES: Role[] = [
  Role.MANAGER,
  Role.INVESTOR,
  Role.RESIDENT,
];

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  private requiresSubscription(role?: Role | string | null) {
    return SUBSCRIPTION_REQUIRED_ROLES.includes(role as Role);
  }

  private getPeriodEndFromNow() {
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    return currentPeriodEnd;
  }

  async getMySubscriptionStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const requiresSubscription = this.requiresSubscription(user.role);

    if (!requiresSubscription) {
      return {
        requiresSubscription: false,
        hasActiveSubscription: true,
        user,
        subscription: null,
      };
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        investorId: userId,
        status: {
          in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE],
        },
        currentPeriodEnd: {
          gte: new Date(),
        },
      },
      include: {
        plan: true,
        usageSnapshots: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
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
      orderBy: { createdAt: 'desc' },
    });

    return {
      requiresSubscription: true,
      hasActiveSubscription: Boolean(subscription),
      user,
      subscription,
    };
  }

  async activateTestSubscription(params: ActivateTestSubscriptionParams) {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, role: true, name: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.requiresSubscription(user.role)) {
      throw new BadRequestException(
        'This user role does not require a platform subscription',
      );
    }

    if (!params.planName?.trim()) {
      throw new BadRequestException('Plan name is required');
    }

    if (!params.amount || Number(params.amount) <= 0) {
      throw new BadRequestException(
        'Subscription amount must be greater than zero',
      );
    }

    const normalizedPlanName = params.planName.trim();
    const normalizedAmount = Math.round(Number(params.amount));

    let plan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        name: normalizedPlanName,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!plan) {
      plan = await this.prisma.subscriptionPlan.create({
        data: {
          name: normalizedPlanName,
          price: normalizedAmount,
          billingInterval: BillingInterval.MONTHLY,
          trialDays: 0,
          isActive: true,
        },
      });
    } else {
      plan = await this.prisma.subscriptionPlan.update({
        where: {
          id: plan.id,
        },
        data: {
          price: normalizedAmount,
          billingInterval: BillingInterval.MONTHLY,
          isActive: true,
        },
      });
    }

    await this.prisma.subscription.updateMany({
      where: {
        investorId: user.id,
        status: {
          in: [
            SubscriptionStatus.TRIAL,
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAST_DUE,
          ],
        },
      },
      data: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
      },
    });

    const startedAt = new Date();
    const currentPeriodEnd = this.getPeriodEndFromNow();

    const subscription = await this.prisma.subscription.create({
      data: {
        investorId: user.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startedAt,
        trialEndsAt: null,
        currentPeriodEnd,
        platformInvoices: {
          create: {
            amountDue: normalizedAmount,
            currency: 'UGX',
            status: 'PAID',
            periodStart: startedAt,
            periodEnd: currentPeriodEnd,
            dueDate: startedAt,
            issuedAt: startedAt,
            paidAt: startedAt,
          },
        },
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

    return {
      message:
        'Test subscription activated. Replace this endpoint with verified DPO webhook activation before production.',
      paymentRef:
        params.paymentRef ||
        `TEST-SUB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      hasActiveSubscription: true,
      subscription,
    };
  }

  async createSubscription(params: CreateSubscriptionParams) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: params.planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const subscriber = await this.prisma.user.findUnique({
      where: { id: params.investorId },
      select: { id: true, role: true, name: true, email: true },
    });

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    if (!this.requiresSubscription(subscriber.role)) {
      throw new BadRequestException(
        'This user role does not require a platform subscription',
      );
    }

    const existingActive = await this.prisma.subscription.findFirst({
      where: {
        investorId: params.investorId,
        status: {
          in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE],
        },
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        'This user already has an active or trial subscription',
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
      (item) => item.plan.billingInterval === BillingInterval.MONTHLY,
    ).length;

    const yearlyPlans = subscriptions.filter(
      (item) => item.plan.billingInterval === BillingInterval.YEARLY,
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
        item.investor?.role,
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
    if (!params.name?.trim()) {
      throw new BadRequestException('Plan name is required');
    }

    if (!params.price || Number(params.price) <= 0) {
      throw new BadRequestException('Plan price must be greater than zero');
    }

    return this.prisma.subscriptionPlan.create({
      data: {
        name: params.name.trim(),
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