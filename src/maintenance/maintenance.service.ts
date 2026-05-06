import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MaintenanceStatus,
  DispatchStatus,
  QuoteStatus,
  PayoutStatus,
  MaintenancePaymentResponsibility,
  Prisma,
  Role,
  ExpenseStatus,
  NotificationType,
} from '@prisma/client';
import { DispatchService } from './dispatch.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LedgerService } from '../ledger/ledger.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ExpenseService } from '../expense/expense.service';

@Injectable()
export class MaintenanceService {
  constructor(
    private prisma: PrismaService,
    private dispatchService: DispatchService,
    private notificationsService: NotificationsService,
    private ledgerService: LedgerService,
    private expenseService: ExpenseService,
  ) {}

  private safeUserSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  } as const;

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

  private async createMaintenanceNotification(data: {
    userId?: string | null;
    title: string;
    message: string;
  }) {
    if (!data.userId) return null;

    return this.notificationsService.createNotification({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: NotificationType.MAINTENANCE,
    });
  }

  private fullInclude(): Prisma.MaintenanceRequestInclude {
    return {
      property: true,
      unit: true,
      resident: {
        include: {
          user: {
            select: this.safeUserSelect,
          },
        },
      },
      assignedProvider: {
        include: {
          user: {
            select: this.safeUserSelect,
          },
        },
      },
      photos: true,
      quotes: {
        include: {
          provider: {
            include: {
              user: {
                select: this.safeUserSelect,
              },
            },
          },
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      dispatches: {
        include: {
          provider: {
            include: {
              user: {
                select: this.safeUserSelect,
              },
            },
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
      },
      expenses: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      payouts: {
        include: {
          provider: {
            include: {
              user: {
                select: this.safeUserSelect,
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      reviews: {
        include: {
          resident: {
            include: {
              user: {
                select: this.safeUserSelect,
              },
            },
          },
          provider: {
            include: {
              user: {
                select: this.safeUserSelect,
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    };
  }

  private normalizeAmount(value: unknown) {
    return Number(value || 0);
  }

  private average(values: number[]) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private buildAdminMaintenanceWhere(filters?: {
    status?: string;
    propertyId?: string;
  }): Prisma.MaintenanceRequestWhereInput {
    const where: Prisma.MaintenanceRequestWhereInput = {};

    if (filters?.propertyId) {
      where.propertyId = filters.propertyId;
    }

    if (
      filters?.status &&
      Object.values(MaintenanceStatus).includes(
        filters.status as MaintenanceStatus,
      )
    ) {
      where.status = filters.status as MaintenanceStatus;
    }

    return where;
  }

  async getProviderIdForUser(userId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      throw new BadRequestException('Provider profile not found');
    }

    return provider.id;
  }

  private async getLinkedMaintenanceExpense(requestId: string) {
    return this.prisma.expense.findFirst({
      where: {
        maintenanceRequestId: requestId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private requiresPropertyApproval(
    responsibility: MaintenancePaymentResponsibility | null,
    propertyShare: number,
  ) {
    return (
      (responsibility === MaintenancePaymentResponsibility.PROPERTY ||
        responsibility === MaintenancePaymentResponsibility.SHARED) &&
      propertyShare > 0
    );
  }

  private requiresResidentCommitment(
    responsibility: MaintenancePaymentResponsibility | null,
    residentShare: number,
  ) {
    return (
      (responsibility === MaintenancePaymentResponsibility.RESIDENT ||
        responsibility === MaintenancePaymentResponsibility.SHARED) &&
      residentShare > 0
    );
  }

  private async isPropertyFinanciallyCleared(requestId: string) {
    const linkedExpense = await this.getLinkedMaintenanceExpense(requestId);

    return (
      !!linkedExpense &&
      (linkedExpense.status === ExpenseStatus.APPROVED ||
        linkedExpense.status === ExpenseStatus.PAID)
    );
  }

  private async isPropertyPaid(requestId: string) {
    const linkedExpense = await this.getLinkedMaintenanceExpense(requestId);

    return !!linkedExpense && linkedExpense.status === ExpenseStatus.PAID;
  }

  private async syncAcceptedQuoteStateForRequest(requestId: string) {
    const linkedExpense = await this.getLinkedMaintenanceExpense(requestId);

    if (!linkedExpense) {
      return;
    }

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        quotes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!request || request.quotes.length === 0) {
      return;
    }

    const existingAcceptedQuote = request.quotes.find(
      (quote) => quote.status === QuoteStatus.ACCEPTED,
    );

    if (existingAcceptedQuote) {
      return;
    }

    const linkedAmount = Number(linkedExpense.amount || 0);

    const quoteToAccept =
      request.quotes.find(
        (quote) =>
          quote.status === QuoteStatus.PENDING &&
          request.assignedProviderId &&
          quote.providerId === request.assignedProviderId &&
          Number(quote.totalAmount || 0) === linkedAmount,
      ) ||
      request.quotes.find(
        (quote) =>
          quote.status === QuoteStatus.PENDING &&
          Number(quote.totalAmount || 0) === linkedAmount,
      ) ||
      request.quotes.find(
        (quote) =>
          request.assignedProviderId &&
          quote.providerId === request.assignedProviderId,
      ) ||
      request.quotes[0];

    if (!quoteToAccept) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.maintenanceQuote.updateMany({
        where: {
          requestId,
          id: {
            not: quoteToAccept.id,
          },
          status: QuoteStatus.PENDING,
        },
        data: {
          status: QuoteStatus.REJECTED,
        },
      }),
      this.prisma.maintenanceQuote.update({
        where: { id: quoteToAccept.id },
        data: {
          status: QuoteStatus.ACCEPTED,
          acceptedAt: quoteToAccept.acceptedAt ?? new Date(),
        },
      }),
      this.prisma.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          assignedProviderId:
            request.assignedProviderId ?? quoteToAccept.providerId,
          estimatedCost:
            Number(request.estimatedCost || 0) > 0
              ? request.estimatedCost
              : quoteToAccept.totalAmount,
          propertyShare:
            Number(request.propertyShare || 0) > 0
              ? request.propertyShare
              : linkedExpense.amount,
          residentShare: request.residentShare,
          paymentResponsibility:
            request.paymentResponsibility ??
            MaintenancePaymentResponsibility.PROPERTY,
        },
      }),
    ]);
  }

  private async syncAcceptedQuoteStatesForRequests(requestIds: string[]) {
    const uniqueIds = [...new Set(requestIds.filter(Boolean))];

    for (const requestId of uniqueIds) {
      await this.syncAcceptedQuoteStateForRequest(requestId);
    }
  }

  private async syncApprovalState(requestId: string) {
    await this.syncAcceptedQuoteStateForRequest(requestId);

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        property: true,
      },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    const propertyShare = Number(request.propertyShare || 0);
    const residentShare = Number(request.residentShare || 0);

    const needsProperty = this.requiresPropertyApproval(
      request.paymentResponsibility,
      propertyShare,
    );

    const needsResident = this.requiresResidentCommitment(
      request.paymentResponsibility,
      residentShare,
    );

    let propertyReady = true;
    let residentReady = true;

    if (needsProperty) {
      propertyReady = await this.isPropertyFinanciallyCleared(request.id);
    }

    if (needsResident) {
      residentReady = true;
    }

    const shouldApprove = propertyReady && residentReady;

    const nextStatus = shouldApprove
      ? MaintenanceStatus.APPROVED
      : MaintenanceStatus.QUOTED;

    if (request.status !== nextStatus) {
      await this.prisma.maintenanceRequest.update({
        where: { id: request.id },
        data: {
          status: nextStatus,
        },
      });
    }

    return this.prisma.maintenanceRequest.findUnique({
      where: { id: request.id },
      include: this.fullInclude(),
    });
  }

  private async createOrSubmitPropertyExpenseForQuote(
    requestId: string,
    amount: number,
  ) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        property: true,
        unit: true,
      },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    if (!request.property?.managerId) {
      throw new BadRequestException(
        'Property manager is required for property-funded maintenance',
      );
    }

    const existing = await this.getLinkedMaintenanceExpense(requestId);

    if (!existing) {
      const created = await this.expenseService.createExpense(
        {
          propertyId: request.propertyId!,
          maintenanceRequestId: request.id,
          title: request.title,
          description: request.description,
          category: 'MAINTENANCE' as any,
          amount,
          expenseDate: new Date(),
          vendorName: undefined,
        } as any,
        {
          userId: request.property.managerId,
          role: Role.MANAGER,
        },
      );

      const submitted = await this.expenseService.submitExpense(created.id, {
        userId: request.property.managerId,
        role: Role.MANAGER,
      });

      await this.syncAcceptedQuoteStateForRequest(requestId);

      return submitted;
    }

    if (
      existing.status === ExpenseStatus.DRAFT ||
      existing.status === ExpenseStatus.REJECTED
    ) {
      await this.expenseService.updateExpense(
        existing.id,
        {
          amount,
          title: request.title,
          description: request.description,
          expenseDate: new Date(),
        } as any,
        {
          userId: request.property.managerId,
          role: Role.MANAGER,
        },
      );

      const submitted = await this.expenseService.submitExpense(existing.id, {
        userId: request.property.managerId,
        role: Role.MANAGER,
      });

      await this.syncAcceptedQuoteStateForRequest(requestId);

      return submitted;
    }

    await this.syncAcceptedQuoteStateForRequest(requestId);

    return existing;
  }

  private async syncLinkedPropertyExpenseOnCompletion(
    requestId: string,
    amount: number,
  ) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        property: true,
      },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    const propertyShare = Number(request.propertyShare || 0);
    const needsPropertyExpense = this.requiresPropertyApproval(
      request.paymentResponsibility,
      propertyShare,
    );

    if (!needsPropertyExpense) {
      return null;
    }

    let linkedExpense = await this.getLinkedMaintenanceExpense(requestId);

    if (!linkedExpense) {
      const createdOrSubmitted =
        await this.createOrSubmitPropertyExpenseForQuote(
          requestId,
          propertyShare || amount,
        );

      if (!createdOrSubmitted) {
        throw new BadRequestException(
          'Failed to create linked maintenance expense',
        );
      }

      linkedExpense = await this.prisma.expense.findUnique({
        where: { id: createdOrSubmitted.id },
      });
    }

    if (!linkedExpense) {
      throw new BadRequestException(
        'Failed to create or retrieve linked maintenance expense',
      );
    }

    const updateData: Prisma.ExpenseUpdateInput = {
      amount: propertyShare || amount,
      title: request.title,
      description: request.description,
      expenseDate: new Date(),
    };

    if (
      linkedExpense.status === ExpenseStatus.DRAFT ||
      linkedExpense.status === ExpenseStatus.REJECTED
    ) {
      await this.expenseService.updateExpense(
        linkedExpense.id,
        updateData as any,
        {
          userId: request.property!.managerId!,
          role: Role.MANAGER,
        },
      );

      linkedExpense = await this.expenseService.submitExpense(linkedExpense.id, {
        userId: request.property!.managerId!,
        role: Role.MANAGER,
      });
    } else {
      linkedExpense = await this.prisma.expense.update({
        where: { id: linkedExpense.id },
        data: updateData,
      });
    }

    await this.syncAcceptedQuoteStateForRequest(requestId);

    return linkedExpense;
  }

  async createRequestForUser(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid user');
    }

    if (user.role === Role.RESIDENT) {
      const resident = await this.prisma.resident.findUnique({
        where: { userId },
        include: {
          unit: true,
        },
      });

      if (!resident) {
        throw new BadRequestException('Resident profile not found');
      }

      if (data.residentId && data.residentId !== resident.id) {
        throw new ForbiddenException('You can only create requests for yourself');
      }

      if (data.unitId && resident.unitId && data.unitId !== resident.unitId) {
        throw new ForbiddenException('You can only create requests for your unit');
      }

      const payload = {
        ...data,
        residentId: resident.id,
        unitId: data.unitId || resident.unitId,
        propertyId: data.propertyId || resident.unit?.propertyId,
      };

      if (!payload.unitId) {
        throw new BadRequestException('Resident unit is not assigned');
      }

      if (!payload.propertyId) {
        throw new BadRequestException('Resident property is not assigned');
      }

      return this.createRequest(payload);
    }

    return this.createRequest(data);
  }

  async createRequest(data: any) {
    const existing = await this.prisma.maintenanceRequest.findFirst({
      where: {
        unitId: data.unitId,
        title: data.title,
        status: {
          in: [
            MaintenanceStatus.PENDING,
            MaintenanceStatus.ASSIGNED,
            MaintenanceStatus.IN_PROGRESS,
            MaintenanceStatus.APPROVED,
            MaintenanceStatus.QUOTED,
            MaintenanceStatus.INSPECTION_REQUIRED,
          ],
        },
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 10),
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Similar request already exists.');
    }

    const request = await this.prisma.maintenanceRequest.create({
      data: {
        ...data,
        status: MaintenanceStatus.PENDING,
      },
      include: this.fullInclude(),
    });

    if (data.category) {
      await this.dispatchService.smartDispatch(request.id, data.category);
    }

    if (request.property?.managerId) {
      await this.createMaintenanceNotification({
        userId: request.property.managerId,
        title: 'New maintenance request',
        message: `${request.title} has been submitted${request.unit?.number ? ` for Unit ${request.unit.number}` : ''}.`,
      });
    }

    return this.prisma.maintenanceRequest.findUnique({
      where: { id: request.id },
      include: this.fullInclude(),
    });
  }

  async getManagerRequests(managerId: string) {
    const requestIds = await this.prisma.maintenanceRequest.findMany({
      where: {
        property: {
          managerId,
        },
      },
      select: {
        id: true,
      },
    });

    await this.syncAcceptedQuoteStatesForRequests(
      requestIds.map((request) => request.id),
    );

    return this.prisma.maintenanceRequest.findMany({
      where: {
        property: {
          managerId,
        },
      },
      include: this.fullInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getResidentRequests(userId: string) {
    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      select: {
        id: true,
      },
    });

    if (!resident) {
      throw new BadRequestException('Resident profile not found');
    }

    const requestIds = await this.prisma.maintenanceRequest.findMany({
      where: {
        residentId: resident.id,
      },
      select: {
        id: true,
      },
    });

    await this.syncAcceptedQuoteStatesForRequests(
      requestIds.map((request) => request.id),
    );

    return this.prisma.maintenanceRequest.findMany({
      where: {
        residentId: resident.id,
      },
      include: this.fullInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAdminRequests(filters?: { status?: string; propertyId?: string }) {
    const requestIds = await this.prisma.maintenanceRequest.findMany({
      where: this.buildAdminMaintenanceWhere(filters),
      select: {
        id: true,
      },
    });

    await this.syncAcceptedQuoteStatesForRequests(
      requestIds.map((request) => request.id),
    );

    return this.prisma.maintenanceRequest.findMany({
      where: this.buildAdminMaintenanceWhere(filters),
      include: this.fullInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPropertyRequests(propertyId: string) {
    const requestIds = await this.prisma.maintenanceRequest.findMany({
      where: { propertyId },
      select: {
        id: true,
      },
    });

    await this.syncAcceptedQuoteStatesForRequests(
      requestIds.map((request) => request.id),
    );

    return this.prisma.maintenanceRequest.findMany({
      where: { propertyId },
      include: this.fullInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async submitQuote(data: CreateQuoteDto & { providerId: string }) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: data.providerId },
    });

    if (!provider) {
      throw new BadRequestException('Invalid providerId');
    }

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: data.requestId },
    });

    if (!request) {
      throw new BadRequestException('Invalid requestId');
    }

    const quote = await this.prisma.maintenanceQuote.create({
      data: {
        requestId: data.requestId,
        providerId: data.providerId,
        totalAmount: data.amount,
        laborCost: data.laborCost,
        materialsCost: data.materialsCost,
        estimatedDurationHours: data.estimatedDurationHours,
        notes: data.notes,
      },
      include: {
        provider: {
          include: {
            user: {
              select: this.safeUserSelect,
            },
          },
        },
        items: true,
      },
    });

    const updatedRequest = await this.prisma.maintenanceRequest.update({
      where: { id: data.requestId },
      data: {
        status: MaintenanceStatus.QUOTED,
        assignedProviderId: data.providerId,
        estimatedCost: data.amount,
      },
      include: {
        property: true,
      },
    });

    if (updatedRequest.property?.managerId) {
      await this.createMaintenanceNotification({
        userId: updatedRequest.property.managerId,
        title: 'New maintenance quote',
        message: `A quote of UGX ${Number(data.amount || 0).toLocaleString('en-UG')} was submitted for ${updatedRequest.title}.`,
      });
    }

    return quote;
  }

  async submitQuoteForProvider(userId: string, data: CreateQuoteDto) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new BadRequestException('Provider profile not found');
    }

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: data.requestId },
    });

    if (!request) {
      throw new BadRequestException('Invalid requestId');
    }

    const dispatch = await this.prisma.maintenanceDispatch.findUnique({
      where: {
        requestId_providerId: {
          requestId: data.requestId,
          providerId: provider.id,
        },
      },
    });

    if (!dispatch) {
      throw new ForbiddenException('You can only quote a request dispatched to you');
    }

    const existingQuote = await this.prisma.maintenanceQuote.findFirst({
      where: {
        requestId: data.requestId,
        providerId: provider.id,
      },
    });

    if (existingQuote) {
      throw new BadRequestException('You have already submitted a quote for this request');
    }

    const quote = await this.prisma.maintenanceQuote.create({
      data: {
        requestId: data.requestId,
        providerId: provider.id,
        totalAmount: data.amount,
        laborCost: data.laborCost,
        materialsCost: data.materialsCost,
        estimatedDurationHours: data.estimatedDurationHours,
        notes: data.notes,
      },
      include: {
        provider: {
          include: {
            user: {
              select: this.safeUserSelect,
            },
          },
        },
        items: true,
      },
    });

    const [, updatedRequest] = await this.prisma.$transaction([
      this.prisma.maintenanceDispatch.update({
        where: {
          requestId_providerId: {
            requestId: data.requestId,
            providerId: provider.id,
          },
        },
        data: {
          status: DispatchStatus.QUOTED,
          viewedAt: dispatch.viewedAt ?? new Date(),
          respondedAt: new Date(),
        },
      }),
      this.prisma.maintenanceRequest.update({
        where: { id: data.requestId },
        data: {
          status: MaintenanceStatus.QUOTED,
          assignedProviderId: provider.id,
          estimatedCost: data.amount,
        },
        include: {
          property: true,
        },
      }),
    ]);

    if (updatedRequest.property?.managerId) {
      await this.createMaintenanceNotification({
        userId: updatedRequest.property.managerId,
        title: 'New maintenance quote',
        message: `A provider submitted a quote of UGX ${Number(data.amount || 0).toLocaleString('en-UG')} for ${updatedRequest.title}.`,
      });
    }

    return quote;
  }

  async getQuotes(requestId: string) {
    await this.syncAcceptedQuoteStateForRequest(requestId);

    return this.prisma.maintenanceQuote.findMany({
      where: { requestId },
      include: {
        provider: {
          include: {
            user: {
              select: this.safeUserSelect,
            },
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async acceptQuote(quoteId: string) {
    const quote = await this.prisma.maintenanceQuote.findUnique({
      where: { id: quoteId },
      include: {
        request: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!quote) {
      throw new BadRequestException('Quote not found');
    }

    if (!quote.request) {
      throw new BadRequestException('Maintenance request not found');
    }

    const allowedQuoteWorkflowStatuses = new Set<MaintenanceStatus>([
      MaintenanceStatus.QUOTED,
      MaintenanceStatus.INSPECTION_REQUIRED,
      MaintenanceStatus.ASSIGNED,
    ]);

    if (!allowedQuoteWorkflowStatuses.has(quote.request.status)) {
      throw new BadRequestException(
        'Quote can only be accepted from an active quote workflow',
      );
    }

    const responsibility =
      quote.request.paymentResponsibility ||
      MaintenancePaymentResponsibility.PROPERTY;

    const totalAmount = Number(quote.totalAmount || 0);

    let propertyShare = Number(quote.request.propertyShare || 0);
    let residentShare = Number(quote.request.residentShare || 0);

    if (responsibility === MaintenancePaymentResponsibility.PROPERTY) {
      propertyShare = totalAmount;
      residentShare = 0;
    } else if (responsibility === MaintenancePaymentResponsibility.RESIDENT) {
      propertyShare = 0;
      residentShare = totalAmount;
    } else if (responsibility === MaintenancePaymentResponsibility.SHARED) {
      const existingTotal =
        Number(quote.request.propertyShare || 0) +
        Number(quote.request.residentShare || 0);

      if (existingTotal !== totalAmount) {
        throw new BadRequestException(
          'Shared payment must be split first so property share and resident share equal the accepted quote total',
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.maintenanceQuote.updateMany({
        where: {
          requestId: quote.requestId,
          NOT: {
            id: quoteId,
          },
          status: QuoteStatus.PENDING,
        },
        data: {
          status: QuoteStatus.REJECTED,
        },
      }),
      this.prisma.maintenanceQuote.update({
        where: { id: quoteId },
        data: {
          status: QuoteStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      }),
      this.prisma.maintenanceRequest.update({
        where: { id: quote.requestId },
        data: {
          assignedProviderId: quote.providerId,
          status: MaintenanceStatus.QUOTED,
          estimatedCost: totalAmount,
          propertyShare,
          residentShare,
          paymentResponsibility: responsibility,
        },
      }),
    ]);

    if (this.requiresPropertyApproval(responsibility, propertyShare)) {
      await this.createOrSubmitPropertyExpenseForQuote(
        quote.requestId,
        propertyShare,
      );
    }

    const acceptedProvider = await this.prisma.serviceProvider.findUnique({
      where: { id: quote.providerId },
      select: { userId: true },
    });

    await this.createMaintenanceNotification({
      userId: acceptedProvider?.userId,
      title: 'Quote accepted',
      message: `Your quote for ${quote.request.title} has been accepted.`,
    });

    return this.syncApprovalState(quote.requestId);
  }

  async analyzeQuotePricing(requestId: string, quoteAmount: number) {
    const currentRequest = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      select: { category: true },
    });

    if (!currentRequest) {
      throw new BadRequestException('Request not found');
    }

    if (!currentRequest.category) {
      return {
        message: 'Request category is missing',
      };
    }

    const similarRequests = await this.prisma.maintenanceRequest.findMany({
      where: {
        category: currentRequest.category,
        status: MaintenanceStatus.COMPLETED,
        estimatedCost: {
          not: null,
        },
      },
      select: {
        estimatedCost: true,
      },
    });

    if (similarRequests.length < 3) {
      return {
        message: 'Not enough data for analysis',
      };
    }

    const prices = similarRequests.map((r) => Number(r.estimatedCost || 0));
    const avg = prices.reduce((sum, val) => sum + val, 0) / prices.length;
    const deviation = ((quoteAmount - avg) / avg) * 100;

    return {
      averagePrice: avg,
      quoteAmount,
      deviation: Math.round(deviation),
      flag:
        deviation > 30
          ? 'OVERPRICED'
          : deviation < -30
            ? 'UNDERPRICED'
            : 'NORMAL',
    };
  }

  async detectProviderFraud(providerId: string) {
    const quotes = await this.prisma.maintenanceQuote.findMany({
      where: {
        providerId,
      },
      include: {
        request: true,
      },
    });

    if (quotes.length < 5) {
      return {
        message: 'Not enough data',
      };
    }

    let suspiciousCount = 0;

    for (const quote of quotes) {
      const analysis = await this.analyzeQuotePricing(
        quote.requestId,
        quote.totalAmount,
      );

      if ('flag' in analysis && analysis.flag === 'OVERPRICED') {
        suspiciousCount++;
      }
    }

    const ratio = suspiciousCount / quotes.length;

    return {
      totalQuotes: quotes.length,
      suspiciousQuotes: suspiciousCount,
      fraudScore: ratio,
      riskLevel:
        ratio > 0.6 ? 'HIGH' : ratio > 0.3 ? 'MEDIUM' : 'LOW',
    };
  }

  async getProviderDispatches(userId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new BadRequestException('Provider profile not found');
    }

    return this.prisma.maintenanceDispatch.findMany({
      where: {
        providerId: provider.id,
      },
      include: {
        request: {
          include: {
            property: true,
            unit: true,
            resident: {
              include: {
                user: {
                  select: this.safeUserSelect,
                },
              },
            },
            assignedProvider: {
              include: {
                user: {
                  select: this.safeUserSelect,
                },
              },
            },
          },
        },
        provider: {
          include: {
            user: {
              select: this.safeUserSelect,
            },
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });
  }

  async viewDispatch(requestId: string, providerId: string) {
    return this.prisma.maintenanceDispatch.update({
      where: {
        requestId_providerId: { requestId, providerId },
      },
      data: {
        status: DispatchStatus.VIEWED,
        viewedAt: new Date(),
      },
    });
  }

  async acceptDispatch(requestId: string, providerId: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    await this.prisma.maintenanceDispatch.update({
      where: {
        requestId_providerId: { requestId, providerId },
      },
      data: {
        status: DispatchStatus.QUOTED,
        viewedAt: new Date(),
        respondedAt: new Date(),
      },
    });

    await this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        assignedProviderId: providerId,
        status:
          request.status === MaintenanceStatus.PENDING
            ? MaintenanceStatus.ASSIGNED
            : request.status,
      },
    });

    return this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: this.fullInclude(),
    });
  }

  async declineDispatch(requestId: string, providerId: string) {
    return this.prisma.maintenanceDispatch.update({
      where: {
        requestId_providerId: { requestId, providerId },
      },
      data: {
        status: DispatchStatus.DECLINED,
        respondedAt: new Date(),
      },
    });
  }

  async assignProvider(requestId: string, providerId: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    if (request.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot assign provider to a completed request',
      );
    }

    const updatedRequest = await this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        assignedProviderId: providerId,
        status:
          request.status === MaintenanceStatus.PENDING
            ? MaintenanceStatus.ASSIGNED
            : request.status,
      },
      include: this.fullInclude(),
    });

    await this.createMaintenanceNotification({
      userId: updatedRequest.assignedProvider?.userId,
      title: 'New job assigned',
      message: `You have been assigned to ${updatedRequest.title}.`,
    });

    if (updatedRequest.resident?.userId) {
      await this.createMaintenanceNotification({
        userId: updatedRequest.resident.userId,
        title: 'Provider assigned',
        message: `A provider has been assigned to your maintenance request: ${updatedRequest.title}.`,
      });
    }

    return updatedRequest;
  }

  async scheduleInspection(requestId: string, date: Date) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    if (request.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot schedule inspection for a completed request',
      );
    }

    const allowedInspectionStatuses = new Set<MaintenanceStatus>([
      MaintenanceStatus.PENDING,
      MaintenanceStatus.ASSIGNED,
      MaintenanceStatus.INSPECTION_REQUIRED,
      MaintenanceStatus.QUOTED,
    ]);

    if (!allowedInspectionStatuses.has(request.status)) {
      throw new BadRequestException(
        'Inspection can only be scheduled before work starts',
      );
    }

    const updatedRequest = await this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        inspectionScheduledAt: date,
        status: MaintenanceStatus.INSPECTION_REQUIRED,
      },
      include: this.fullInclude(),
    });

    if (updatedRequest.resident?.userId) {
      await this.createMaintenanceNotification({
        userId: updatedRequest.resident.userId,
        title: 'Inspection scheduled',
        message: `Inspection has been scheduled for ${updatedRequest.title}.`,
      });
    }

    return updatedRequest;
  }

  async setPaymentResponsibility(
    requestId: string,
    responsibility: MaintenancePaymentResponsibility,
  ) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    if (
      request.status === MaintenanceStatus.COMPLETED ||
      request.status === MaintenanceStatus.IN_PROGRESS
    ) {
      throw new BadRequestException('Cannot edit responsibility after work begins');
    }

    const estimatedCost = Number(request.estimatedCost || 0);

    return this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        paymentResponsibility: responsibility,
        propertyShare:
          responsibility === MaintenancePaymentResponsibility.PROPERTY
            ? estimatedCost
            : responsibility === MaintenancePaymentResponsibility.RESIDENT
              ? 0
              : request.propertyShare,
        residentShare:
          responsibility === MaintenancePaymentResponsibility.RESIDENT
            ? estimatedCost
            : responsibility === MaintenancePaymentResponsibility.PROPERTY
              ? 0
              : request.residentShare,
      },
      include: this.fullInclude(),
    });
  }

  async setSplitPayment(
    requestId: string,
    propertyShare: number,
    residentShare: number,
  ) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    const total = Number(request.estimatedCost || 0);

    if (propertyShare + residentShare !== total) {
      throw new BadRequestException('Split must equal total estimated cost');
    }

    return this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        paymentResponsibility: MaintenancePaymentResponsibility.SHARED,
        propertyShare,
        residentShare,
      },
      include: this.fullInclude(),
    });
  }

  async recordPayment(
    requestId: string,
    paidByUserId: string,
    paymentReference: string,
  ) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        resident: true,
      },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    if (!request.paymentResponsibility) {
      throw new BadRequestException('Set responsibility first');
    }

    const residentMustPay = this.requiresResidentCommitment(
      request.paymentResponsibility,
      Number(request.residentShare || 0),
    );

    if (!residentMustPay) {
      throw new BadRequestException('This request does not require resident payment');
    }

    if (request.status !== MaintenanceStatus.COMPLETED) {
      throw new BadRequestException(
        'Resident payment can only be recorded after completion confirmation',
      );
    }

    const updatedRequest = await this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        paidByUserId,
        paidAt: new Date(),
        paymentReference,
      },
      include: this.fullInclude(),
    });

    await this.createMaintenanceNotification({
      userId: updatedRequest.property?.managerId,
      title: 'Resident maintenance payment recorded',
      message: `Resident payment has been recorded for ${updatedRequest.title}.`,
    });

    return updatedRequest;
  }

  async scheduleWork(id: string, date: Date) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    if (request.status !== MaintenanceStatus.APPROVED) {
      throw new BadRequestException(
        'Work can only be scheduled after all required approvals are completed',
      );
    }

    const updatedRequest = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        workScheduledAt: date,
      },
      include: this.fullInclude(),
    });

    if (updatedRequest.resident?.userId) {
      await this.createMaintenanceNotification({
        userId: updatedRequest.resident.userId,
        title: 'Repair scheduled',
        message: `Work has been scheduled for ${updatedRequest.title}.`,
      });
    }

    await this.createMaintenanceNotification({
      userId: updatedRequest.assignedProvider?.userId,
      title: 'Repair scheduled',
      message: `Work has been scheduled for ${updatedRequest.title}.`,
    });

    return updatedRequest;
  }

  async startRepair(requestId: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    if (request.status !== MaintenanceStatus.APPROVED) {
      throw new BadRequestException('Request is not fully approved yet');
    }

    if (!request.paymentResponsibility) {
      throw new BadRequestException('Set payment responsibility first');
    }

    if (!request.workScheduledAt) {
      throw new BadRequestException('Schedule work first');
    }

    const propertyShare = Number(request.propertyShare || 0);

    if (
      this.requiresPropertyApproval(
        request.paymentResponsibility,
        propertyShare,
      )
    ) {
      const propertyReady = await this.isPropertyFinanciallyCleared(requestId);

      if (!propertyReady) {
        throw new BadRequestException('Property side is not approved yet');
      }
    }

    const updatedRequest = await this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: MaintenanceStatus.IN_PROGRESS,
      },
      include: this.fullInclude(),
    });

    if (updatedRequest.resident?.userId) {
      await this.createMaintenanceNotification({
        userId: updatedRequest.resident.userId,
        title: 'Repair started',
        message: `Work has started on ${updatedRequest.title}.`,
      });
    }

    return updatedRequest;
  }

  async completeRepair(requestId: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    if (request.status !== MaintenanceStatus.IN_PROGRESS) {
      throw new BadRequestException('Repair must be in progress');
    }

    if (!request.assignedProviderId) {
      throw new BadRequestException('Provider must be assigned');
    }

    if (request.workCompletedAt) {
      throw new BadRequestException('Work has already been marked finished');
    }

    const updatedRequest = await this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        workCompletedAt: new Date(),
      },
      include: this.fullInclude(),
    });

    if (updatedRequest.resident?.userId) {
      await this.createMaintenanceNotification({
        userId: updatedRequest.resident.userId,
        title: 'Repair ready for confirmation',
        message: `${updatedRequest.title} has been marked finished. Please confirm completion.`,
      });
    }

    return updatedRequest;
  }

  async confirmCompletionByResident(requestId: string, userId: string) {
    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!resident) {
      throw new BadRequestException('Resident profile not found');
    }

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        quotes: true,
        property: true,
      },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    if (request.residentId !== resident.id) {
      throw new ForbiddenException('You can only confirm your own maintenance request');
    }

    if (!request.workCompletedAt) {
      throw new BadRequestException('Work has not been marked finished yet');
    }

    if (request.status !== MaintenanceStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Request is not in the correct state for confirmation',
      );
    }

    await this.syncAcceptedQuoteStateForRequest(requestId);

    const refreshedRequest = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        quotes: true,
      },
    });

    const acceptedQuote = refreshedRequest?.quotes.find(
      (q) => q.status === QuoteStatus.ACCEPTED,
    );

    if (!acceptedQuote) {
      throw new BadRequestException('Accepted quote required');
    }

    if (!request.assignedProviderId) {
      throw new BadRequestException('Assigned provider required');
    }

    const amount = Number(acceptedQuote.totalAmount || 0);

    if (amount <= 0) {
      throw new BadRequestException(
        'Accepted quote amount must be greater than 0',
      );
    }

    await this.syncLinkedPropertyExpenseOnCompletion(requestId, amount);

    const payoutValues = this.calculateProviderPayout(amount);

    const existingPayout = await this.prisma.providerPayout.findFirst({
      where: {
        requestId,
        providerId: request.assignedProviderId,
      },
    });

    await this.prisma.$transaction(async (tx) => {
      if (!existingPayout) {
        await tx.providerPayout.create({
          data: {
            providerId: request.assignedProviderId!,
            requestId,
            totalAmount: payoutValues.totalAmount,
            platformFee: payoutValues.platformFee,
            providerEarning: payoutValues.providerEarning,
            status: PayoutStatus.PENDING,
          },
        });
      } else if (existingPayout.status !== PayoutStatus.COMPLETED) {
        await tx.providerPayout.update({
          where: { id: existingPayout.id },
          data: {
            totalAmount: payoutValues.totalAmount,
            platformFee: payoutValues.platformFee,
            providerEarning: payoutValues.providerEarning,
            status: PayoutStatus.PENDING,
          },
        });
      }

      await tx.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          status: MaintenanceStatus.COMPLETED,
        },
      });
    });

    const completedRequest = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: this.fullInclude(),
    });

    if (completedRequest) {
      await this.createMaintenanceNotification({
        userId: completedRequest.property?.managerId,
        title: 'Maintenance completed',
        message: `${completedRequest.title} has been confirmed completed by the resident.`,
      });

      await this.createMaintenanceNotification({
        userId: completedRequest.assignedProvider?.userId,
        title: 'Job completed',
        message: `${completedRequest.title} has been confirmed completed.`,
      });
    }

    return completedRequest;
  }

  async markProviderPayoutPaid(requestId: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        property: true,
        assignedProvider: {
          include: {
            user: {
              select: this.safeUserSelect,
            },
          },
        },
      },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    if (!request.assignedProviderId) {
      throw new BadRequestException('Assigned provider required');
    }

    if (request.status !== MaintenanceStatus.COMPLETED) {
      throw new BadRequestException(
        'Provider payout can only be released after resident completion confirmation',
      );
    }

    const payout = await this.prisma.providerPayout.findFirst({
      where: {
        requestId,
        providerId: request.assignedProviderId,
      },
    });

    if (!payout) {
      throw new BadRequestException('Provider payout not found');
    }

    if (payout.status === PayoutStatus.COMPLETED) {
      return payout;
    }

    const responsibility = request.paymentResponsibility;
    const propertyShare = Number(request.propertyShare || 0);
    const residentShare = Number(request.residentShare || 0);

    if (
      this.requiresPropertyApproval(responsibility, propertyShare) &&
      !(await this.isPropertyPaid(requestId))
    ) {
      throw new BadRequestException(
        'Property-funded portion must be marked paid before provider payout',
      );
    }

    if (
      this.requiresResidentCommitment(responsibility, residentShare) &&
      !request.paidAt
    ) {
      throw new BadRequestException(
        'Resident-funded portion must be paid before provider payout',
      );
    }

    const propertyAccount = await this.prisma.account.findFirst({
      where: {
        propertyId: request.propertyId,
      },
      select: {
        id: true,
      },
    });

    if (!propertyAccount) {
      throw new BadRequestException('Property account not found');
    }

    const providerAccount = await this.prisma.account.findFirst({
      where: {
        userId: request.assignedProvider?.userId,
      },
      select: {
        id: true,
      },
    });

    if (!providerAccount) {
      throw new BadRequestException('Provider account not found');
    }

    const amount = Number(payout.providerEarning || 0);

    if (amount <= 0) {
      throw new BadRequestException('Provider earning must be greater than 0');
    }

    const reference = `MAINT-PAYOUT-${request.id}`;

    await this.prisma.$transaction(async (tx) => {
      await this.ledgerService.recordDoubleEntry({
        debitAccountId: propertyAccount.id,
        creditAccountId: providerAccount.id,
        amount,
        source: 'PROVIDER_PAYOUT',
        reference,
        propertyId: request.propertyId,
        tx,
      });

      await tx.providerPayout.update({
        where: { id: payout.id },
        data: {
          status: PayoutStatus.COMPLETED,
        },
      });
    });

    await this.createMaintenanceNotification({
      userId: request.assignedProvider?.userId,
      title: 'Provider payout released',
      message: `Your payout for ${request.title} has been released.`,
    });

    await this.createMaintenanceNotification({
      userId: request.property?.managerId,
      title: 'Provider payout completed',
      message: `Provider payout for ${request.title} has been completed.`,
    });

    return this.prisma.providerPayout.findUnique({
      where: { id: payout.id },
      include: {
        provider: {
          include: {
            user: {
              select: this.safeUserSelect,
            },
          },
        },
        request: {
          include: {
            property: true,
            unit: true,
          },
        },
      },
    });
  }

  async rateProviderByUser(
    requestId: string,
    userId: string,
    rating: number,
    comment?: string,
  ) {
    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      select: {
        id: true,
      },
    });

    if (!resident) {
      throw new BadRequestException('Resident profile not found');
    }

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request?.assignedProviderId) {
      throw new BadRequestException('No provider assigned');
    }

    if (request.residentId !== resident.id) {
      throw new ForbiddenException('You can only rate your own maintenance job');
    }

    if (request.status !== MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Can only rate completed jobs');
    }

    return this.prisma.serviceProviderReview.create({
      data: {
        providerId: request.assignedProviderId,
        requestId,
        residentId: resident.id,
        rating,
        comment,
      },
    });
  }

  async getAnalyticsDashboard(propertyId: string) {
    const total = await this.prisma.maintenanceRequest.count({
      where: { propertyId },
    });

    return { total };
  }

  async getPlatformMaintenanceAnalytics() {
    const [
      requests,
      payouts,
      expenses,
      providerReviews,
      quotes,
      dispatches,
    ] = await Promise.all([
      this.prisma.maintenanceRequest.findMany({
        include: {
          property: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
        },
      }),
      this.prisma.providerPayout.findMany({
        include: {
          provider: {
            include: {
              user: {
                select: this.safeUserSelect,
              },
            },
          },
          request: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.expense.findMany({
        where: {
          maintenanceRequestId: {
            not: null,
          },
        },
      }),
      this.prisma.serviceProviderReview.findMany(),
      this.prisma.maintenanceQuote.findMany(),
      this.prisma.maintenanceDispatch.findMany(),
    ]);

    const totalRequests = requests.length;

    const statusCounts = requests.reduce<Record<string, number>>((acc, request) => {
      const key = request.status;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const openStatuses = new Set<MaintenanceStatus>([
      MaintenanceStatus.PENDING,
      MaintenanceStatus.ASSIGNED,
      MaintenanceStatus.QUOTED,
      MaintenanceStatus.INSPECTION_REQUIRED,
      MaintenanceStatus.APPROVED,
      MaintenanceStatus.IN_PROGRESS,
    ]);

    const openRequests = requests.filter((request) =>
      openStatuses.has(request.status),
    ).length;

    const completedRequests = requests.filter(
      (request) => request.status === MaintenanceStatus.COMPLETED,
    ).length;

    const inProgressRequests = requests.filter(
      (request) => request.status === MaintenanceStatus.IN_PROGRESS,
    ).length;

    const avgCompletionHours = this.average(
      requests
        .filter(
          (request) =>
            request.status === MaintenanceStatus.COMPLETED &&
            request.workCompletedAt,
        )
        .map((request) => {
          const end = request.workCompletedAt || request.updatedAt;
          return (
            (end.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60)
          );
        }),
    );

    const quoteCount = quotes.length;
    const acceptedQuoteCount = quotes.filter(
      (quote) => quote.status === QuoteStatus.ACCEPTED,
    ).length;

    const quoteAcceptanceRate = quoteCount
      ? (acceptedQuoteCount / quoteCount) * 100
      : 0;

    const dispatchCount = dispatches.length;
    const acceptedDispatchCount = dispatches.filter(
      (dispatch) =>
        dispatch.status === DispatchStatus.QUOTED ||
        dispatch.status === DispatchStatus.VIEWED,
    ).length;

    const completedPayoutCount = payouts.filter(
      (payout) => payout.status === PayoutStatus.COMPLETED,
    ).length;

    const pendingPayoutCount = payouts.filter(
      (payout) => payout.status === PayoutStatus.PENDING,
    ).length;

    const totalPayoutAmount = payouts.reduce(
      (sum, payout) => sum + this.normalizeAmount(payout.totalAmount),
      0,
    );

    const totalProviderEarning = payouts.reduce(
      (sum, payout) => sum + this.normalizeAmount(payout.providerEarning),
      0,
    );

    const totalPlatformFee = payouts.reduce(
      (sum, payout) => sum + this.normalizeAmount(payout.platformFee),
      0,
    );

    const linkedExpenseAmount = expenses.reduce(
      (sum, expense) => sum + this.normalizeAmount(expense.amount),
      0,
    );

    const avgRating = this.average(
      providerReviews.map((review) => this.normalizeAmount(review.rating)),
    );

    const propertyBreakdownMap = new Map<
      string,
      {
        propertyId: string;
        propertyTitle: string;
        location: string | null;
        totalRequests: number;
        openRequests: number;
        completedRequests: number;
        totalEstimatedCost: number;
      }
    >();

    for (const request of requests) {
      const propertyId = request.propertyId || request.property?.id;
      const propertyTitle = request.property?.title || 'Unknown Property';

      if (!propertyId) continue;

      if (!propertyBreakdownMap.has(propertyId)) {
        propertyBreakdownMap.set(propertyId, {
          propertyId,
          propertyTitle,
          location: request.property?.location ?? null,
          totalRequests: 0,
          openRequests: 0,
          completedRequests: 0,
          totalEstimatedCost: 0,
        });
      }

      const current = propertyBreakdownMap.get(propertyId)!;
      current.totalRequests += 1;
      current.totalEstimatedCost += this.normalizeAmount(request.estimatedCost);

      if (openStatuses.has(request.status)) {
        current.openRequests += 1;
      }

      if (request.status === MaintenanceStatus.COMPLETED) {
        current.completedRequests += 1;
      }
    }

    const propertyBreakdown = Array.from(propertyBreakdownMap.values())
      .map((row) => ({
        ...row,
        completionRate: row.totalRequests
          ? Math.round((row.completedRequests / row.totalRequests) * 100)
          : 0,
      }))
      .sort((a, b) => b.totalRequests - a.totalRequests);

    const topProvidersMap = new Map<
      string,
      {
        providerId: string;
        providerName: string;
        jobs: number;
        completedPayouts: number;
        avgRating: number;
      }
    >();

    for (const payout of payouts) {
      const providerId = payout.providerId;
      const providerName =
        payout.provider?.companyName ||
        payout.provider?.user?.name ||
        'Provider';

      if (!topProvidersMap.has(providerId)) {
        const relatedReviews = providerReviews.filter(
          (review) => review.providerId === providerId,
        );

        topProvidersMap.set(providerId, {
          providerId,
          providerName,
          jobs: 0,
          completedPayouts: 0,
          avgRating: this.average(
            relatedReviews.map((review) => this.normalizeAmount(review.rating)),
          ),
        });
      }

      const row = topProvidersMap.get(providerId)!;
      row.jobs += 1;

      if (payout.status === PayoutStatus.COMPLETED) {
        row.completedPayouts += 1;
      }
    }

    const topProviders = Array.from(topProvidersMap.values())
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 5);

    return {
      totalRequests,
      openRequests,
      completedRequests,
      inProgressRequests,
      statusCounts,
      avgCompletionHours,
      quoteCount,
      acceptedQuoteCount,
      quoteAcceptanceRate,
      dispatchCount,
      acceptedDispatchCount,
      completedPayoutCount,
      pendingPayoutCount,
      totalPayoutAmount,
      totalProviderEarning,
      totalPlatformFee,
      linkedExpenseAmount,
      avgRating,
      propertyBreakdown,
      topProviders,
    };
  }

  async getProviderPerformance(providerId: string) {
    const jobs = await this.prisma.maintenanceRequest.count({
      where: { assignedProviderId: providerId },
    });

    return { jobs };
  }

  async getProviderJobs(userId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new BadRequestException('Provider profile not found');
    }

    const requestIds = await this.prisma.maintenanceRequest.findMany({
      where: {
        assignedProviderId: provider.id,
      },
      select: {
        id: true,
      },
    });

    await this.syncAcceptedQuoteStatesForRequests(
      requestIds.map((request) => request.id),
    );

    return this.prisma.maintenanceRequest.findMany({
      where: {
        assignedProviderId: provider.id,
      },
      include: {
        property: true,
        unit: true,
        resident: {
          include: {
            user: {
              select: this.safeUserSelect,
            },
          },
        },
        assignedProvider: {
          include: {
            user: {
              select: this.safeUserSelect,
            },
          },
        },
        photos: true,
        quotes: {
          include: {
            provider: {
              include: {
                user: {
                  select: this.safeUserSelect,
                },
              },
            },
            items: true,
          },
        },
        dispatches: {
          include: {
            provider: {
              include: {
                user: {
                  select: this.safeUserSelect,
                },
              },
            },
          },
        },
        expenses: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        payouts: {
          include: {
            provider: {
              include: {
                user: {
                  select: this.safeUserSelect,
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        reviews: {
          include: {
            resident: {
              include: {
                user: {
                  select: this.safeUserSelect,
                },
              },
            },
            provider: {
              include: {
                user: {
                  select: this.safeUserSelect,
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getProviderQuotes(userId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new BadRequestException('Provider profile not found');
    }

    return this.prisma.maintenanceQuote.findMany({
      where: {
        providerId: provider.id,
      },
      include: {
        request: {
          include: {
            property: true,
            unit: true,
            resident: {
              include: {
                user: {
                  select: this.safeUserSelect,
                },
              },
            },
          },
        },
        items: true,
        provider: {
          include: {
            user: {
              select: this.safeUserSelect,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getProviderPayouts(userId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new BadRequestException('Provider profile not found');
    }

    return this.prisma.providerPayout.findMany({
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
    });
  }
}