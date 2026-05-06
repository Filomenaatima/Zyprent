import { Injectable } from '@nestjs/common';
import {
  AccountType,
  ExpenseStatus,
  LedgerSource,
  PaymentChannel,
  PaymentStatus,
  PayoutStatus,
  InvoiceKind,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

type TransactionDirection = 'positive' | 'negative';

type UnifiedTransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'profit'
  | 'investment'
  | 'refund'
  | 'expense'
  | 'payment'
  | 'rent'
  | 'maintenance'
  | 'other';

type TransactionFamily =
  | 'wallet'
  | 'investment'
  | 'maintenance'
  | 'operational'
  | 'rent'
  | 'other';

type UnifiedTransactionItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  amount: number;
  direction: TransactionDirection;
  status: string;
  type: UnifiedTransactionType;
  family: TransactionFamily;
  category?: string | null;
  propertyId?: string | null;
  propertyTitle?: string | null;
  reference?: string | null;
};

type ResolvedInvoiceTransaction = {
  title: string;
  type: UnifiedTransactionType;
  family: TransactionFamily;
  category: string;
};

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  private round(value: number) {
    return Number((value || 0).toFixed(2));
  }

  private normalizeStatus(status?: string | null) {
    return (status || 'COMPLETED').toUpperCase();
  }

  private resolveInvoiceTransaction(invoice?: {
    kind?: InvoiceKind | string | null;
  } | null): ResolvedInvoiceTransaction {
    const kind = String(invoice?.kind || '').toUpperCase();

    if (kind === InvoiceKind.RENT) {
      return {
        title: 'Rent Payment',
        type: 'rent',
        family: 'rent',
        category: 'RENT',
      };
    }

    if (kind === InvoiceKind.GARBAGE) {
      return {
        title: 'Garbage Fee Payment',
        type: 'payment',
        family: 'operational',
        category: 'GARBAGE',
      };
    }

    if (kind === InvoiceKind.SERVICE_CHARGE) {
      return {
        title: 'Service Charge Payment',
        type: 'payment',
        family: 'operational',
        category: 'SERVICE_CHARGE',
      };
    }

    return {
      title: 'Other Payment',
      type: 'payment',
      family: 'other',
      category: 'OTHER',
    };
  }

  private inferWalletTransactionType(item: {
    title: string;
    subtitle: string;
    status: string;
  }): UnifiedTransactionType {
    const title = item.title.toLowerCase();
    const subtitle = item.subtitle.toLowerCase();

    if (title.includes('expense')) return 'expense';

    if (title.includes('top up') || subtitle.includes('external funding')) {
      return 'deposit';
    }

    if (title.includes('profit')) return 'profit';
    if (title.includes('withdrawal')) return 'withdrawal';
    if (title.includes('investment')) return 'investment';
    if (title.includes('refund')) return 'refund';
    if (title.includes('rent')) return 'rent';

    if (title.includes('garbage') || title.includes('service charge')) {
      return 'payment';
    }

    if (title.includes('maintenance')) return 'maintenance';

    return 'other';
  }

  private inferWalletTransactionFamily(item: {
    title: string;
    subtitle: string;
    status: string;
  }): TransactionFamily {
    const title = item.title.toLowerCase();
    const type = this.inferWalletTransactionType(item);

    if (type === 'expense') {
      if (title.includes('maintenance')) return 'maintenance';
      return 'operational';
    }

    if (type === 'investment' || type === 'profit') return 'investment';
    if (type === 'rent') return 'rent';

    if (title.includes('garbage') || title.includes('service charge')) {
      return 'operational';
    }

    if (type === 'maintenance') return 'maintenance';

    return 'wallet';
  }

  private isResidentWalletOnlyItem(item: UnifiedTransactionItem) {
    return (
      item.type === 'deposit' ||
      item.type === 'withdrawal' ||
      item.type === 'refund' ||
      item.type === 'expense'
    );
  }

  private async buildWalletItems(
    userId: string,
  ): Promise<UnifiedTransactionItem[]> {
    const walletTransactions = await this.walletService.getWalletTransactions(
      userId,
      1,
      1000,
    );

    return walletTransactions.items.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      time: item.time,
      amount: Number(item.amount),
      direction: item.direction as TransactionDirection,
      status: this.normalizeStatus(item.status),
      type: this.inferWalletTransactionType(item),
      family: this.inferWalletTransactionFamily(item),
      category:
        this.inferWalletTransactionType(item) === 'expense' ? 'EXPENSE' : null,
      propertyId: null,
      propertyTitle: null,
      reference: null,
    }));
  }

  private async buildInvestorExpenseItems(
    userId: string,
  ): Promise<UnifiedTransactionItem[]> {
    const investorAccount = await this.prisma.account.findFirst({
      where: {
        userId,
        type: AccountType.USER,
      },
      select: { id: true },
    });

    const investorShares = await this.prisma.investorShare.findMany({
      where: { investorId: userId },
      include: {
        property: {
          include: {
            expenses: {
              where: {
                status: ExpenseStatus.PAID,
                OR: [
                  { paymentChannel: null },
                  { paymentChannel: { not: PaymentChannel.WALLET } },
                ],
              },
            },
            investmentOffer: true,
          },
        },
      },
    });

    const propertyIds = [
      ...new Set(
        investorShares
          .map((share) => share.propertyId)
          .filter((propertyId): propertyId is string => Boolean(propertyId)),
      ),
    ];

    const investorLedgerEntries =
      investorAccount && propertyIds.length > 0
        ? await this.prisma.ledgerEntry.findMany({
            where: {
              accountId: investorAccount.id,
              source: LedgerSource.EXPENSE_PAYMENT,
              propertyId: {
                in: propertyIds,
              },
            },
            select: {
              reference: true,
            },
          })
        : [];

    const ledgerReferences = new Set(
      investorLedgerEntries
        .map((entry) => entry.reference)
        .filter((reference): reference is string => Boolean(reference)),
    );

    const maintenancePayouts =
      propertyIds.length > 0
        ? await this.prisma.providerPayout.findMany({
            where: {
              status: PayoutStatus.COMPLETED,
              OR: [
                { paymentChannel: null },
                { paymentChannel: { not: PaymentChannel.WALLET } },
              ],
              request: {
                propertyId: {
                  in: propertyIds,
                },
              },
            },
            include: {
              request: {
                include: {
                  property: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 1000,
          })
        : [];

    const payoutsByProperty = new Map<string, typeof maintenancePayouts>();

    for (const payout of maintenancePayouts) {
      const propertyId = payout.request?.propertyId;
      if (!propertyId) continue;

      const existing = payoutsByProperty.get(propertyId) ?? [];
      existing.push(payout);
      payoutsByProperty.set(propertyId, existing);
    }

    const expenseItems: UnifiedTransactionItem[] = [];

    for (const share of investorShares) {
      const property = share.property;
      if (!property) continue;

      const totalShares =
        Number(property.investmentOffer?.totalShares ?? 0) > 0
          ? Number(property.investmentOffer?.totalShares ?? 0)
          : Number(
              (
                await this.prisma.investorShare.aggregate({
                  where: { propertyId: property.id },
                  _sum: { sharesOwned: true },
                })
              )._sum.sharesOwned ?? 0,
            );

      if (totalShares <= 0) continue;

      const investorSharesOwned = Number(share.sharesOwned ?? 0);
      const investorShareRatio = investorSharesOwned / totalShares;

      if (investorShareRatio <= 0) continue;

      const ownershipPercent = this.round(investorShareRatio * 100);

      for (const expense of property.expenses ?? []) {
        const paymentReference = expense.paymentReference || null;

        const alreadyLedgerBacked =
          paymentReference &&
          Array.from(ledgerReferences).some((reference) =>
            reference.startsWith(paymentReference),
          );

        if (alreadyLedgerBacked) continue;

        const allocatedAmount = this.round(
          Number(expense.amount ?? 0) * investorShareRatio,
        );

        if (allocatedAmount <= 0) continue;

        const isMaintenance = Boolean(expense.maintenanceRequestId);

        expenseItems.push({
          id: `legacy-allocated-expense-${expense.id}-${share.id}`,
          title: isMaintenance
            ? 'Allocated Maintenance Expense'
            : 'Allocated Operating Expense',
          subtitle: `${expense.title} • ${property.title} • ${ownershipPercent}% share`,
          time: expense.paidAt
            ? expense.paidAt.toISOString()
            : expense.expenseDate.toISOString(),
          amount: allocatedAmount,
          direction: 'negative',
          status: this.normalizeStatus(expense.status),
          type: 'expense',
          family: isMaintenance ? 'maintenance' : 'operational',
          category: expense.category || null,
          propertyId: property.id,
          propertyTitle: property.title,
          reference: paymentReference || expense.category || null,
        });
      }

      const propertyPayouts = payoutsByProperty.get(property.id) ?? [];

      for (const payout of propertyPayouts) {
        const allocatedAmount = this.round(
          Number(payout.totalAmount ?? 0) * investorShareRatio,
        );

        if (allocatedAmount <= 0) continue;

        expenseItems.push({
          id: `allocated-maintenance-payout-${payout.id}-${share.id}`,
          title: 'Allocated External Maintenance Expense',
          subtitle: `${payout.request?.title || 'Maintenance job'} • ${
            property.title
          } • ${ownershipPercent}% share`,
          time: payout.createdAt.toISOString(),
          amount: allocatedAmount,
          direction: 'negative',
          status: this.normalizeStatus(payout.status),
          type: 'expense',
          family: 'maintenance',
          category: payout.request?.category || null,
          propertyId: property.id,
          propertyTitle: property.title,
          reference: payout.request?.title || null,
        });
      }
    }

    const uniqueItems = new Map<string, UnifiedTransactionItem>();
    for (const item of expenseItems) uniqueItems.set(item.id, item);

    return Array.from(uniqueItems.values());
  }

  private async buildResidentPaymentItems(
    userId: string,
  ): Promise<UnifiedTransactionItem[]> {
    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!resident) return [];

    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
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
      take: 1000,
    });

    return payments.map((payment) => {
      const resolved = this.resolveInvoiceTransaction(payment.invoice);

      return {
        id: `invoice-payment-${payment.id}`,
        title: resolved.title,
        subtitle: `${payment.invoice?.unit?.property?.title || 'Property'} • ${
          payment.invoice?.period || 'Invoice'
        }`,
        time: payment.createdAt.toISOString(),
        amount: Number(payment.amount ?? 0),
        direction: 'negative',
        status: this.normalizeStatus(payment.status),
        type: resolved.type,
        family: resolved.family,
        category: resolved.category,
        propertyId: payment.invoice?.unit?.propertyId ?? null,
        propertyTitle: payment.invoice?.unit?.property?.title ?? null,
        reference: payment.providerRef ?? payment.provider ?? null,
      };
    });
  }

  private async buildResidentMaintenanceItems(
    userId: string,
  ): Promise<UnifiedTransactionItem[]> {
    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!resident) return [];

    const requests = await this.prisma.maintenanceRequest.findMany({
      where: {
        residentId: resident.id,
        paidByUserId: userId,
        paidAt: {
          not: null,
        },
      },
      include: {
        property: true,
        unit: true,
      },
      orderBy: { paidAt: 'desc' },
      take: 1000,
    });

    const items: UnifiedTransactionItem[] = [];

    for (const request of requests) {
      const residentShare = Number(request.residentShare ?? 0);
      const fallbackAmount = Number(request.estimatedCost ?? 0);
      const amount = residentShare > 0 ? residentShare : fallbackAmount;

      if (amount <= 0) continue;

      items.push({
        id: `maintenance-${request.id}`,
        title: 'Maintenance Charge',
        subtitle: `${request.title} • ${request.property?.title || 'Property'}`,
        time: (request.paidAt || request.createdAt).toISOString(),
        amount,
        direction: 'negative',
        status: 'COMPLETED',
        type: 'maintenance',
        family: 'maintenance',
        category: request.category || null,
        propertyId: request.propertyId ?? null,
        propertyTitle: request.property?.title ?? null,
        reference: request.paymentReference ?? null,
      });
    }

    return items;
  }

  private async buildManagerPaymentItems(
    userId: string,
  ): Promise<UnifiedTransactionItem[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
        invoice: {
          unit: {
            property: {
              managerId: userId,
            },
          },
        },
      },
      include: {
        invoice: {
          include: {
            resident: {
              include: {
                user: true,
              },
            },
            unit: {
              include: {
                property: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    return payments.map((payment) => {
      const resolved = this.resolveInvoiceTransaction(payment.invoice);

      return {
        id: `payment-${payment.id}`,
        title: `${resolved.title} Received`,
        subtitle: `${payment.invoice?.resident?.user?.name || 'Resident'} • ${
          payment.invoice?.unit?.property?.title || 'Property'
        }`,
        time: payment.createdAt.toISOString(),
        amount: Number(payment.amount ?? 0),
        direction: 'positive',
        status: this.normalizeStatus(payment.status),
        type: resolved.type,
        family: resolved.family,
        category: resolved.category,
        propertyId: payment.invoice?.unit?.propertyId ?? null,
        propertyTitle: payment.invoice?.unit?.property?.title ?? null,
        reference: payment.providerRef ?? payment.provider ?? null,
      };
    });
  }

  private async buildManagerExpenseItems(
    userId: string,
  ): Promise<UnifiedTransactionItem[]> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        status: ExpenseStatus.PAID,
        property: {
          managerId: userId,
        },
      },
      include: {
        property: true,
      },
      orderBy: { paidAt: 'desc' },
      take: 1000,
    });

    return expenses.map((expense) => {
      const isMaintenance = Boolean(expense.maintenanceRequestId);

      return {
        id: `expense-${expense.id}`,
        title: isMaintenance
          ? 'Maintenance Expense Paid'
          : 'Operating Expense Paid',
        subtitle: `${expense.title} • ${expense.property?.title || 'Property'}`,
        time: (expense.paidAt || expense.expenseDate).toISOString(),
        amount: Number(expense.amount ?? 0),
        direction: 'negative',
        status: this.normalizeStatus(expense.status),
        type: 'expense',
        family: isMaintenance ? 'maintenance' : 'operational',
        category: expense.category || null,
        propertyId: expense.propertyId,
        propertyTitle: expense.property?.title ?? null,
        reference: expense.paymentReference || expense.category || null,
      };
    });
  }

  private async buildManagerMaintenanceExpenseItems(
    userId: string,
  ): Promise<UnifiedTransactionItem[]> {
    const payouts = await this.prisma.providerPayout.findMany({
      where: {
        request: {
          property: {
            managerId: userId,
          },
        },
      },
      include: {
        provider: {
          include: {
            user: true,
          },
        },
        request: {
          include: {
            property: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    return payouts.map((payout) => ({
      id: `maintenance-payout-${payout.id}`,
      title: 'Provider Payout',
      subtitle: `${
        payout.provider?.companyName ||
        payout.provider?.user?.name ||
        'Provider'
      } • ${payout.request?.property?.title || 'Property'}`,
      time: payout.createdAt.toISOString(),
      amount: Number(payout.totalAmount ?? 0),
      direction: 'negative',
      status: this.normalizeStatus(payout.status || PayoutStatus.PENDING),
      type: 'expense',
      family: 'maintenance',
      category: payout.request?.category || null,
      propertyId: payout.request?.propertyId ?? null,
      propertyTitle: payout.request?.property?.title ?? null,
      reference: payout.request?.title ?? null,
    }));
  }

  private async buildAdminPaymentItems(): Promise<UnifiedTransactionItem[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
      },
      include: {
        invoice: {
          include: {
            resident: {
              include: {
                user: true,
              },
            },
            unit: {
              include: {
                property: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    return payments.map((payment) => {
      const resolved = this.resolveInvoiceTransaction(payment.invoice);

      return {
        id: `payment-${payment.id}`,
        title: `Platform ${resolved.title}`,
        subtitle: `${payment.invoice?.resident?.user?.name || 'Resident'} • ${
          payment.invoice?.unit?.property?.title || 'Property'
        }`,
        time: payment.createdAt.toISOString(),
        amount: Number(payment.amount ?? 0),
        direction: 'positive',
        status: this.normalizeStatus(payment.status),
        type: resolved.type,
        family: resolved.family,
        category: resolved.category,
        propertyId: payment.invoice?.unit?.propertyId ?? null,
        propertyTitle: payment.invoice?.unit?.property?.title ?? null,
        reference: payment.providerRef ?? payment.provider ?? null,
      };
    });
  }

  private async buildAdminExpenseItems(): Promise<UnifiedTransactionItem[]> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        status: ExpenseStatus.PAID,
      },
      include: {
        property: true,
      },
      orderBy: { paidAt: 'desc' },
      take: 1000,
    });

    return expenses.map((expense) => {
      const isMaintenance = Boolean(expense.maintenanceRequestId);

      return {
        id: `expense-${expense.id}`,
        title: isMaintenance
          ? 'Platform Maintenance Expense'
          : 'Platform Operating Expense',
        subtitle: `${expense.title} • ${expense.property?.title || 'Property'}`,
        time: (expense.paidAt || expense.expenseDate).toISOString(),
        amount: Number(expense.amount ?? 0),
        direction: 'negative',
        status: this.normalizeStatus(expense.status),
        type: 'expense',
        family: isMaintenance ? 'maintenance' : 'operational',
        category: expense.category || null,
        propertyId: expense.propertyId,
        propertyTitle: expense.property?.title ?? null,
        reference: expense.paymentReference || expense.category || null,
      };
    });
  }

  private async buildAdminMaintenanceExpenseItems(): Promise<
    UnifiedTransactionItem[]
  > {
    const payouts = await this.prisma.providerPayout.findMany({
      include: {
        provider: {
          include: {
            user: true,
          },
        },
        request: {
          include: {
            property: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    return payouts.map((payout) => ({
      id: `maintenance-payout-${payout.id}`,
      title: 'Platform Provider Payout',
      subtitle: `${
        payout.provider?.companyName ||
        payout.provider?.user?.name ||
        'Provider'
      } • ${payout.request?.property?.title || 'Property'}`,
      time: payout.createdAt.toISOString(),
      amount: Number(payout.totalAmount ?? 0),
      direction: 'negative',
      status: this.normalizeStatus(payout.status || PayoutStatus.PENDING),
      type: 'expense',
      family: 'maintenance',
      category: payout.request?.category || null,
      propertyId: payout.request?.propertyId ?? null,
      propertyTitle: payout.request?.property?.title ?? null,
      reference: payout.request?.title ?? null,
    }));
  }

  private applyFilters(
    items: UnifiedTransactionItem[],
    filters: {
      type?: string;
      status?: string;
      search?: string;
    },
  ) {
    let filtered = [...items];

    if (filters.type && filters.type.toLowerCase() !== 'all') {
      const type = filters.type.toLowerCase();

      if (type === 'rent') {
        filtered = filtered.filter((item) => item.category === 'RENT');
      } else if (type === 'service') {
        filtered = filtered.filter((item) => item.category === 'SERVICE_CHARGE');
      } else if (type === 'garbage') {
        filtered = filtered.filter((item) => item.category === 'GARBAGE');
      } else if (type === 'payments') {
        filtered = filtered.filter(
          (item) => item.type === 'payment' || item.type === 'rent',
        );
      } else if (type === 'topups' || type === 'top-ups') {
        filtered = filtered.filter((item) => item.type === 'deposit');
      } else if (type === 'profits') {
        filtered = filtered.filter((item) => item.type === 'profit');
      } else if (type === 'investments') {
        filtered = filtered.filter((item) => item.type === 'investment');
      } else if (type === 'withdrawals') {
        filtered = filtered.filter((item) => item.type === 'withdrawal');
      } else if (type === 'expenses') {
        filtered = filtered.filter((item) => item.type === 'expense');
      } else {
        filtered = filtered.filter((item) => item.type === type);
      }
    }

    if (filters.status && filters.status.toLowerCase() !== 'all') {
      const status = filters.status.toUpperCase();
      filtered = filtered.filter((item) => item.status === status);
    }

    if (filters.search?.trim()) {
      const term = filters.search.trim().toLowerCase();

      filtered = filtered.filter((item) => {
        return (
          item.title.toLowerCase().includes(term) ||
          item.subtitle.toLowerCase().includes(term) ||
          (item.propertyTitle || '').toLowerCase().includes(term) ||
          (item.reference || '').toLowerCase().includes(term) ||
          (item.category || '').toLowerCase().includes(term) ||
          item.family.toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  }

  private buildManagerPropertyBreakdown(items: UnifiedTransactionItem[]) {
    const grouped = new Map<
      string,
      {
        propertyId: string | null;
        propertyTitle: string;
        inflow: number;
        outflow: number;
        netCashFlow: number;
        payments: number;
        rentPayments: number;
        serviceChargePayments: number;
        garbagePayments: number;
        operationalExpenses: number;
        maintenanceExpenses: number;
      }
    >();

    for (const item of items) {
      const propertyId = item.propertyId ?? null;
      const propertyTitle = item.propertyTitle || 'Unassigned';
      const key = propertyId || `unassigned-${propertyTitle}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          propertyId,
          propertyTitle,
          inflow: 0,
          outflow: 0,
          netCashFlow: 0,
          payments: 0,
          rentPayments: 0,
          serviceChargePayments: 0,
          garbagePayments: 0,
          operationalExpenses: 0,
          maintenanceExpenses: 0,
        });
      }

      const row = grouped.get(key)!;
      const amount = Number(item.amount ?? 0);

      if (item.direction === 'positive') row.inflow += amount;
      else row.outflow += amount;

      if (item.type === 'payment' || item.type === 'rent') {
        row.payments += amount;
      }

      if (item.category === 'RENT') row.rentPayments += amount;
      if (item.category === 'SERVICE_CHARGE') row.serviceChargePayments += amount;
      if (item.category === 'GARBAGE') row.garbagePayments += amount;

      if (item.type === 'expense' && item.family === 'operational') {
        row.operationalExpenses += amount;
      }

      if (item.type === 'expense' && item.family === 'maintenance') {
        row.maintenanceExpenses += amount;
      }

      row.netCashFlow = row.inflow - row.outflow;
    }

    return Array.from(grouped.values())
      .map((row) => ({
        ...row,
        inflow: this.round(row.inflow),
        outflow: this.round(row.outflow),
        netCashFlow: this.round(row.netCashFlow),
        payments: this.round(row.payments),
        rentPayments: this.round(row.rentPayments),
        serviceChargePayments: this.round(row.serviceChargePayments),
        garbagePayments: this.round(row.garbagePayments),
        operationalExpenses: this.round(row.operationalExpenses),
        maintenanceExpenses: this.round(row.maintenanceExpenses),
      }))
      .sort((a, b) => b.netCashFlow - a.netCashFlow);
  }

  async getInvestorTransactions(params: {
    userId: string;
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 10));

    const [walletItems, expenseItems] = await Promise.all([
      this.buildWalletItems(params.userId),
      this.buildInvestorExpenseItems(params.userId),
    ]);

    const uniqueItems = new Map<string, UnifiedTransactionItem>();

    for (const item of [...walletItems, ...expenseItems]) {
      uniqueItems.set(item.id, item);
    }

    const allItems = Array.from(uniqueItems.values()).sort((a, b) => {
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    const filtered = this.applyFilters(allItems, {
      type: params.type,
      status: params.status,
      search: params.search,
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: filtered.slice(start, end),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      audience: 'investor',
    };
  }

  async getResidentTransactions(params: {
    userId: string;
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 10));

    const [walletItems, paymentItems, maintenanceItems] = await Promise.all([
      this.buildWalletItems(params.userId),
      this.buildResidentPaymentItems(params.userId),
      this.buildResidentMaintenanceItems(params.userId),
    ]);

    const filteredWalletItems = walletItems.filter((item) =>
      this.isResidentWalletOnlyItem(item),
    );

    const uniqueItems = new Map<string, UnifiedTransactionItem>();

    for (const item of [
      ...filteredWalletItems,
      ...paymentItems,
      ...maintenanceItems,
    ]) {
      uniqueItems.set(item.id, item);
    }

    const allItems = Array.from(uniqueItems.values()).sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    const filtered = this.applyFilters(allItems, {
      type: params.type,
      status: params.status,
      search: params.search,
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: filtered.slice(start, end),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      audience: 'resident',
    };
  }

  async getInvestorTransactionSummary(userId: string) {
    const [walletItems, expenseItems] = await Promise.all([
      this.buildWalletItems(userId),
      this.buildInvestorExpenseItems(userId),
    ]);

    const allItems = [...walletItems, ...expenseItems];

    const inflow = this.round(
      allItems
        .filter((item) => item.direction === 'positive')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const outflow = this.round(
      allItems
        .filter((item) => item.direction === 'negative')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const pendingCount = allItems.filter(
      (item) => this.normalizeStatus(item.status) === 'PENDING',
    ).length;

    const completedCount = allItems.filter((item) =>
      ['COMPLETED', 'PAID', 'APPROVED', 'SUCCESS'].includes(
        this.normalizeStatus(item.status),
      ),
    ).length;

    const expenseTotal = this.round(
      allItems
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    return {
      inflow,
      outflow,
      netCashFlow: this.round(inflow - outflow),
      pendingCount,
      completedCount,
      expenseTotal,
      typeBreakdown: {
        deposits: this.round(
          allItems
            .filter((item) => item.type === 'deposit')
            .reduce((sum, item) => sum + Number(item.amount), 0),
        ),
        withdrawals: this.round(
          allItems
            .filter((item) => item.type === 'withdrawal')
            .reduce((sum, item) => sum + Number(item.amount), 0),
        ),
        profits: this.round(
          allItems
            .filter((item) => item.type === 'profit')
            .reduce((sum, item) => sum + Number(item.amount), 0),
        ),
        investments: this.round(
          allItems
            .filter((item) => item.type === 'investment')
            .reduce((sum, item) => sum + Number(item.amount), 0),
        ),
        expenses: expenseTotal,
        maintenanceExpenses: this.round(
          allItems
            .filter(
              (item) => item.type === 'expense' && item.family === 'maintenance',
            )
            .reduce((sum, item) => sum + Number(item.amount), 0),
        ),
        operationalExpenses: this.round(
          allItems
            .filter(
              (item) => item.type === 'expense' && item.family === 'operational',
            )
            .reduce((sum, item) => sum + Number(item.amount), 0),
        ),
      },
      audience: 'investor',
    };
  }

  async getResidentTransactionSummary(userId: string) {
    const [walletItems, paymentItems, maintenanceItems] = await Promise.all([
      this.buildWalletItems(userId),
      this.buildResidentPaymentItems(userId),
      this.buildResidentMaintenanceItems(userId),
    ]);

    const filteredWalletItems = walletItems.filter((item) =>
      this.isResidentWalletOnlyItem(item),
    );

    const uniqueItems = new Map<string, UnifiedTransactionItem>();

    for (const item of [
      ...filteredWalletItems,
      ...paymentItems,
      ...maintenanceItems,
    ]) {
      uniqueItems.set(item.id, item);
    }

    const allItems = Array.from(uniqueItems.values());

    const inflow = this.round(
      allItems
        .filter((item) => item.direction === 'positive')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const outflow = this.round(
      allItems
        .filter((item) => item.direction === 'negative')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const pendingCount = allItems.filter(
      (item) => this.normalizeStatus(item.status) === 'PENDING',
    ).length;

    const completedCount = allItems.filter((item) =>
      ['COMPLETED', 'PAID', 'SUCCESS', 'APPROVED'].includes(
        this.normalizeStatus(item.status),
      ),
    ).length;

    const rentPayments = this.round(
      allItems
        .filter((item) => item.category === 'RENT')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const serviceChargePayments = this.round(
      allItems
        .filter((item) => item.category === 'SERVICE_CHARGE')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const garbagePayments = this.round(
      allItems
        .filter((item) => item.category === 'GARBAGE')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const maintenanceCharges = this.round(
      allItems
        .filter((item) => item.type === 'maintenance')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const refunds = this.round(
      allItems
        .filter((item) => item.type === 'refund')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    return {
      inflow,
      outflow,
      netCashFlow: this.round(inflow - outflow),
      pendingCount,
      completedCount,
      typeBreakdown: {
        deposits: this.round(
          allItems
            .filter((item) => item.type === 'deposit')
            .reduce((sum, item) => sum + Number(item.amount), 0),
        ),
        rentPayments,
        serviceChargePayments,
        garbagePayments,
        invoicePayments: this.round(
          rentPayments + serviceChargePayments + garbagePayments,
        ),
        maintenanceCharges,
        refunds,
      },
      audience: 'resident',
    };
  }

  async getManagerTransactions(params: {
    userId: string;
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 10));

    const [paymentItems, operationalExpenseItems, maintenanceExpenseItems] =
      await Promise.all([
        this.buildManagerPaymentItems(params.userId),
        this.buildManagerExpenseItems(params.userId),
        this.buildManagerMaintenanceExpenseItems(params.userId),
      ]);

    const uniqueItems = new Map<string, UnifiedTransactionItem>();

    for (const item of [
      ...paymentItems,
      ...operationalExpenseItems,
      ...maintenanceExpenseItems,
    ]) {
      uniqueItems.set(item.id, item);
    }

    const allItems = Array.from(uniqueItems.values()).sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    const filtered = this.applyFilters(allItems, {
      type: params.type,
      status: params.status,
      search: params.search,
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: filtered.slice(start, end),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      audience: 'manager',
      propertyBreakdown: this.buildManagerPropertyBreakdown(filtered),
    };
  }

  async getManagerTransactionSummary(userId: string) {
    const [paymentItems, operationalExpenseItems, maintenanceExpenseItems] =
      await Promise.all([
        this.buildManagerPaymentItems(userId),
        this.buildManagerExpenseItems(userId),
        this.buildManagerMaintenanceExpenseItems(userId),
      ]);

    const allItems = [
      ...paymentItems,
      ...operationalExpenseItems,
      ...maintenanceExpenseItems,
    ];

    const inflow = this.round(
      allItems
        .filter((item) => item.direction === 'positive')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const outflow = this.round(
      allItems
        .filter((item) => item.direction === 'negative')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const pendingCount = allItems.filter(
      (item) => this.normalizeStatus(item.status) === 'PENDING',
    ).length;

    const completedCount = allItems.filter((item) =>
      ['COMPLETED', 'PAID', 'SUCCESS', 'APPROVED'].includes(
        this.normalizeStatus(item.status),
      ),
    ).length;

    const expenseTotal = this.round(
      allItems
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const paymentTotal = this.round(
      allItems
        .filter((item) => item.type === 'payment' || item.type === 'rent')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const maintenanceExpenseTotal = this.round(
      allItems
        .filter(
          (item) => item.type === 'expense' && item.family === 'maintenance',
        )
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const operationalExpenseTotal = this.round(
      allItems
        .filter(
          (item) => item.type === 'expense' && item.family === 'operational',
        )
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    return {
      inflow,
      outflow,
      netCashFlow: this.round(inflow - outflow),
      pendingCount,
      completedCount,
      expenseTotal,
      paymentTotal,
      maintenanceExpenseTotal,
      operationalExpenseTotal,
      typeCounts: {
        payments: allItems.filter(
          (item) => item.type === 'payment' || item.type === 'rent',
        ).length,
        rentPayments: allItems.filter((item) => item.category === 'RENT').length,
        serviceChargePayments: allItems.filter(
          (item) => item.category === 'SERVICE_CHARGE',
        ).length,
        garbagePayments: allItems.filter((item) => item.category === 'GARBAGE')
          .length,
        expenses: allItems.filter((item) => item.type === 'expense').length,
        maintenanceExpenses: allItems.filter(
          (item) => item.type === 'expense' && item.family === 'maintenance',
        ).length,
        operationalExpenses: allItems.filter(
          (item) => item.type === 'expense' && item.family === 'operational',
        ).length,
      },
      propertyBreakdown: this.buildManagerPropertyBreakdown(allItems),
      audience: 'manager',
    };
  }

  async getAdminTransactions(params: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 10));

    const [paymentItems, operationalExpenseItems, maintenanceExpenseItems] =
      await Promise.all([
        this.buildAdminPaymentItems(),
        this.buildAdminExpenseItems(),
        this.buildAdminMaintenanceExpenseItems(),
      ]);

    const uniqueItems = new Map<string, UnifiedTransactionItem>();

    for (const item of [
      ...paymentItems,
      ...operationalExpenseItems,
      ...maintenanceExpenseItems,
    ]) {
      uniqueItems.set(item.id, item);
    }

    const allItems = Array.from(uniqueItems.values()).sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    const filtered = this.applyFilters(allItems, {
      type: params.type,
      status: params.status,
      search: params.search,
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: filtered.slice(start, end),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      audience: 'admin',
      propertyBreakdown: this.buildManagerPropertyBreakdown(filtered),
    };
  }

  async getAdminTransactionSummary() {
    const [paymentItems, operationalExpenseItems, maintenanceExpenseItems] =
      await Promise.all([
        this.buildAdminPaymentItems(),
        this.buildAdminExpenseItems(),
        this.buildAdminMaintenanceExpenseItems(),
      ]);

    const allItems = [
      ...paymentItems,
      ...operationalExpenseItems,
      ...maintenanceExpenseItems,
    ];

    const inflow = this.round(
      allItems
        .filter((item) => item.direction === 'positive')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const outflow = this.round(
      allItems
        .filter((item) => item.direction === 'negative')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const pendingCount = allItems.filter(
      (item) => this.normalizeStatus(item.status) === 'PENDING',
    ).length;

    const completedCount = allItems.filter((item) =>
      ['COMPLETED', 'PAID', 'SUCCESS', 'APPROVED'].includes(
        this.normalizeStatus(item.status),
      ),
    ).length;

    const expenseTotal = this.round(
      allItems
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const paymentTotal = this.round(
      allItems
        .filter((item) => item.type === 'payment' || item.type === 'rent')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const maintenanceExpenseTotal = this.round(
      allItems
        .filter(
          (item) => item.type === 'expense' && item.family === 'maintenance',
        )
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    const operationalExpenseTotal = this.round(
      allItems
        .filter(
          (item) => item.type === 'expense' && item.family === 'operational',
        )
        .reduce((sum, item) => sum + Number(item.amount), 0),
    );

    return {
      inflow,
      outflow,
      netCashFlow: this.round(inflow - outflow),
      pendingCount,
      completedCount,
      expenseTotal,
      paymentTotal,
      maintenanceExpenseTotal,
      operationalExpenseTotal,
      typeCounts: {
        payments: allItems.filter(
          (item) => item.type === 'payment' || item.type === 'rent',
        ).length,
        rentPayments: allItems.filter((item) => item.category === 'RENT').length,
        serviceChargePayments: allItems.filter(
          (item) => item.category === 'SERVICE_CHARGE',
        ).length,
        garbagePayments: allItems.filter((item) => item.category === 'GARBAGE')
          .length,
        expenses: allItems.filter((item) => item.type === 'expense').length,
        maintenanceExpenses: allItems.filter(
          (item) => item.type === 'expense' && item.family === 'maintenance',
        ).length,
        operationalExpenses: allItems.filter(
          (item) => item.type === 'expense' && item.family === 'operational',
        ).length,
      },
      propertyBreakdown: this.buildManagerPropertyBreakdown(allItems),
      audience: 'admin',
    };
  }
}