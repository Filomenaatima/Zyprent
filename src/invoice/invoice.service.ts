import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  InvoiceKind,
  InvoiceStatus,
  PaymentChannel,
  PaymentProvider,
  Prisma,
  RentInvoice,
  Role,
} from '@prisma/client';
import { PaymentService } from '../payment/payment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ManagerInvoiceQueryDto } from './dto/manager-invoice-query.dto';
import { SettleInvoiceDto } from './dto/settle-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async generateInvoice(
    rentContractId: string,
    months: number = 1,
    isManual: boolean = false,
  ): Promise<RentInvoice[]> {
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.rentContract.findUnique({
        where: { id: rentContractId },
        include: {
          unit: {
            include: {
              property: {
                select: {
                  managerId: true,
                },
              },
            },
          },
        },
      });

      if (!contract) {
        throw new NotFoundException('Rent contract not found');
      }

      if (!contract.isActive) {
        throw new BadRequestException('Contract is not active');
      }

      if (!contract.nextBillingDate) {
        throw new BadRequestException('Next billing date is not set');
      }

      let billingDate = new Date(contract.nextBillingDate);
      const today = new Date();
      const createdInvoices: RentInvoice[] = [];

      for (let i = 0; i < months; i++) {
        const period = this.formatPeriod(billingDate);

        if (!isManual && today < billingDate) {
          break;
        }

        const dueDate = new Date(billingDate);
        dueDate.setDate(dueDate.getDate() + 5);

        const invoiceDefinitions: Array<{
          kind: InvoiceKind;
          amount: Prisma.Decimal;
        }> = [
          {
            kind: InvoiceKind.RENT,
            amount: new Prisma.Decimal(contract.rentAmount),
          },
          {
            kind: InvoiceKind.SERVICE_CHARGE,
            amount: new Prisma.Decimal(contract.serviceCharge),
          },
          {
            kind: InvoiceKind.GARBAGE,
            amount: new Prisma.Decimal(contract.garbageFee),
          },
        ];

        for (const definition of invoiceDefinitions) {
          if (definition.amount.lte(0)) {
            continue;
          }

          const existing = await tx.rentInvoice.findUnique({
            where: {
              rentContractId_period_kind: {
                rentContractId: contract.id,
                period,
                kind: definition.kind,
              },
            },
          });

          if (existing) {
            continue;
          }

          const invoice = await tx.rentInvoice.create({
            data: {
              rentContractId: contract.id,
              residentId: contract.residentId,
              unitId: contract.unitId,
              kind: definition.kind,
              totalAmount: definition.amount,
              paidAmount: new Prisma.Decimal(0),
              period,
              dueDate,
              status: InvoiceStatus.ISSUED,
            },
          });

          createdInvoices.push(invoice);
        }

        billingDate = this.addOneMonthWithAnchor(
          billingDate,
          contract.billingAnchorDay,
        );
      }

      if (createdInvoices.length > 0) {
        await tx.rentContract.update({
          where: { id: contract.id },
          data: {
            nextBillingDate: billingDate,
          },
        });
      }

      return createdInvoices;
    });
  }

  async generateInvoiceByUser(
    userId: string,
    role: Role,
    rentContractId: string,
    months: number = 1,
    isManual: boolean = false,
  ): Promise<RentInvoice[]> {
    if (role === Role.ADMIN) {
      return this.generateInvoice(rentContractId, months, isManual);
    }

    if (role !== Role.MANAGER) {
      throw new ForbiddenException('Access denied');
    }

    const contract = await this.prisma.rentContract.findUnique({
      where: { id: rentContractId },
      include: {
        unit: {
          include: {
            property: {
              select: {
                managerId: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Rent contract not found');
    }

    if (contract.unit?.property?.managerId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to generate invoices for this contract',
      );
    }

    return this.generateInvoice(rentContractId, months, isManual);
  }

  async findAll(): Promise<RentInvoice[]> {
    return this.prisma.rentInvoice.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<RentInvoice> {
    const invoice = await this.prisma.rentInvoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async getAdminInvoices(query: ManagerInvoiceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const status =
      query.status && query.status !== 'ALL' ? query.status : undefined;

    const where: Prisma.RentInvoiceWhereInput = {
      ...(status ? { status: status as InvoiceStatus } : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' } },
              { period: { contains: search, mode: 'insensitive' } },
              { rentContractId: { contains: search, mode: 'insensitive' } },
              { residentId: { contains: search, mode: 'insensitive' } },
              { unitId: { contains: search, mode: 'insensitive' } },
              {
                resident: {
                  user: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                },
              },
              {
                resident: {
                  user: {
                    email: { contains: search, mode: 'insensitive' },
                  },
                },
              },
              {
                unit: {
                  number: { contains: search, mode: 'insensitive' },
                },
              },
              {
                unit: {
                  property: {
                    title: { contains: search, mode: 'insensitive' },
                  },
                },
              },
              {
                unit: {
                  property: {
                    location: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total, allForSummary] = await Promise.all([
      this.prisma.rentInvoice.findMany({
        where,
        orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
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
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              amount: true,
              channel: true,
              provider: true,
              providerRef: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.rentInvoice.count({ where }),
      this.prisma.rentInvoice.findMany({
        where,
        select: {
          totalAmount: true,
          paidAmount: true,
          status: true,
          period: true,
        },
      }),
    ]);

    const summary = allForSummary.reduce(
      (acc, item) => {
        const totalAmount = Number(item.totalAmount || 0);
        const paidAmount = Number(item.paidAmount || 0);
        const balance = Math.max(0, totalAmount - paidAmount);

        acc.total += 1;
        acc.totalBilled += totalAmount;
        acc.totalCollected += paidAmount;
        acc.outstanding += balance;

        if (item.status === InvoiceStatus.PAID) acc.paid += 1;
        if (item.status === InvoiceStatus.PARTIALLY_PAID) acc.partial += 1;
        if (item.status === InvoiceStatus.OVERDUE) acc.overdue += 1;
        if (item.status === InvoiceStatus.ISSUED) acc.issued += 1;

        if (!acc.latestPeriod || item.period > acc.latestPeriod) {
          acc.latestPeriod = item.period;
        }

        return acc;
      },
      {
        total: 0,
        paid: 0,
        partial: 0,
        overdue: 0,
        issued: 0,
        totalBilled: 0,
        totalCollected: 0,
        outstanding: 0,
        latestPeriod: '' as string,
      },
    );

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary,
    };
  }

  async getManagerInvoices(managerId: string, query: ManagerInvoiceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const status =
      query.status && query.status !== 'ALL' ? query.status : undefined;

    const where: Prisma.RentInvoiceWhereInput = {
      unit: {
        property: {
          managerId,
        },
      },
      ...(status ? { status: status as InvoiceStatus } : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' } },
              { period: { contains: search, mode: 'insensitive' } },
              { rentContractId: { contains: search, mode: 'insensitive' } },
              { residentId: { contains: search, mode: 'insensitive' } },
              { unitId: { contains: search, mode: 'insensitive' } },
              {
                resident: {
                  user: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                },
              },
              {
                resident: {
                  user: {
                    email: { contains: search, mode: 'insensitive' },
                  },
                },
              },
              {
                unit: {
                  number: { contains: search, mode: 'insensitive' },
                },
              },
              {
                unit: {
                  property: {
                    title: { contains: search, mode: 'insensitive' },
                  },
                },
              },
              {
                unit: {
                  property: {
                    location: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total, allForSummary] = await Promise.all([
      this.prisma.rentInvoice.findMany({
        where,
        orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
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
                select: {
                  id: true,
                  title: true,
                  location: true,
                  managerId: true,
                },
              },
            },
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
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              amount: true,
              channel: true,
              provider: true,
              providerRef: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.rentInvoice.count({ where }),
      this.prisma.rentInvoice.findMany({
        where: {
          unit: {
            property: {
              managerId,
            },
          },
        },
        select: {
          totalAmount: true,
          paidAmount: true,
          status: true,
          period: true,
        },
      }),
    ]);

    const summary = allForSummary.reduce(
      (acc, item) => {
        const totalAmount = Number(item.totalAmount || 0);
        const paidAmount = Number(item.paidAmount || 0);
        const balance = Math.max(0, totalAmount - paidAmount);

        acc.total += 1;
        acc.totalBilled += totalAmount;
        acc.totalCollected += paidAmount;
        acc.outstanding += balance;

        if (item.status === InvoiceStatus.PAID) acc.paid += 1;
        if (item.status === InvoiceStatus.PARTIALLY_PAID) acc.partial += 1;
        if (item.status === InvoiceStatus.OVERDUE) acc.overdue += 1;
        if (item.status === InvoiceStatus.ISSUED) acc.issued += 1;

        if (!acc.latestPeriod || item.period > acc.latestPeriod) {
          acc.latestPeriod = item.period;
        }

        return acc;
      },
      {
        total: 0,
        paid: 0,
        partial: 0,
        overdue: 0,
        issued: 0,
        totalBilled: 0,
        totalCollected: 0,
        outstanding: 0,
        latestPeriod: '' as string,
      },
    );

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary,
    };
  }

  async getManagerInvoice(managerId: string, invoiceId: string) {
    const invoice = await this.prisma.rentInvoice.findFirst({
      where: {
        id: invoiceId,
        unit: {
          property: {
            managerId,
          },
        },
      },
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
              select: {
                id: true,
                title: true,
                location: true,
                managerId: true,
              },
            },
          },
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
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            channel: true,
            provider: true,
            providerRef: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async getResidentInvoices(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    },
  ) {
    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident profile not found');
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const status =
      query.status && query.status !== 'ALL' ? query.status : undefined;

    const where: Prisma.RentInvoiceWhereInput = {
      residentId: resident.id,
      ...(status ? { status: status as InvoiceStatus } : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' } },
              { period: { contains: search, mode: 'insensitive' } },
              {
                unit: {
                  number: { contains: search, mode: 'insensitive' },
                },
              },
              {
                unit: {
                  property: {
                    title: { contains: search, mode: 'insensitive' },
                  },
                },
              },
              {
                unit: {
                  property: {
                    location: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total, allForSummary] = await Promise.all([
      this.prisma.rentInvoice.findMany({
        where,
        orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
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
                select: {
                  id: true,
                  title: true,
                  location: true,
                },
              },
            },
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
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              amount: true,
              channel: true,
              provider: true,
              providerRef: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.rentInvoice.count({ where }),
      this.prisma.rentInvoice.findMany({
        where: { residentId: resident.id },
        select: {
          totalAmount: true,
          paidAmount: true,
          status: true,
          period: true,
        },
      }),
    ]);

    const summary = allForSummary.reduce(
      (acc, item) => {
        const totalAmount = Number(item.totalAmount || 0);
        const paidAmount = Number(item.paidAmount || 0);
        const balance = Math.max(0, totalAmount - paidAmount);

        acc.total += 1;
        acc.totalBilled += totalAmount;
        acc.totalPaid += paidAmount;
        acc.outstanding += balance;

        if (item.status === InvoiceStatus.PAID) acc.paid += 1;
        if (item.status === InvoiceStatus.PARTIALLY_PAID) acc.partial += 1;
        if (item.status === InvoiceStatus.OVERDUE) acc.overdue += 1;
        if (item.status === InvoiceStatus.ISSUED) acc.issued += 1;

        return acc;
      },
      {
        total: 0,
        paid: 0,
        partial: 0,
        overdue: 0,
        issued: 0,
        totalBilled: 0,
        totalPaid: 0,
        outstanding: 0,
      },
    );

    return {
      items: items.map((invoice) => ({
        ...invoice,
        totalAmount: Number(invoice.totalAmount ?? 0),
        paidAmount: Number(invoice.paidAmount ?? 0),
        outstandingAmount: Math.max(
          0,
          Number(invoice.totalAmount ?? 0) - Number(invoice.paidAmount ?? 0),
        ),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary,
    };
  }

  async getResidentCurrentInvoice(userId: string) {
    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident profile not found');
    }

    const invoice = await this.prisma.rentInvoice.findFirst({
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
            property: true,
          },
        },
        rentContract: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    if (!invoice) {
      return null;
    }

    return {
      ...invoice,
      totalAmount: Number(invoice.totalAmount ?? 0),
      paidAmount: Number(invoice.paidAmount ?? 0),
      outstandingAmount: Math.max(
        0,
        Number(invoice.totalAmount ?? 0) - Number(invoice.paidAmount ?? 0),
      ),
    };
  }

  async getResidentInvoice(userId: string, invoiceId: string) {
    const resident = await this.prisma.resident.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident profile not found');
    }

    const invoice = await this.prisma.rentInvoice.findFirst({
      where: {
        id: invoiceId,
        residentId: resident.id,
      },
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
            property: true,
          },
        },
        rentContract: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async getInvoiceByUser(userId: string, role: Role, invoiceId: string) {
    if (role === Role.MANAGER) {
      return this.getManagerInvoice(userId, invoiceId);
    }

    if (role === Role.RESIDENT) {
      return this.getResidentInvoice(userId, invoiceId);
    }

    if (role === Role.ADMIN) {
      const invoice = await this.prisma.rentInvoice.findUnique({
        where: { id: invoiceId },
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
          rentContract: true,
          payments: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      return invoice;
    }

    if (role === Role.INVESTOR) {
      throw new ForbiddenException(
        'Investors do not access resident invoice records directly',
      );
    }

    throw new ForbiddenException('Access denied');
  }

  async settleInvoiceByManager(
    managerId: string,
    invoiceId: string,
    dto: SettleInvoiceDto,
  ) {
    const invoice = await this.prisma.rentInvoice.findFirst({
      where: {
        id: invoiceId,
        unit: {
          property: {
            managerId,
          },
        },
      },
      select: {
        id: true,
        totalAmount: true,
        paidAmount: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const outstanding =
      Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0);

    if (outstanding <= 0) {
      throw new BadRequestException('Invoice is already fully settled');
    }

    const amount = dto.amount ?? outstanding;

    if (amount <= 0) {
      throw new BadRequestException(
        'Settlement amount must be greater than zero',
      );
    }

    if (amount > outstanding) {
      throw new BadRequestException(
        'Settlement amount exceeds outstanding balance',
      );
    }

    return this.paymentService.recordPayment({
      invoiceId,
      amount,
      channel: dto.channel as PaymentChannel,
      provider: dto.provider as PaymentProvider,
      providerRef: dto.providerRef,
    });
  }

  async settleInvoiceByUser(
    userId: string,
    role: Role,
    invoiceId: string,
    dto: SettleInvoiceDto,
  ) {
    if (role === Role.ADMIN) {
      const invoice = await this.prisma.rentInvoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      const outstanding =
        Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0);

      if (outstanding <= 0) {
        throw new BadRequestException('Invoice is already fully settled');
      }

      const amount = dto.amount ?? outstanding;

      if (amount <= 0) {
        throw new BadRequestException(
          'Settlement amount must be greater than zero',
        );
      }

      if (amount > outstanding) {
        throw new BadRequestException(
          'Settlement amount exceeds outstanding balance',
        );
      }

      return this.paymentService.recordPayment({
        invoiceId,
        amount,
        channel: dto.channel as PaymentChannel,
        provider: dto.provider as PaymentProvider,
        providerRef: dto.providerRef,
      });
    }

    if (role === Role.MANAGER) {
      return this.settleInvoiceByManager(userId, invoiceId, dto);
    }

    throw new ForbiddenException('Access denied');
  }

  async sendReminderByManager(managerId: string, invoiceId: string) {
    const invoice = await this.prisma.rentInvoice.findFirst({
      where: {
        id: invoiceId,
        unit: {
          property: {
            managerId,
          },
        },
      },
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
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!invoice.resident?.userId) {
      throw new BadRequestException('Resident user is missing');
    }

    const totalAmount = Number(invoice.totalAmount || 0);
    const paidAmount = Number(invoice.paidAmount || 0);
    const outstanding = Math.max(0, totalAmount - paidAmount);

    const residentName =
      invoice.resident.user?.name ||
      invoice.resident.user?.email ||
      'Resident';

    const propertyTitle = invoice.unit?.property?.title || 'your property';
    const invoiceLabel = this.getInvoiceKindLabel(invoice.kind);

    const message = `Reminder: your ${invoiceLabel.toLowerCase()} invoice for ${propertyTitle}, period ${invoice.period}, has an outstanding balance of UGX ${outstanding.toLocaleString()} and is due on ${new Date(invoice.dueDate).toLocaleDateString('en-UG')}.`;

    await this.notificationsService.createNotification({
      userId: invoice.resident.userId,
      title: 'Invoice Payment Reminder',
      message,
      email: invoice.resident.user?.email ?? undefined,
      phone: invoice.resident.user?.phone ?? undefined,
    });

    return {
      message: `Reminder sent to ${residentName}`,
    };
  }

  async sendReminderByUser(
    userId: string,
    role: Role,
    invoiceId: string,
  ) {
    if (role === Role.ADMIN) {
      const invoice = await this.prisma.rentInvoice.findUnique({
        where: { id: invoiceId },
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
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (!invoice.resident?.userId) {
        throw new BadRequestException('Resident user is missing');
      }

      const totalAmount = Number(invoice.totalAmount || 0);
      const paidAmount = Number(invoice.paidAmount || 0);
      const outstanding = Math.max(0, totalAmount - paidAmount);

      const residentName =
        invoice.resident.user?.name ||
        invoice.resident.user?.email ||
        'Resident';

      const propertyTitle = invoice.unit?.property?.title || 'your property';
      const invoiceLabel = this.getInvoiceKindLabel(invoice.kind);

      const message = `Reminder: your ${invoiceLabel.toLowerCase()} invoice for ${propertyTitle}, period ${invoice.period}, has an outstanding balance of UGX ${outstanding.toLocaleString()} and is due on ${new Date(invoice.dueDate).toLocaleDateString('en-UG')}.`;

      await this.notificationsService.createNotification({
        userId: invoice.resident.userId,
        title: 'Invoice Payment Reminder',
        message,
        email: invoice.resident.user?.email ?? undefined,
        phone: invoice.resident.user?.phone ?? undefined,
      });

      return {
        message: `Reminder sent to ${residentName}`,
      };
    }

    if (role === Role.MANAGER) {
      return this.sendReminderByManager(userId, invoiceId);
    }

    throw new ForbiddenException('Access denied');
  }

  async getInvoiceDownloadPayloadByUser(
    userId: string,
    role: Role,
    invoiceId: string,
  ) {
    const invoice = await this.getInvoiceByUser(userId, role, invoiceId);

    const totalAmount = Number(invoice.totalAmount || 0);
    const paidAmount = Number(invoice.paidAmount || 0);
    const outstanding = Math.max(0, totalAmount - paidAmount);

    return {
      invoiceNumber: invoice.id,
      kind: invoice.kind,
      kindLabel: this.getInvoiceKindLabel(invoice.kind),
      period: invoice.period,
      status: invoice.status,
      dueDate: invoice.dueDate,
      createdAt: invoice.createdAt,
      resident: {
        name: invoice.resident?.user?.name ?? null,
        email: invoice.resident?.user?.email ?? null,
        phone: invoice.resident?.user?.phone ?? null,
      },
      property: {
        title: invoice.unit?.property?.title ?? null,
        location: invoice.unit?.property?.location ?? null,
        unitNumber: invoice.unit?.number ?? null,
      },
      contract: invoice.rentContract ?? null,
      totals: {
        totalAmount,
        paidAmount,
        outstanding,
      },
      payments: invoice.payments ?? [],
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

  private formatPeriod(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private addOneMonthWithAnchor(date: Date, anchorDay: number): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + 1);
    next.setDate(anchorDay);
    return next;
  }
}