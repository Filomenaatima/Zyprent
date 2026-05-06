import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExpenseCategory,
  ExpenseStatus,
  LedgerSource,
  MaintenanceStatus,
  PaymentChannel,
  PaymentProvider,
  PayoutStatus,
  Prisma,
  Role,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ReviewExpenseDto } from './dto/review-expense.dto';
import { MarkExpensePaidDto } from './dto/mark-expense-paid.dto';

type Actor = {
  userId: string;
  role: Role;
};

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  private readonly expenseInclude = {
    property: {
      select: {
        id: true,
        title: true,
        location: true,
        ownerId: true,
        managerId: true,
        expenseApprovalThreshold: true,
        autoApproveSmallExpenses: true,
      },
    },
    unit: {
      select: {
        id: true,
        number: true,
      },
    },
    maintenanceRequest: {
      select: {
        id: true,
        title: true,
        status: true,
        assignedProviderId: true,
        propertyId: true,
        propertyShare: true,
        residentShare: true,
        paymentResponsibility: true,
        paidAt: true,
        paidByUserId: true,
        paymentReference: true,
        paymentChannel: true,
        paymentProvider: true,
      },
    },
    createdBy: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    },
    reviewedBy: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    },
    paidByUser: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    },
  } satisfies Prisma.ExpenseInclude;

  private async getInvestorPropertyIds(investorId: string) {
    const shares = await this.prisma.investorShare.findMany({
      where: { investorId },
      select: { propertyId: true },
    });

    return [...new Set(shares.map((share) => share.propertyId))];
  }

  private async investorHasPropertyAccess(
    investorId: string,
    propertyId: string,
  ) {
    const share = await this.prisma.investorShare.findFirst({
      where: {
        investorId,
        propertyId,
      },
      select: { id: true },
    });

    return Boolean(share);
  }

  private normalizePaymentChannel(dto: MarkExpensePaidDto): PaymentChannel {
    const rawValue = ((dto as any).paymentChannel ??
      (dto as any).channel ??
      PaymentChannel.WALLET) as string;

    const normalized = String(rawValue).toUpperCase();

    if (!Object.values(PaymentChannel).includes(normalized as PaymentChannel)) {
      throw new BadRequestException('Invalid payment channel');
    }

    return normalized as PaymentChannel;
  }

  private normalizePaymentProvider(
    dto: MarkExpensePaidDto,
    channel: PaymentChannel,
  ): PaymentProvider {
    if (channel === PaymentChannel.WALLET) {
      return PaymentProvider.WALLET;
    }

    const rawValue = ((dto as any).paymentProvider ??
      (dto as any).provider ??
      channel) as string;

    const normalized = String(rawValue).toUpperCase();

    if (!Object.values(PaymentProvider).includes(normalized as PaymentProvider)) {
      throw new BadRequestException('Invalid payment provider');
    }

    if (normalized === PaymentProvider.WALLET) {
      throw new BadRequestException(
        'External expense payments cannot use WALLET provider',
      );
    }

    return normalized as PaymentProvider;
  }

  private buildExpensePaymentReference(
    expenseId: string,
    dto: MarkExpensePaidDto,
    channel: PaymentChannel,
  ) {
    const reference = dto.paymentReference?.trim();

    if (channel !== PaymentChannel.WALLET && !reference) {
      throw new BadRequestException(
        'Payment reference is required for external expense payments',
      );
    }

    return reference || `EXP-WALLET-${expenseId}`;
  }

  private mapMaintenanceStatusToExpenseStatus(request: {
    status: MaintenanceStatus;
    paidAt: Date | null;
    payouts?: { status: PayoutStatus; paidAt?: Date | null }[];
  }) {
    const hasCompletedPayout = Boolean(
      request.payouts?.some(
        (payout) =>
          payout.status === PayoutStatus.COMPLETED || Boolean(payout.paidAt),
      ),
    );

    if (request.paidAt || hasCompletedPayout) {
      return ExpenseStatus.PAID;
    }

    if (
      request.status === MaintenanceStatus.APPROVED ||
      request.status === MaintenanceStatus.IN_PROGRESS ||
      request.status === MaintenanceStatus.COMPLETED
    ) {
      return ExpenseStatus.APPROVED;
    }

    return ExpenseStatus.SUBMITTED;
  }

  private mapMaintenanceToExpenseLike(request: any, amount: number) {
    const status = this.mapMaintenanceStatusToExpenseStatus(request);

    const completedPayout = request.payouts?.find(
      (payout: any) =>
        payout.status === PayoutStatus.COMPLETED || Boolean(payout.paidAt),
    );

    const paymentReference =
      request.paymentReference ?? completedPayout?.paymentReference ?? null;

    const paymentChannel =
      request.paymentChannel ?? completedPayout?.paymentChannel ?? null;

    const paymentProvider =
      request.paymentProvider ?? completedPayout?.paymentProvider ?? null;

    const paidAt =
      request.paidAt ??
      completedPayout?.paidAt ??
      (status === ExpenseStatus.PAID ? request.updatedAt : null);

    return {
      id: `maintenance-${request.id}`,
      propertyId: request.propertyId,
      property: request.property,
      unitId: request.unitId,
      unit: request.unit,
      maintenanceRequestId: request.id,
      maintenanceRequest: {
        id: request.id,
        title: request.title,
        status: request.status,
        assignedProviderId: request.assignedProviderId,
        propertyId: request.propertyId,
        propertyShare: request.propertyShare,
        residentShare: request.residentShare,
        paymentResponsibility: request.paymentResponsibility,
        paidAt,
        paidByUserId: request.paidByUserId ?? null,
        paymentReference,
        paymentChannel,
        paymentProvider,
      },
      title: request.title,
      description: request.description,
      category: ExpenseCategory.MAINTENANCE,
      amount,
      currency: 'UGX',
      vendorName: request.assignedProvider?.companyName ?? null,
      receiptUrl: null,
      notes: null,
      paymentReference,
      paymentChannel,
      paymentProvider,
      paidByUserId: request.paidByUserId ?? null,
      rejectionReason: null,
      status,
      isAboveApprovalThreshold: false,
      autoApproved: false,
      expenseDate: paidAt ?? request.updatedAt ?? request.createdAt,
      submittedAt: request.createdAt,
      reviewedAt:
        status === ExpenseStatus.APPROVED || status === ExpenseStatus.PAID
          ? request.updatedAt
          : null,
      paidAt,
      createdById: null,
      createdBy: null,
      reviewedById: null,
      reviewedBy: null,
      paidByUser: null,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      expenseSource: 'MAINTENANCE',
      propertyAmount: Number(request.propertyShare || 0),
      residentAmount: Number(request.residentShare || 0),
    };
  }

  private async getPropertyMaintenanceExpenses(
    propertyIds: string[],
    filters?: {
      propertyId?: string;
      status?: ExpenseStatus;
      category?: string;
    },
  ) {
    if (propertyIds.length === 0) return [];

    if (filters?.category && filters.category !== ExpenseCategory.MAINTENANCE) {
      return [];
    }

    const scopedPropertyIds = filters?.propertyId
      ? [filters.propertyId]
      : propertyIds;

    const linkedExpenses = await this.prisma.expense.findMany({
      where: {
        propertyId: {
          in: scopedPropertyIds,
        },
        maintenanceRequestId: {
          not: null,
        },
      },
      select: {
        maintenanceRequestId: true,
      },
    });

    const linkedMaintenanceIds = linkedExpenses
      .map((expense) => expense.maintenanceRequestId)
      .filter((id): id is string => Boolean(id));

    const requests = await this.prisma.maintenanceRequest.findMany({
      where: {
        propertyId: {
          in: scopedPropertyIds,
        },
        propertyShare: {
          gt: 0,
        },
        ...(linkedMaintenanceIds.length > 0
          ? {
              id: {
                notIn: linkedMaintenanceIds,
              },
            }
          : {}),
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            ownerId: true,
            managerId: true,
            expenseApprovalThreshold: true,
            autoApproveSmallExpenses: true,
          },
        },
        unit: {
          select: {
            id: true,
            number: true,
          },
        },
        assignedProvider: {
          select: {
            id: true,
            companyName: true,
            userId: true,
          },
        },
        payouts: {
          select: {
            id: true,
            totalAmount: true,
            platformFee: true,
            providerEarning: true,
            status: true,
            paymentChannel: true,
            paymentProvider: true,
            paymentReference: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    const items = requests.map((request) =>
      this.mapMaintenanceToExpenseLike(
        request,
        Number(request.propertyShare || request.estimatedCost || 0),
      ),
    );

    if (!filters?.status) return items;

    return items.filter((item) => item.status === filters.status);
  }

  private async getResidentMaintenanceExpenses(
    userId: string,
    filters?: {
      propertyId?: string;
      status?: ExpenseStatus;
      category?: string;
    },
  ) {
    if (filters?.category && filters.category !== ExpenseCategory.MAINTENANCE) {
      return [];
    }

    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!resident) return [];

    const requests = await this.prisma.maintenanceRequest.findMany({
      where: {
        residentId: resident.id,
        residentShare: {
          gt: 0,
        },
        ...(filters?.propertyId ? { propertyId: filters.propertyId } : {}),
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            ownerId: true,
            managerId: true,
            expenseApprovalThreshold: true,
            autoApproveSmallExpenses: true,
          },
        },
        unit: {
          select: {
            id: true,
            number: true,
          },
        },
        assignedProvider: {
          select: {
            id: true,
            companyName: true,
            userId: true,
          },
        },
        payouts: {
          select: {
            id: true,
            totalAmount: true,
            platformFee: true,
            providerEarning: true,
            status: true,
            paymentChannel: true,
            paymentProvider: true,
            paymentReference: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    const items = requests.map((request) =>
      this.mapMaintenanceToExpenseLike(
        request,
        Number(request.residentShare || 0),
      ),
    );

    if (!filters?.status) return items;

    return items.filter((item) => item.status === filters.status);
  }

  private sortExpenses(items: any[]) {
    return [...items].sort((a, b) => {
      const aTime = new Date(a.expenseDate || a.createdAt || 0).getTime();
      const bTime = new Date(b.expenseDate || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }

  private summarizeExpenses(items: any[]) {
    const totalExpenses = items.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    const draftAmount = items
      .filter((item) => item.status === ExpenseStatus.DRAFT)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const submittedAmount = items
      .filter((item) => item.status === ExpenseStatus.SUBMITTED)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const approvedAmount = items
      .filter((item) => item.status === ExpenseStatus.APPROVED)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const paidAmount = items
      .filter((item) => item.status === ExpenseStatus.PAID)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const rejectedAmount = items
      .filter((item) => item.status === ExpenseStatus.REJECTED)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      totalCount: items.length,
      totalExpenses,
      draftAmount,
      submittedAmount,
      approvedAmount,
      paidAmount,
      rejectedAmount,
      pendingApprovalAmount: submittedAmount,
    };
  }

  private calculateInvestorExpenseShares(
    totalAmount: number,
    shares: { investorId: string; sharesOwned: number }[],
  ) {
    const totalShares = shares.reduce(
      (sum, share) => sum + Number(share.sharesOwned || 0),
      0,
    );

    if (shares.length === 0 || totalShares <= 0) {
      throw new BadRequestException('No valid investor shares found for property');
    }

    let allocatedTotal = 0;

    return shares.map((share, index) => {
      const isLast = index === shares.length - 1;

      const calculatedAmount = Math.round(
        (Number(share.sharesOwned || 0) / totalShares) * totalAmount,
      );

      const investorAmount = isLast
        ? totalAmount - allocatedTotal
        : calculatedAmount;

      allocatedTotal += investorAmount;

      return {
        investorId: share.investorId,
        percentage: (Number(share.sharesOwned || 0) / totalShares) * 100,
        amount: investorAmount,
      };
    });
  }

  private async getExpenseOrThrow(expenseId: string) {
    if (expenseId.startsWith('maintenance-')) {
      const maintenanceRequestId = expenseId.replace('maintenance-', '');

      const request = await this.prisma.maintenanceRequest.findUnique({
        where: { id: maintenanceRequestId },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              location: true,
              ownerId: true,
              managerId: true,
              expenseApprovalThreshold: true,
              autoApproveSmallExpenses: true,
            },
          },
          unit: {
            select: {
              id: true,
              number: true,
            },
          },
          assignedProvider: {
            select: {
              id: true,
              companyName: true,
              userId: true,
            },
          },
          payouts: {
            select: {
              id: true,
              totalAmount: true,
              platformFee: true,
              providerEarning: true,
              status: true,
              paymentChannel: true,
              paymentProvider: true,
              paymentReference: true,
              paidAt: true,
              createdAt: true,
            },
          },
        },
      });

      if (!request) {
        throw new NotFoundException('Expense not found');
      }

      const amount =
        Number(request.propertyShare || 0) > 0
          ? Number(request.propertyShare || 0)
          : Number(request.residentShare || request.estimatedCost || 0);

      return this.mapMaintenanceToExpenseLike(request, amount);
    }

    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: this.expenseInclude,
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  private async getPropertyOrThrow(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        managerId: true,
        expenseApprovalThreshold: true,
        autoApproveSmallExpenses: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  private assertManagerAccess(
    property: { managerId: string | null },
    actor: Actor,
  ) {
    if (actor.role === Role.ADMIN) return;

    if (actor.role !== Role.MANAGER || property.managerId !== actor.userId) {
      throw new ForbiddenException(
        'Only the assigned manager can manage expenses for this property',
      );
    }
  }

  private async assertInvestorAccess(property: { id: string }, actor: Actor) {
    if (actor.role === Role.ADMIN) return;

    if (actor.role !== Role.INVESTOR) {
      throw new ForbiddenException(
        'Only an investor with shares in this property can review expenses for this property',
      );
    }

    const hasAccess = await this.investorHasPropertyAccess(
      actor.userId,
      property.id,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'Only an investor with shares in this property can review expenses for this property',
      );
    }
  }

  private async assertPropertyAccess(
    property: { id: string; managerId: string | null },
    actor: Actor,
  ) {
    if (actor.role === Role.ADMIN) return;

    if (actor.role === Role.MANAGER && property.managerId === actor.userId) {
      return;
    }

    if (actor.role === Role.INVESTOR) {
      const hasAccess = await this.investorHasPropertyAccess(
        actor.userId,
        property.id,
      );

      if (hasAccess) return;
    }

    throw new ForbiddenException('You do not have access to this expense');
  }

  private calculateProviderPayout(totalAmount: number) {
    const safeTotal = Number(totalAmount || 0);
    const platformFee = Math.round(safeTotal * 0.1);
    const providerEarning = safeTotal - platformFee;

    return {
      totalAmount: safeTotal,
      platformFee,
      providerEarning,
    };
  }

  private async resolveExpenseCreditAccountId(
    tx: Prisma.TransactionClient,
    expense: {
      id: string;
      maintenanceRequestId: string | null;
    },
  ) {
    if (expense.maintenanceRequestId) {
      const maintenanceRequest = await tx.maintenanceRequest.findUnique({
        where: { id: expense.maintenanceRequestId },
        select: {
          assignedProviderId: true,
        },
      });

      if (maintenanceRequest?.assignedProviderId) {
        const provider = await tx.serviceProvider.findUnique({
          where: { id: maintenanceRequest.assignedProviderId },
          select: { userId: true },
        });

        if (provider?.userId) {
          const providerAccount = await tx.account.findFirst({
            where: { userId: provider.userId },
            select: { id: true },
          });

          if (providerAccount?.id) {
            return providerAccount.id;
          }
        }
      }
    }

    const adminUser = await tx.user.findFirst({
      where: { role: Role.ADMIN },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!adminUser) {
      return null;
    }

    const adminAccount = await tx.account.findFirst({
      where: { userId: adminUser.id },
      select: { id: true },
    });

    return adminAccount?.id ?? null;
  }

  private async resolvePayerAccountId(
    tx: Prisma.TransactionClient,
    paidByUserId: string,
  ) {
    const payerAccount = await tx.account.findFirst({
      where: { userId: paidByUserId },
      select: { id: true },
    });

    return payerAccount?.id ?? null;
  }

  private async recordInvestorExpenseLedger(params: {
    tx: Prisma.TransactionClient;
    propertyId: string;
    totalAmount: number;
    creditAccountId: string | null;
    reference: string;
    paymentChannel: PaymentChannel;
  }) {
    const {
      tx,
      propertyId,
      totalAmount,
      creditAccountId,
      reference,
      paymentChannel,
    } = params;

    if (!creditAccountId) {
      throw new BadRequestException('Expense credit account not found');
    }

    const shares = await tx.investorShare.findMany({
      where: { propertyId },
      select: {
        investorId: true,
        sharesOwned: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const allocations = this.calculateInvestorExpenseShares(totalAmount, shares);

    for (const allocation of allocations) {
      if (allocation.amount <= 0) continue;

      const payerAccountId = await this.resolvePayerAccountId(
        tx,
        allocation.investorId,
      );

      if (!payerAccountId) {
        throw new BadRequestException(
          `Account not found for investor ${allocation.investorId}`,
        );
      }

      const wallet = await tx.wallet.findUnique({
        where: { userId: allocation.investorId },
        select: {
          id: true,
          balance: true,
        },
      });

      if (!wallet) {
        throw new BadRequestException(
          `Wallet not found for investor ${allocation.investorId}`,
        );
      }

      if (paymentChannel === PaymentChannel.WALLET) {
        if (Number(wallet.balance) < allocation.amount) {
          throw new BadRequestException(
            `Insufficient wallet balance for investor ${allocation.investorId}`,
          );
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              decrement: allocation.amount,
            },
          },
        });
      }

      const investorReference = `${reference}-${allocation.investorId}`;

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.EXPENSE_PAYMENT,
          status: WalletTransactionStatus.COMPLETED,
          amount: allocation.amount,
          reference: investorReference,
        },
      });

      await this.ledgerService.recordDoubleEntry({
        debitAccountId: payerAccountId,
        creditAccountId,
        amount: allocation.amount,
        source: LedgerSource.EXPENSE_PAYMENT,
        reference: investorReference,
        propertyId,
        tx,
      });
    }
  }

  private async syncMaintenanceFromExpense(
    tx: Prisma.TransactionClient,
    expenseId: string,
  ) {
    const expense = await tx.expense.findUnique({
      where: { id: expenseId },
      include: {
        maintenanceRequest: {
          select: {
            id: true,
            status: true,
            propertyShare: true,
            residentShare: true,
            paidAt: true,
          },
        },
      },
    });

    if (!expense?.maintenanceRequestId || !expense.maintenanceRequest) {
      return;
    }

    const request = expense.maintenanceRequest;
    const residentShare = Number(request.residentShare || 0);
    const residentReady = residentShare <= 0 || !!request.paidAt;
    const propertyReady =
      expense.status === ExpenseStatus.APPROVED ||
      expense.status === ExpenseStatus.PAID;

    let nextStatus: MaintenanceStatus;

    if (expense.status === ExpenseStatus.REJECTED) {
      nextStatus = MaintenanceStatus.QUOTED;
    } else if (propertyReady && residentReady) {
      nextStatus = MaintenanceStatus.APPROVED;
    } else {
      nextStatus = MaintenanceStatus.QUOTED;
    }

    if (request.status !== nextStatus) {
      await tx.maintenanceRequest.update({
        where: { id: request.id },
        data: {
          status: nextStatus,
        },
      });
    }
  }

  async createExpense(dto: CreateExpenseDto, actor: Actor) {
    const property = await this.getPropertyOrThrow(dto.propertyId);
    this.assertManagerAccess(property, actor);

    if (dto.maintenanceRequestId) {
      const existing = await this.prisma.expense.findFirst({
        where: {
          maintenanceRequestId: dto.maintenanceRequestId,
        },
        include: this.expenseInclude,
      });

      if (existing) {
        return existing;
      }
    }

    return this.prisma.expense.create({
      data: {
        propertyId: dto.propertyId,
        unitId: dto.unitId ?? null,
        maintenanceRequestId: dto.maintenanceRequestId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category,
        amount: dto.amount,
        currency: dto.currency ?? 'UGX',
        vendorName: dto.vendorName ?? null,
        receiptUrl: dto.receiptUrl ?? null,
        notes: dto.notes ?? null,
        paymentReference: null,
        paymentChannel: null,
        paymentProvider: null,
        paidByUserId: null,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
        status: ExpenseStatus.DRAFT,
        createdById: actor.userId,
        isAboveApprovalThreshold: false,
        autoApproved: false,
      },
      include: this.expenseInclude,
    });
  }

  async updateExpense(expenseId: string, dto: UpdateExpenseDto, actor: Actor) {
    if (expenseId.startsWith('maintenance-')) {
      throw new BadRequestException(
        'Maintenance expenses must be updated from the maintenance page',
      );
    }

    const expense = await this.getExpenseOrThrow(expenseId);
    this.assertManagerAccess(expense.property, actor);

    const editableStatuses = new Set<ExpenseStatus>([
      ExpenseStatus.DRAFT,
      ExpenseStatus.REJECTED,
    ]);

    if (!editableStatuses.has(expense.status)) {
      throw new BadRequestException(
        'Only draft or rejected expenses can be edited',
      );
    }

    return this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(dto.unitId !== undefined ? { unitId: dto.unitId } : {}),
        ...(dto.maintenanceRequestId !== undefined
          ? { maintenanceRequestId: dto.maintenanceRequestId }
          : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.vendorName !== undefined ? { vendorName: dto.vendorName } : {}),
        ...(dto.receiptUrl !== undefined ? { receiptUrl: dto.receiptUrl } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.expenseDate !== undefined
          ? { expenseDate: new Date(dto.expenseDate) }
          : {}),
        status: ExpenseStatus.DRAFT,
        rejectionReason: null,
        reviewedAt: null,
        reviewedById: null,
        submittedAt: null,
        paidAt:
          expense.status === ExpenseStatus.REJECTED ? null : expense.paidAt,
        paymentReference:
          expense.status === ExpenseStatus.REJECTED
            ? null
            : expense.paymentReference,
        paymentChannel:
          expense.status === ExpenseStatus.REJECTED
            ? null
            : expense.paymentChannel,
        paymentProvider:
          expense.status === ExpenseStatus.REJECTED
            ? null
            : expense.paymentProvider,
        paidByUserId:
          expense.status === ExpenseStatus.REJECTED ? null : expense.paidByUserId,
      },
      include: this.expenseInclude,
    });
  }

  async submitExpense(expenseId: string, actor: Actor) {
    if (expenseId.startsWith('maintenance-')) {
      throw new BadRequestException(
        'Maintenance expenses must be submitted from the maintenance page',
      );
    }

    const expense = await this.getExpenseOrThrow(expenseId);
    this.assertManagerAccess(expense.property, actor);

    const submittableStatuses = new Set<ExpenseStatus>([
      ExpenseStatus.DRAFT,
      ExpenseStatus.REJECTED,
    ]);

    if (!submittableStatuses.has(expense.status)) {
      throw new BadRequestException(
        'Only draft or rejected expenses can be submitted',
      );
    }

    const threshold = Number(expense.property.expenseApprovalThreshold ?? 0);
    const isAboveApprovalThreshold = Number(expense.amount) > threshold;
    const autoApproved =
      Boolean(expense.property.autoApproveSmallExpenses) &&
      !isAboveApprovalThreshold;

    const updated = await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        isAboveApprovalThreshold,
        autoApproved,
        submittedAt: new Date(),
        reviewedAt: autoApproved ? new Date() : null,
        reviewedById: autoApproved ? actor.userId : null,
        rejectionReason: null,
        status: autoApproved ? ExpenseStatus.APPROVED : ExpenseStatus.SUBMITTED,
      },
      include: this.expenseInclude,
    });

    if (updated.maintenanceRequestId) {
      await this.prisma.$transaction(async (tx) => {
        await this.syncMaintenanceFromExpense(tx, updated.id);
      });
    }

    return this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: this.expenseInclude,
    });
  }

  async reviewExpense(
    expenseId: string,
    dto: ReviewExpenseDto,
    actor: Actor,
  ) {
    if (expenseId.startsWith('maintenance-')) {
      throw new BadRequestException(
        'Maintenance expenses must be reviewed from the maintenance page',
      );
    }

    const expense = await this.getExpenseOrThrow(expenseId);
    await this.assertInvestorAccess(expense.property, actor);

    if (expense.status !== ExpenseStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted expenses can be reviewed');
    }

    if (dto.action === 'REJECT' && !dto.rejectionReason?.trim()) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting an expense',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          status:
            dto.action === 'APPROVE'
              ? ExpenseStatus.APPROVED
              : ExpenseStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedById: actor.userId,
          rejectionReason:
            dto.action === 'REJECT' ? dto.rejectionReason ?? null : null,
        },
      });

      await this.syncMaintenanceFromExpense(tx, expenseId);
    });

    return this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: this.expenseInclude,
    });
  }

  async markExpensePaid(
    expenseId: string,
    dto: MarkExpensePaidDto,
    actor: Actor,
  ) {
    if (expenseId.startsWith('maintenance-')) {
      throw new BadRequestException(
        'Maintenance expenses must be paid from the maintenance page',
      );
    }

    const expense = await this.getExpenseOrThrow(expenseId);
    await this.assertPropertyAccess(expense.property, actor);

    if (expense.status !== ExpenseStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved expenses can be marked as paid',
      );
    }

    const amount = Number(expense.amount ?? 0);

    if (amount <= 0) {
      throw new BadRequestException('Expense amount must be greater than 0');
    }

    const paymentChannel = this.normalizePaymentChannel(dto);
    const paymentProvider = this.normalizePaymentProvider(dto, paymentChannel);
    const reference = this.buildExpensePaymentReference(
      expense.id,
      dto,
      paymentChannel,
    );
    const paidAt = new Date();
    const paidByUserId = actor.userId;

    await this.prisma.$transaction(async (tx) => {
      const creditAccountId = await this.resolveExpenseCreditAccountId(tx, {
        id: expense.id,
        maintenanceRequestId: expense.maintenanceRequestId,
      });

      await this.recordInvestorExpenseLedger({
        tx,
        propertyId: expense.propertyId,
        totalAmount: amount,
        creditAccountId,
        reference,
        paymentChannel,
      });

      await tx.expense.update({
        where: { id: expenseId },
        data: {
          status: ExpenseStatus.PAID,
          paidAt,
          paidByUserId,
          paymentReference: reference,
          paymentChannel,
          paymentProvider,
          notes: dto.notes ?? expense.notes,
        },
      });

      if (expense.maintenanceRequestId && expense.maintenanceRequest) {
        const request = await tx.maintenanceRequest.findUnique({
          where: { id: expense.maintenanceRequestId },
          include: {
            assignedProvider: true,
            quotes: true,
          },
        });

        if (request) {
          const acceptedQuote = request.quotes.find(
            (q) => q.status === 'ACCEPTED',
          );

          const quoteAmount = Number(
            acceptedQuote?.totalAmount ??
              request.estimatedCost ??
              expense.amount ??
              0,
          );

          if (quoteAmount > 0 && request.assignedProviderId) {
            const payoutValues = this.calculateProviderPayout(quoteAmount);

            const existingPayout = await tx.providerPayout.findFirst({
              where: {
                requestId: request.id,
                providerId: request.assignedProviderId,
              },
            });

            if (existingPayout) {
              await tx.providerPayout.update({
                where: { id: existingPayout.id },
                data: {
                  totalAmount: payoutValues.totalAmount,
                  platformFee: payoutValues.platformFee,
                  providerEarning: payoutValues.providerEarning,
                  status:
                    existingPayout.status === PayoutStatus.COMPLETED
                      ? PayoutStatus.COMPLETED
                      : PayoutStatus.PENDING,
                  paymentChannel,
                  paymentProvider,
                  paymentReference: reference,
                  paidAt:
                    existingPayout.status === PayoutStatus.COMPLETED
                      ? paidAt
                      : existingPayout.paidAt,
                },
              });
            } else {
              await tx.providerPayout.create({
                data: {
                  providerId: request.assignedProviderId,
                  requestId: request.id,
                  totalAmount: payoutValues.totalAmount,
                  platformFee: payoutValues.platformFee,
                  providerEarning: payoutValues.providerEarning,
                  status: PayoutStatus.PENDING,
                  paymentChannel,
                  paymentProvider,
                  paymentReference: reference,
                  paidAt: null,
                },
              });
            }
          }

          await tx.maintenanceRequest.update({
            where: { id: request.id },
            data: {
              paidAt,
              paidByUserId,
              paymentReference: reference,
              paymentChannel,
              paymentProvider,
            },
          });
        }
      }

      await this.syncMaintenanceFromExpense(tx, expenseId);
    });

    return this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: this.expenseInclude,
    });
  }

  async getAdminExpenses(filters?: {
    propertyId?: string;
    status?: ExpenseStatus;
    category?: string;
  }) {
    const where: Prisma.ExpenseWhereInput = {
      ...(filters?.propertyId ? { propertyId: filters.propertyId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    };

    if (filters?.category) {
      where.category = filters.category as ExpenseCategory;
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: this.expenseInclude,
      orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
    });

    const propertyIds = filters?.propertyId
      ? [filters.propertyId]
      : (
          await this.prisma.property.findMany({
            select: { id: true },
          })
        ).map((property) => property.id);

    const maintenanceExpenses = await this.getPropertyMaintenanceExpenses(
      propertyIds,
      filters,
    );

    return this.sortExpenses([...expenses, ...maintenanceExpenses]);
  }

  async getManagerExpenses(
    managerId: string,
    filters?: {
      propertyId?: string;
      status?: ExpenseStatus;
      category?: string;
    },
  ) {
    const managedProperties = await this.prisma.property.findMany({
      where: {
        managerId,
        ...(filters?.propertyId ? { id: filters.propertyId } : {}),
      },
      select: { id: true },
    });

    const propertyIds = managedProperties.map((property) => property.id);

    if (propertyIds.length === 0) {
      return [];
    }

    const where: Prisma.ExpenseWhereInput = {
      propertyId: {
        in: propertyIds,
      },
      ...(filters?.status ? { status: filters.status } : {}),
    };

    if (filters?.category) {
      where.category = filters.category as ExpenseCategory;
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: this.expenseInclude,
      orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
    });

    const maintenanceExpenses = await this.getPropertyMaintenanceExpenses(
      propertyIds,
      filters,
    );

    return this.sortExpenses([...expenses, ...maintenanceExpenses]);
  }

  async getInvestorExpenses(
    investorId: string,
    filters?: {
      propertyId?: string;
      status?: ExpenseStatus;
      category?: string;
    },
  ) {
    const investorPropertyIds = await this.getInvestorPropertyIds(investorId);

    const propertyIds = filters?.propertyId
      ? investorPropertyIds.filter((id) => id === filters.propertyId)
      : investorPropertyIds;

    if (propertyIds.length === 0) {
      return [];
    }

    const where: Prisma.ExpenseWhereInput = {
      propertyId: {
        in: propertyIds,
      },
      ...(filters?.status ? { status: filters.status } : {}),
    };

    if (filters?.category) {
      where.category = filters.category as ExpenseCategory;
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: this.expenseInclude,
      orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
    });

    const maintenanceExpenses = await this.getPropertyMaintenanceExpenses(
      propertyIds,
      filters,
    );

    return this.sortExpenses([...expenses, ...maintenanceExpenses]);
  }

  async getResidentExpenses(
    userId: string,
    filters?: {
      propertyId?: string;
      status?: ExpenseStatus;
      category?: string;
    },
  ) {
    const maintenanceExpenses = await this.getResidentMaintenanceExpenses(
      userId,
      filters,
    );

    return this.sortExpenses(maintenanceExpenses);
  }

  async getExpenseById(expenseId: string, actor: Actor) {
    const expense = await this.getExpenseOrThrow(expenseId);

    if (actor.role === Role.RESIDENT) {
      const residentExpenses = await this.getResidentExpenses(actor.userId);
      const canAccess = residentExpenses.some((item) => item.id === expenseId);

      if (!canAccess) {
        throw new ForbiddenException('You do not have access to this expense');
      }

      return expense;
    }

    await this.assertPropertyAccess(expense.property, actor);
    return expense;
  }

  async getAdminExpenseSummary() {
    const expenses = await this.getAdminExpenses();
    return this.summarizeExpenses(expenses);
  }

  async getManagerExpenseSummary(managerId: string) {
    const expenses = await this.getManagerExpenses(managerId);
    const summary = this.summarizeExpenses(expenses);

    return {
      totalCount: summary.totalCount,
      totalExpenses: summary.totalExpenses,
      submittedAmount: summary.submittedAmount,
      approvedAmount: summary.approvedAmount,
      paidAmount: summary.paidAmount,
    };
  }

  async getInvestorExpenseSummary(investorId: string) {
    const expenses = await this.getInvestorExpenses(investorId);
    const summary = this.summarizeExpenses(expenses);

    return {
      totalCount: summary.totalCount,
      totalExpenses: summary.totalExpenses,
      pendingApprovalAmount: summary.pendingApprovalAmount,
      approvedAmount: summary.approvedAmount,
      paidAmount: summary.paidAmount,
    };
  }

  async getResidentExpenseSummary(userId: string) {
    const expenses = await this.getResidentExpenses(userId);
    const summary = this.summarizeExpenses(expenses);

    return {
      totalCount: summary.totalCount,
      totalExpenses: summary.totalExpenses,
      pendingApprovalAmount: summary.pendingApprovalAmount,
      approvedAmount: summary.paidAmount,
    };
  }
}