import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  Prisma,
  PaymentChannel,
  PaymentProvider,
  PaymentStatus,
  InvoiceStatus,
  InvoiceKind,
  LedgerSource,
  AccountType,
  Role,
  WalletTransactionStatus,
  WalletTransactionType,
  NotificationType,
} from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private mapInvoiceKindToLedgerSource(kind: InvoiceKind): LedgerSource {
    switch (kind) {
      case InvoiceKind.RENT:
        return LedgerSource.RENT_PAYMENT;
      case InvoiceKind.GARBAGE:
        return LedgerSource.GARBAGE_PAYMENT;
      case InvoiceKind.SERVICE_CHARGE:
        return LedgerSource.SERVICE_CHARGE_PAYMENT;
      default:
        return LedgerSource.OTHER_FEE_PAYMENT;
    }
  }

  private normalizePaymentChannel(
    channel: PaymentChannel,
    provider: PaymentProvider,
    providerRef?: string,
  ): PaymentChannel {
    if (providerRef?.startsWith('WALLET-')) {
      return PaymentChannel.BANK;
    }

    if (
      provider === PaymentProvider.FLUTTERWAVE ||
      provider === PaymentProvider.ONAFRIQ
    ) {
      if (channel === PaymentChannel.BANK) {
        return PaymentChannel.MOBILE_MONEY;
      }
    }

    return channel;
  }

  private getDisplayChannel(
    channel: PaymentChannel,
    providerRef?: string | null,
  ) {
    return providerRef?.startsWith('WALLET-') ? 'WALLET' : channel;
  }

  private getDisplayProvider(
    provider: PaymentProvider,
    providerRef?: string | null,
  ) {
    return providerRef?.startsWith('WALLET-') ? 'INTERNAL_WALLET' : provider;
  }

  private formatMoney(amount: number) {
    return `UGX ${Number(amount || 0).toLocaleString('en-UG')}`;
  }

  private async notifyPaymentSuccess(params: {
    residentUserId: string;
    managerId?: string | null;
    amount: number;
    invoiceKind: InvoiceKind;
    propertyTitle?: string | null;
    unitNumber?: string | null;
  }) {
    const kindLabel = this.getInvoiceKindLabel(params.invoiceKind);
    const propertyText = params.propertyTitle
      ? ` for ${params.propertyTitle}`
      : '';
    const unitText = params.unitNumber ? `, Unit ${params.unitNumber}` : '';

    await this.notificationsService.createNotification({
      userId: params.residentUserId,
      title: 'Payment received',
      message: `${this.formatMoney(params.amount)} ${kindLabel.toLowerCase()} payment${propertyText}${unitText} has been successfully processed.`,
      type: NotificationType.RENT_PAYMENT,
    });

    if (params.managerId) {
      await this.notificationsService.createNotification({
        userId: params.managerId,
        title: 'New payment received',
        message: `${this.formatMoney(params.amount)} ${kindLabel.toLowerCase()} payment${propertyText}${unitText} has been received.`,
        type: NotificationType.RENT_PAYMENT,
      });
    }
  }

  private async findOrCreatePlatformAccount(tx: Prisma.TransactionClient) {
    let account = await tx.account.findFirst({
      where: { type: AccountType.PLATFORM },
      orderBy: { createdAt: 'asc' },
    });

    if (!account) {
      account = await tx.account.create({
        data: {
          type: AccountType.PLATFORM,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    return account;
  }

  private async fundResidentAccountForExternalPaymentWithTx(
    tx: Prisma.TransactionClient,
    params: {
      residentUserId: string;
      amount: number;
      providerRef: string;
    },
  ) {
    const userAccount = await this.findOrCreateUserAccount(
      tx,
      params.residentUserId,
    );
    const platformAccount = await this.findOrCreatePlatformAccount(tx);

    const fundingReference = `EXT-FUND-${params.providerRef}`;

    const existingFundingEntry = await tx.ledgerEntry.findFirst({
      where: {
        reference: fundingReference,
        accountId: userAccount.id,
      },
    });

    if (existingFundingEntry) {
      return;
    }

    await this.ledger.recordDoubleEntry({
      debitAccountId: platformAccount.id,
      creditAccountId: userAccount.id,
      amount: params.amount,
      source: LedgerSource.EXTERNAL_FUNDING,
      reference: fundingReference,
      tx,
    });

    await this.walletService.getOrCreateWalletWithTx(params.residentUserId, tx);
    await this.walletService.syncWalletWithLedger(params.residentUserId, tx);
  }

  private async recordPaymentWithTx(
    tx: Prisma.TransactionClient,
    dto: {
      invoiceId: string;
      amount: number;
      channel: PaymentChannel;
      provider: PaymentProvider;
      providerRef: string;
    },
  ) {
    const normalizedChannel = this.normalizePaymentChannel(
      dto.channel,
      dto.provider,
      dto.providerRef,
    );

    const existing = await tx.payment.findFirst({
      where: {
        providerRef: dto.providerRef,
        provider: dto.provider,
      },
    });

    if (existing?.status === PaymentStatus.SUCCESS) {
      this.logger.warn(`Duplicate payment ignored: ${dto.providerRef}`);

      return {
        message: 'Payment already processed',
        paymentId: existing.id,
        duplicate: true,
      };
    }

    if (existing && existing.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment reference is not processable');
    }

    const invoice = await tx.rentInvoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        rentContract: {
          include: {
            unit: {
              include: {
                property: true,
              },
            },
          },
        },
        resident: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!invoice.resident?.userId) {
      throw new BadRequestException('Resident not linked');
    }

    if (!invoice.rentContract?.unit?.property?.id) {
      throw new BadRequestException('Invoice property link is missing');
    }

    if (existing) {
      if (existing.invoiceId !== invoice.id) {
        throw new BadRequestException('Payment reference invoice mismatch');
      }

      if (Number(existing.amount) !== Number(dto.amount)) {
        throw new BadRequestException('Payment reference amount mismatch');
      }
    }

    const propertyId = invoice.rentContract.unit.property.id;

    const total = new Prisma.Decimal(invoice.totalAmount);
    const paid = new Prisma.Decimal(invoice.paidAmount || 0);
    const amount = new Prisma.Decimal(dto.amount);
    const outstanding = total.minus(paid);

    if (amount.lte(0)) {
      throw new BadRequestException('Invalid amount');
    }

    if (amount.gt(outstanding)) {
      throw new BadRequestException('Overpayment not allowed');
    }

    const residentAccount = await this.findOrCreateUserAccount(
      tx,
      invoice.resident.userId,
    );

    const balance = await this.getAccountBalance(tx, residentAccount.id);

    if (balance < amount.toNumber()) {
      throw new BadRequestException({
        message: 'Insufficient balance',
        balance,
        attempted: amount.toNumber(),
      });
    }

    const payment = existing
      ? await tx.payment.update({
          where: { id: existing.id },
          data: {
            amount,
            channel: normalizedChannel,
            provider: dto.provider,
            providerRef: dto.providerRef,
            status: PaymentStatus.SUCCESS,
            invoiceId: invoice.id,
          },
        })
      : await tx.payment.create({
          data: {
            amount,
            channel: normalizedChannel,
            provider: dto.provider,
            providerRef: dto.providerRef,
            status: PaymentStatus.SUCCESS,
            invoiceId: invoice.id,
          },
        });

    const propertyAccount = await this.findOrCreatePropertyAccount(
      tx,
      propertyId,
    );

    const ledgerSource = this.mapInvoiceKindToLedgerSource(invoice.kind);

    await this.ledger.recordDoubleEntry({
      debitAccountId: residentAccount.id,
      creditAccountId: propertyAccount.id,
      amount: amount.toNumber(),
      source: ledgerSource,
      reference: dto.providerRef,
      rentInvoiceId: invoice.id,
      paymentId: payment.id,
      propertyId,
      tx,
    });

    await this.walletService.getOrCreateWalletWithTx(
      invoice.resident.userId,
      tx,
    );

    await this.walletService.syncWalletWithLedger(invoice.resident.userId, tx);

    const newPaid = paid.plus(amount);

    await tx.rentInvoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaid,
        status: newPaid.equals(total)
          ? InvoiceStatus.PAID
          : InvoiceStatus.PARTIALLY_PAID,
      },
    });

    this.logger.log(`Payment processed: ${payment.id}`);

    await this.notifyPaymentSuccess({
      residentUserId: invoice.resident.userId,
      managerId: invoice.rentContract.unit.property.managerId,
      amount: amount.toNumber(),
      invoiceKind: invoice.kind,
      propertyTitle: invoice.rentContract.unit.property.title,
      unitNumber: invoice.rentContract.unit.number,
    });

    return {
      message: 'Payment successful',
      paymentId: payment.id,
    };
  }

  async recordPayment(dto: {
    invoiceId: string;
    amount: number;
    channel: PaymentChannel;
    provider: PaymentProvider;
    providerRef: string;
  }) {
    return this.prisma.$transaction((tx) => this.recordPaymentWithTx(tx, dto));
  }

  private async completeExternalInvoicePayment(params: {
    invoiceId: string;
    amount: number;
    channel: PaymentChannel;
    provider: PaymentProvider;
    providerRef: string;
  }) {
    if (!params.invoiceId) {
      throw new BadRequestException('invoiceId is required');
    }

    if (!params.providerRef) {
      throw new BadRequestException('providerRef is required');
    }

    if (!params.amount || params.amount <= 0) {
      throw new BadRequestException('Valid amount is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findFirst({
        where: {
          providerRef: params.providerRef,
          provider: params.provider,
        },
      });

      if (existing?.status === PaymentStatus.SUCCESS) {
        return {
          message: 'Payment already processed',
          paymentId: existing.id,
          duplicate: true,
        };
      }

      const invoice = await tx.rentInvoice.findUnique({
        where: { id: params.invoiceId },
        include: {
          resident: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (!invoice.resident?.userId) {
        throw new BadRequestException('Resident not linked');
      }

      await this.fundResidentAccountForExternalPaymentWithTx(tx, {
        residentUserId: invoice.resident.userId,
        amount: params.amount,
        providerRef: params.providerRef,
      });

      return this.recordPaymentWithTx(tx, params);
    });
  }

  async payResidentInvoiceFromWallet(
    userId: string,
    dto: {
      invoiceId: string;
      amount?: number;
    },
  ) {
    const residentInvoice = await this.getOwnedResidentInvoice(
      userId,
      dto.invoiceId,
    );

    const total = Number(residentInvoice.totalAmount ?? 0);
    const paid = Number(residentInvoice.paidAmount ?? 0);
    const outstanding = Math.max(0, total - paid);

    if (outstanding <= 0) {
      throw new BadRequestException('This invoice is already fully paid');
    }

    const amount = dto.amount ? Number(dto.amount) : outstanding;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    if (amount > outstanding) {
      throw new BadRequestException('Amount exceeds invoice outstanding balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await this.walletService.getOrCreateWalletWithTx(
        userId,
        tx,
      );
      const balance = await this.walletService.getUserBalance(userId, tx);

      if (balance < amount) {
        throw new BadRequestException({
          message: 'Insufficient balance',
          balance,
          attempted: amount,
        });
      }

      const providerRef = `WALLET-${dto.invoiceId}-${Date.now()}`;

      const existing = await tx.payment.findFirst({
        where: {
          providerRef,
          provider: PaymentProvider.ONAFRIQ,
        },
      });

      if (existing) {
        throw new BadRequestException('Duplicate payment');
      }

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.WITHDRAWAL,
          amount,
          status: WalletTransactionStatus.COMPLETED,
          reference: providerRef,
        },
      });

      const paymentResult = await this.recordPaymentWithTx(tx, {
        invoiceId: dto.invoiceId,
        amount,
        channel: PaymentChannel.BANK,
        provider: PaymentProvider.ONAFRIQ,
        providerRef,
      });

      await this.walletService.syncWalletWithLedger(userId, tx);

      return paymentResult;
    });
  }

  async initiateResidentExternalPayment(
    userId: string,
    dto: {
      invoiceId: string;
      amount: number;
      channel: PaymentChannel;
      provider: PaymentProvider;
      providerRef?: string;
    },
  ) {
    const residentInvoice = await this.getOwnedResidentInvoice(
      userId,
      dto.invoiceId,
    );

    const total = Number(residentInvoice.totalAmount ?? 0);
    const paid = Number(residentInvoice.paidAmount ?? 0);
    const outstanding = Math.max(0, total - paid);

    if (outstanding <= 0) {
      throw new BadRequestException('This invoice is already fully paid');
    }

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    if (dto.amount > outstanding) {
      throw new BadRequestException('Amount exceeds invoice outstanding balance');
    }

    const providerRef =
      dto.providerRef?.trim() ||
      `INIT-${dto.provider}-${dto.invoiceId}-${Date.now()}`;

    const existing = await this.prisma.payment.findFirst({
      where: {
        providerRef,
        provider: dto.provider,
      },
    });

    if (existing) {
      throw new BadRequestException('Duplicate payment reference');
    }

    const normalizedChannel = this.normalizePaymentChannel(
      dto.channel,
      dto.provider,
      providerRef,
    );

    const pendingPayment = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId,
        amount: new Prisma.Decimal(dto.amount),
        channel: normalizedChannel,
        provider: dto.provider,
        providerRef,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      message: 'Payment initiated',
      mode: 'external',
      paymentId: pendingPayment.id,
      providerRef,
      channel: pendingPayment.channel,
      provider: pendingPayment.provider,
      amount: dto.amount,
      invoiceId: dto.invoiceId,
      status: pendingPayment.status,
      flutterwaveMeta: {
        invoiceId: dto.invoiceId,
        paymentId: pendingPayment.id,
        userId,
      },
      nextAction:
        'Awaiting provider confirmation. On successful callback/webhook, the invoice will be settled.',
    };
  }

  async getAdminPayments(query?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const safePage = Math.max(1, Number(query?.page ?? 1));
    const safeLimit = Math.min(100, Math.max(1, Number(query?.limit ?? 20)));
    const skip = (safePage - 1) * safeLimit;
    const search = query?.search?.trim();

    const where: Prisma.PaymentWhereInput = search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' } },
            { providerRef: { contains: search, mode: 'insensitive' } },
            { invoice: { id: { contains: search, mode: 'insensitive' } } },
            { invoice: { period: { contains: search, mode: 'insensitive' } } },
            {
              invoice: {
                resident: {
                  user: { name: { contains: search, mode: 'insensitive' } },
                },
              },
            },
            {
              invoice: {
                resident: {
                  user: { email: { contains: search, mode: 'insensitive' } },
                },
              },
            },
            {
              invoice: {
                unit: { number: { contains: search, mode: 'insensitive' } },
              },
            },
            {
              invoice: {
                unit: {
                  property: {
                    title: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            },
            {
              invoice: {
                unit: {
                  property: {
                    location: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            },
          ],
        }
      : {};

    const [items, total, aggregates] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include: {
          invoice: {
            include: {
              resident: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
              unit: {
                include: {
                  property: {
                    include: {
                      manager: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          phone: true,
                        },
                      },
                      owner: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          phone: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
      this.prisma.payment.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    const mappedItems = items.map((payment) => ({
      ...payment,
      amount: Number(payment.amount ?? 0),
      channel: this.getDisplayChannel(payment.channel, payment.providerRef),
      provider: this.getDisplayProvider(payment.provider, payment.providerRef),
      invoice: payment.invoice
        ? {
            ...payment.invoice,
            kindLabel: this.getInvoiceKindLabel(payment.invoice.kind),
            totalAmount: Number(payment.invoice.totalAmount ?? 0),
            paidAmount: Number(payment.invoice.paidAmount ?? 0),
          }
        : null,
    }));

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return {
      items: mappedItems,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
      summary: {
        totalPayments: total,
        totalSuccessfulAmount: Number(aggregates._sum.amount ?? 0),
      },
      audience: 'admin',
    };
  }

  async getManagerPayments(
    managerId: string,
    query?: {
      page?: number;
      limit?: number;
      search?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== Role.MANAGER) {
      throw new ForbiddenException('Only managers can view manager payments');
    }

    const safePage = Math.max(1, Number(query?.page ?? 1));
    const safeLimit = Math.min(100, Math.max(1, Number(query?.limit ?? 20)));
    const skip = (safePage - 1) * safeLimit;
    const search = query?.search?.trim();

    const where: Prisma.PaymentWhereInput = {
      invoice: {
        unit: {
          property: {
            managerId,
          },
        },
      },
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' } },
              { providerRef: { contains: search, mode: 'insensitive' } },
              { invoice: { id: { contains: search, mode: 'insensitive' } } },
              {
                invoice: {
                  period: { contains: search, mode: 'insensitive' },
                },
              },
              {
                invoice: {
                  resident: {
                    user: {
                      name: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              },
              {
                invoice: {
                  resident: {
                    user: {
                      email: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              },
              {
                invoice: {
                  unit: {
                    number: { contains: search, mode: 'insensitive' },
                  },
                },
              },
              {
                invoice: {
                  unit: {
                    property: {
                      title: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              },
              {
                invoice: {
                  unit: {
                    property: {
                      location: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total, aggregates] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include: {
          invoice: {
            include: {
              resident: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
              unit: {
                include: {
                  property: {
                    select: {
                      id: true,
                      title: true,
                      location: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
      this.prisma.payment.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    const mappedItems = items.map((payment) => ({
      ...payment,
      amount: Number(payment.amount ?? 0),
      channel: this.getDisplayChannel(payment.channel, payment.providerRef),
      provider: this.getDisplayProvider(payment.provider, payment.providerRef),
      invoice: payment.invoice
        ? {
            ...payment.invoice,
            kindLabel: this.getInvoiceKindLabel(payment.invoice.kind),
            totalAmount: Number(payment.invoice.totalAmount ?? 0),
            paidAmount: Number(payment.invoice.paidAmount ?? 0),
          }
        : null,
    }));

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return {
      items: mappedItems,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
      summary: {
        totalPayments: total,
        totalSuccessfulAmount: Number(aggregates._sum.amount ?? 0),
      },
      audience: 'manager',
    };
  }

  async getResidentPayments(userId: string, page = 1, limit = 10) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== Role.RESIDENT) {
      throw new ForbiddenException('Only residents can view resident payments');
    }

    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident profile not found');
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.PaymentWhereInput = {
      invoice: {
        residentId: resident.id,
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
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
      }),
      this.prisma.payment.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return {
      items: items.map((payment) => ({
        id: payment.id,
        createdAt: payment.createdAt,
        amount: Number(payment.amount ?? 0),
        channel: this.getDisplayChannel(payment.channel, payment.providerRef),
        provider: this.getDisplayProvider(payment.provider, payment.providerRef),
        providerRef: payment.providerRef,
        status: payment.status,
        invoiceId: payment.invoiceId,
        invoice: payment.invoice
          ? {
              id: payment.invoice.id,
              kind: payment.invoice.kind,
              kindLabel: this.getInvoiceKindLabel(payment.invoice.kind),
              period: payment.invoice.period,
              dueDate: payment.invoice.dueDate,
              totalAmount: Number(payment.invoice.totalAmount ?? 0),
              paidAmount: Number(payment.invoice.paidAmount ?? 0),
              status: payment.invoice.status,
              unitNumber: payment.invoice.unit?.number ?? null,
              propertyTitle: payment.invoice.unit?.property?.title ?? null,
              propertyLocation: payment.invoice.unit?.property?.location ?? null,
            }
          : null,
      })),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
      audience: 'resident',
    };
  }

  async getResidentPaymentSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== Role.RESIDENT) {
      throw new ForbiddenException(
        'Only residents can view resident payment summary',
      );
    }

    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident profile not found');
    }

    const [paymentAgg, successfulCount, latestPayment, currentInvoices] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            status: PaymentStatus.SUCCESS,
            invoice: { residentId: resident.id },
          },
          _sum: { amount: true },
        }),
        this.prisma.payment.count({
          where: {
            status: PaymentStatus.SUCCESS,
            invoice: { residentId: resident.id },
          },
        }),
        this.prisma.payment.findFirst({
          where: {
            invoice: { residentId: resident.id },
          },
          orderBy: { createdAt: 'desc' },
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
        }),
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
          },
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        }),
      ]);

    const totalPaid = Number(paymentAgg._sum.amount ?? 0);

    const mappedCurrentInvoices = currentInvoices.map((invoice) => {
      const invoiceTotal = Number(invoice.totalAmount ?? 0);
      const invoicePaid = Number(invoice.paidAmount ?? 0);

      return {
        id: invoice.id,
        kind: invoice.kind,
        kindLabel: this.getInvoiceKindLabel(invoice.kind),
        period: invoice.period,
        dueDate: invoice.dueDate,
        status: invoice.status,
        totalAmount: invoiceTotal,
        paidAmount: invoicePaid,
        outstandingAmount: Math.max(0, invoiceTotal - invoicePaid),
        unitNumber: invoice.unit?.number ?? null,
        propertyTitle: invoice.unit?.property?.title ?? null,
        propertyLocation: invoice.unit?.property?.location ?? null,
      };
    });

    const totalOutstanding = mappedCurrentInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.outstandingAmount ?? 0),
      0,
    );

    return {
      totalPaid,
      successfulPaymentsCount: successfulCount,
      currentInvoices: mappedCurrentInvoices,
      totalOutstanding,
      latestPayment: latestPayment
        ? {
            id: latestPayment.id,
            createdAt: latestPayment.createdAt,
            amount: Number(latestPayment.amount ?? 0),
            channel: this.getDisplayChannel(
              latestPayment.channel,
              latestPayment.providerRef,
            ),
            provider: this.getDisplayProvider(
              latestPayment.provider,
              latestPayment.providerRef,
            ),
            providerRef: latestPayment.providerRef,
            status: latestPayment.status,
            invoiceId: latestPayment.invoiceId,
            invoiceKind: latestPayment.invoice?.kind ?? null,
            invoiceKindLabel: latestPayment.invoice
              ? this.getInvoiceKindLabel(latestPayment.invoice.kind)
              : null,
            propertyTitle: latestPayment.invoice?.unit?.property?.title ?? null,
            unitNumber: latestPayment.invoice?.unit?.number ?? null,
            period: latestPayment.invoice?.period ?? null,
          }
        : null,
      audience: 'resident',
    };
  }

  private async getOwnedResidentInvoice(userId: string, invoiceId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== Role.RESIDENT) {
      throw new ForbiddenException('Only residents can pay resident invoices');
    }

    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident profile not found');
    }

    const invoice = await this.prisma.rentInvoice.findUnique({
      where: { id: invoiceId },
      include: { resident: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.residentId !== resident.id) {
      throw new ForbiddenException('You can only pay your own invoice');
    }

    return invoice;
  }

  private async getAccountBalance(
    tx: Prisma.TransactionClient,
    accountId: string,
  ) {
    const result = await tx.ledgerEntry.aggregate({
      where: { accountId },
      _sum: { credit: true, debit: true },
    });

    return Number(result._sum.credit || 0) - Number(result._sum.debit || 0);
  }

  private async findOrCreateUserAccount(
    tx: Prisma.TransactionClient,
    userId: string,
  ) {
    let account = await tx.account.findFirst({
      where: { userId, type: AccountType.USER },
    });

    if (!account) {
      account = await tx.account.create({
        data: {
          userId,
          type: AccountType.USER,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    return account;
  }

  private async findOrCreatePropertyAccount(
    tx: Prisma.TransactionClient,
    propertyId: string,
  ) {
    let account = await tx.account.findFirst({
      where: { propertyId, type: AccountType.PROPERTY },
    });

    if (!account) {
      account = await tx.account.create({
        data: {
          propertyId,
          type: AccountType.PROPERTY,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    return account;
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

  private isSuccessfulFlutterwaveStatus(status?: string | null) {
    return ['successful', 'success', 'completed'].includes(
      String(status || '').toLowerCase(),
    );
  }

  private isFailedFlutterwaveStatus(status?: string | null) {
    return ['failed', 'cancelled', 'canceled'].includes(
      String(status || '').toLowerCase(),
    );
  }

  private extractFlutterwavePayload(payload: any) {
    const data = payload?.data || payload || {};

    const providerRef =
      data.tx_ref ||
      payload?.tx_ref ||
      data.flw_ref ||
      payload?.flw_ref ||
      data.id?.toString() ||
      payload?.id?.toString();

    const invoiceId =
      data.meta?.invoiceId ||
      data.meta?.invoice_id ||
      payload?.meta?.invoiceId ||
      payload?.meta?.invoice_id;

    const walletUserId =
      data.meta?.walletUserId ||
      data.meta?.wallet_user_id ||
      payload?.meta?.walletUserId ||
      payload?.meta?.wallet_user_id;

    const amount = Number(data.amount ?? payload?.amount ?? 0);
    const status = data.status || payload?.status;

    return {
      providerRef,
      invoiceId,
      walletUserId,
      amount,
      status,
    };
  }

  private async markPendingPaymentFailed(params: {
    provider: PaymentProvider;
    providerRef: string;
  }) {
    const existing = await this.prisma.payment.findFirst({
      where: {
        provider: params.provider,
        providerRef: params.providerRef,
        status: PaymentStatus.PENDING,
      },
    });

    if (!existing) {
      return {
        message: 'No pending payment found to mark failed',
        providerRef: params.providerRef,
      };
    }

    await this.prisma.payment.update({
      where: { id: existing.id },
      data: { status: PaymentStatus.FAILED },
    });

    return {
      message: 'Pending payment marked failed',
      paymentId: existing.id,
      providerRef: params.providerRef,
    };
  }

  async handleStripeWebhook(payload: any) {
    return this.recordPayment({
      invoiceId: payload.invoiceId,
      amount: payload.amount,
      channel: PaymentChannel.CARD,
      provider: PaymentProvider.STRIPE,
      providerRef: payload.id,
    });
  }

  async handleFlutterwaveWebhook(payload: any) {
    const parsed = this.extractFlutterwavePayload(payload);

    if (!parsed.providerRef) {
      throw new BadRequestException('Flutterwave provider reference missing');
    }

    if (this.isFailedFlutterwaveStatus(parsed.status)) {
      return this.markPendingPaymentFailed({
        provider: PaymentProvider.FLUTTERWAVE,
        providerRef: parsed.providerRef,
      });
    }

    if (!this.isSuccessfulFlutterwaveStatus(parsed.status)) {
      return {
        message: 'Flutterwave webhook ignored because payment is not successful',
        providerRef: parsed.providerRef,
        status: parsed.status,
      };
    }

    if (!parsed.amount || parsed.amount <= 0) {
      throw new BadRequestException('Flutterwave amount is invalid');
    }

    if (parsed.walletUserId) {
      return this.walletService.completeWalletFunding({
        userId: parsed.walletUserId,
        amount: parsed.amount,
        providerRef: parsed.providerRef,
      });
    }

    if (!parsed.invoiceId) {
      throw new BadRequestException(
        'Flutterwave meta.invoiceId is required for invoice payments',
      );
    }

    return this.completeExternalInvoicePayment({
      invoiceId: parsed.invoiceId,
      amount: parsed.amount,
      channel: PaymentChannel.MOBILE_MONEY,
      provider: PaymentProvider.FLUTTERWAVE,
      providerRef: parsed.providerRef,
    });
  }

  async handleOnafriqWebhook(payload: any) {
    return this.recordPayment({
      invoiceId: payload.invoiceId,
      amount: payload.amount,
      channel: PaymentChannel.MOBILE_MONEY,
      provider: PaymentProvider.ONAFRIQ,
      providerRef: payload.transactionId,
    });
  }
}