import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyValuationDto } from './dto/update-property-valuation.dto';
import {
  Role,
  AccountType,
  MaintenanceStatus,
  InvoiceStatus,
  Prisma,
  UnitStatus,
  ResidentStatus,
} from '@prisma/client';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userContactSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
  } satisfies Prisma.UserSelect;

  private readonly activeMaintenanceStatuses: MaintenanceStatus[] = [
    MaintenanceStatus.PENDING,
    MaintenanceStatus.ASSIGNED,
    MaintenanceStatus.INSPECTION_REQUIRED,
    MaintenanceStatus.QUOTED,
    MaintenanceStatus.APPROVED,
    MaintenanceStatus.IN_PROGRESS,
  ];

  private readonly managerPropertyInclude = {
    owner: { select: this.userContactSelect },
    units: {
      include: {
        residents: {
          where: { status: ResidentStatus.ACTIVE },
        },
        rentInvoices: {
          where: {
            status: {
              in: [
                InvoiceStatus.ISSUED,
                InvoiceStatus.PARTIALLY_PAID,
                InvoiceStatus.OVERDUE,
              ],
            },
          },
        },
      },
    },
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
    account: true,
  } satisfies Prisma.PropertyInclude;

  private readonly managerPropertyDetailInclude = {
    owner: { select: this.userContactSelect },
    units: {
      include: {
        residents: {
          include: {
            user: { select: this.userContactSelect },
          },
        },
        rentInvoices: {
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
      },
      orderBy: { number: 'asc' },
    },
    maintenanceRequests: {
      orderBy: { createdAt: 'desc' },
      take: 8,
    },
    expenses: {
      orderBy: { expenseDate: 'desc' },
      take: 8,
    },
    account: true,
  } satisfies Prisma.PropertyInclude;

  private readonly investorPropertyInclude = {
    manager: { select: this.userContactSelect },
    units: {
      include: {
        residents: {
          where: { status: ResidentStatus.ACTIVE },
        },
        rentInvoices: {
          where: {
            status: {
              in: [
                InvoiceStatus.ISSUED,
                InvoiceStatus.PARTIALLY_PAID,
                InvoiceStatus.OVERDUE,
              ],
            },
          },
        },
      },
    },
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
    account: true,
    investmentOffer: true,
  } satisfies Prisma.PropertyInclude;

  private readonly investorPropertyDetailInclude = {
    manager: { select: this.userContactSelect },
    units: {
      include: {
        residents: {
          include: {
            user: { select: this.userContactSelect },
          },
        },
        rentInvoices: {
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
      },
      orderBy: { number: 'asc' },
    },
    maintenanceRequests: {
      orderBy: { createdAt: 'desc' },
      take: 8,
    },
    expenses: {
      orderBy: { expenseDate: 'desc' },
      take: 8,
    },
    account: true,
    investmentOffer: true,
    shares: true,
    investments: true,
    profitDistributions: {
      orderBy: { createdAt: 'desc' },
      take: 12,
    },
  } satisfies Prisma.PropertyInclude;

  private readonly adminPropertyInclude = {
    owner: { select: this.userContactSelect },
    manager: { select: this.userContactSelect },
    units: {
      include: {
        residents: {
          where: { status: ResidentStatus.ACTIVE },
          include: {
            user: { select: this.userContactSelect },
          },
        },
        rentInvoices: {
          where: {
            status: {
              in: [
                InvoiceStatus.ISSUED,
                InvoiceStatus.PARTIALLY_PAID,
                InvoiceStatus.OVERDUE,
              ],
            },
          },
        },
      },
      orderBy: { number: 'asc' },
    },
    maintenanceRequests: {
      orderBy: { createdAt: 'desc' },
      take: 12,
    },
    expenses: {
      orderBy: { expenseDate: 'desc' },
      take: 12,
    },
    account: true,
    investmentOffer: true,
    shares: true,
    investments: true,
    profitDistributions: {
      orderBy: { createdAt: 'desc' },
      take: 12,
    },
  } satisfies Prisma.PropertyInclude;

  private round(value: number) {
    return Number((value || 0).toFixed(2));
  }

  private async getComputedAccountBalance(accountId?: string | null) {
    if (!accountId) return 0;

    const result = await this.prisma.ledgerEntry.aggregate({
      where: { accountId },
      _sum: {
        credit: true,
        debit: true,
      },
    });

    return this.round(
      Number(result._sum.credit ?? 0) - Number(result._sum.debit ?? 0),
    );
  }

  private async getComputedAccountBalances(accountIds: string[]) {
    const uniqueIds = [...new Set(accountIds.filter(Boolean))];

    if (!uniqueIds.length) {
      return new Map<string, number>();
    }

    const entries = await this.prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      where: {
        accountId: {
          in: uniqueIds,
        },
      },
      _sum: {
        credit: true,
        debit: true,
      },
    });

    const balances = new Map<string, number>();

    for (const accountId of uniqueIds) {
      balances.set(accountId, 0);
    }

    for (const entry of entries) {
      balances.set(
        entry.accountId,
        this.round(
          Number(entry._sum.credit ?? 0) - Number(entry._sum.debit ?? 0),
        ),
      );
    }

    return balances;
  }

  private getCapacityMetrics(property: any) {
    const totalUnits = Number(property.totalUnits ?? 0);

    const occupiedUnits = property.units.filter(
      (unit: any) => unit.status === UnitStatus.OCCUPIED,
    ).length;

    const vacantUnits = Math.max(totalUnits - occupiedUnits, 0);
    const createdUnits = property.units.length;
    const uncreatedUnits = Math.max(totalUnits - createdUnits, 0);

    const occupancyRate =
      totalUnits > 0
        ? Number(((occupiedUnits / totalUnits) * 100).toFixed(1))
        : 0;

    const inventoryCompletionRate =
      totalUnits > 0
        ? Number(((createdUnits / totalUnits) * 100).toFixed(1))
        : 0;

    return {
      totalUnits,
      createdUnits,
      uncreatedUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate,
      inventoryCompletionRate,
    };
  }

  private mapPropertySummary(property: any) {
    const capacity = this.getCapacityMetrics(property);

    const monthlyRentPotential = property.units.reduce(
      (sum: number, unit: any) => sum + Number(unit.rentAmount || 0),
      0,
    );

    const pendingInvoices = property.units.reduce(
      (sum: number, unit: any) => sum + unit.rentInvoices.length,
      0,
    );

    const invoiceExposure = property.units.reduce(
      (sum: number, unit: any) =>
        sum +
        unit.rentInvoices.reduce(
          (invoiceSum: number, invoice: any) =>
            invoiceSum +
            Math.max(
              Number(invoice.totalAmount || 0) -
                Number(invoice.paidAmount || 0),
              0,
            ),
          0,
        ),
      0,
    );

    const activeMaintenanceCount = property.maintenanceRequests.filter(
      (item: any) => this.activeMaintenanceStatuses.includes(item.status),
    ).length;

    const totalExpenses = (property.expenses || []).reduce(
      (sum: number, item: any) => sum + Number(item.amount || 0),
      0,
    );

    const totalInvestments = (property.investments || []).reduce(
      (sum: number, item: any) => sum + Number(item.amount || 0),
      0,
    );

    const totalDistributedProfit = (property.profitDistributions || []).reduce(
      (sum: number, item: any) => sum + Number(item.amount || 0),
      0,
    );

    const sharesIssued = property.investmentOffer?.totalShares ?? 0;
    const sharesSold = property.investmentOffer?.sharesSold ?? 0;

    const offerUtilization =
      sharesIssued > 0
        ? Number(((sharesSold / sharesIssued) * 100).toFixed(1))
        : 0;

    return {
      ...capacity,
      monthlyRentPotential,
      pendingInvoices,
      invoiceExposure,
      activeMaintenanceCount,
      totalExpenses,
      totalInvestments,
      totalDistributedProfit,
      sharesIssued,
      sharesSold,
      offerUtilization,
    };
  }

  async create(dto: CreatePropertyDto, ownerId: string) {
    try {
      return await this.prisma.$transaction(async (db) => {
        const owner = await db.user.findUnique({
          where: { id: ownerId },
          select: { id: true, role: true },
        });

        if (!owner) {
          throw new NotFoundException('Investor not found');
        }

        if (owner.role !== Role.INVESTOR) {
          throw new ForbiddenException('Only investors can create properties');
        }

        const property = await db.property.create({
          data: {
            title: dto.title,
            location: dto.location,
            totalUnits: dto.totalUnits,
            ownerId,
            serviceChargeAmount: dto.serviceChargeAmount ?? null,
            garbageFeeAmount: dto.garbageFeeAmount ?? null,
          },
        });

        await db.account.create({
          data: {
            type: AccountType.PROPERTY,
            propertyId: property.id,
            balance: 0,
          },
        });

        return property;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to create property with account',
      );
    }
  }

  async assignManager(
    propertyId: string,
    managerId: string,
    actorUserId: string,
    actorRole: Role,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, ownerId: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, role: true },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    if (manager.role !== Role.MANAGER) {
      throw new BadRequestException('Assigned user must have MANAGER role');
    }

    if (actorRole !== Role.ADMIN && property.ownerId !== actorUserId) {
      throw new ForbiddenException(
        'Only the property owner or admin can assign a manager',
      );
    }

    return this.prisma.property.update({
      where: { id: propertyId },
      data: { managerId },
      include: {
        owner: { select: this.userContactSelect },
        manager: { select: this.userContactSelect },
        account: true,
      },
    });
  }

  async updateValuation(
    propertyId: string,
    dto: UpdatePropertyValuationDto,
    actorUserId: string,
    actorRole: Role,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { investmentOffer: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (actorRole !== Role.ADMIN && property.ownerId !== actorUserId) {
      throw new ForbiddenException(
        'Only the property owner or admin can update valuation',
      );
    }

    if (
      dto.valuationCapRate !== undefined &&
      (dto.valuationCapRate <= 0 || dto.valuationCapRate >= 1)
    ) {
      throw new BadRequestException(
        'valuationCapRate must be between 0.01 and 0.99',
      );
    }

    return this.prisma.property.update({
      where: { id: propertyId },
      data: {
        ...(dto.marketValue !== undefined
          ? { marketValue: dto.marketValue }
          : {}),
        ...(dto.marketPricePerShare !== undefined
          ? { marketPricePerShare: dto.marketPricePerShare }
          : {}),
        ...(dto.valuationCapRate !== undefined
          ? { valuationCapRate: dto.valuationCapRate }
          : {}),
        valuationUpdatedAt: new Date(),
        valuationUpdatedBy: actorUserId,
      },
      include: {
        owner: { select: this.userContactSelect },
        manager: { select: this.userContactSelect },
        account: true,
        investmentOffer: true,
      },
    });
  }

  async findForManager(managerId: string) {
    const properties = await this.prisma.property.findMany({
      where: { managerId },
      include: this.managerPropertyInclude,
      orderBy: { createdAt: 'desc' },
    });

    const balances = await this.getComputedAccountBalances(
      properties.map((property) => property.account?.id).filter(Boolean) as string[],
    );

    return properties.map((property) => {
      const summary = this.mapPropertySummary(property);
      const accountBalance = balances.get(property.account?.id ?? '') ?? 0;

      return {
        id: property.id,
        title: property.title,
        location: property.location,
        owner: property.owner
          ? {
              id: property.owner.id,
              name: property.owner.name,
              email: property.owner.email,
              phone: property.owner.phone,
            }
          : null,
        serviceChargeAmount: property.serviceChargeAmount ?? 0,
        garbageFeeAmount: property.garbageFeeAmount ?? 0,
        accountBalance,
        totalUnits: summary.totalUnits,
        createdUnits: summary.createdUnits,
        uncreatedUnits: summary.uncreatedUnits,
        occupiedUnits: summary.occupiedUnits,
        vacantUnits: summary.vacantUnits,
        occupancyRate: summary.occupancyRate,
        inventoryCompletionRate: summary.inventoryCompletionRate,
        monthlyRentPotential: summary.monthlyRentPotential,
        activeMaintenanceCount: summary.activeMaintenanceCount,
        pendingInvoices: summary.pendingInvoices,
        invoiceExposure: summary.invoiceExposure,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      };
    });
  }

  async findOneForManager(id: string, managerId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, managerId },
      include: this.managerPropertyDetailInclude,
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const summary = this.mapPropertySummary(property);
    const accountBalance = await this.getComputedAccountBalance(
      property.account?.id,
    );

    return {
      id: property.id,
      title: property.title,
      location: property.location,
      owner: property.owner
        ? {
            id: property.owner.id,
            name: property.owner.name,
            email: property.owner.email,
            phone: property.owner.phone,
          }
        : null,
      serviceChargeAmount: property.serviceChargeAmount ?? 0,
      garbageFeeAmount: property.garbageFeeAmount ?? 0,
      accountBalance,
      totalUnits: summary.totalUnits,
      createdUnits: summary.createdUnits,
      uncreatedUnits: summary.uncreatedUnits,
      occupiedUnits: summary.occupiedUnits,
      vacantUnits: summary.vacantUnits,
      occupancyRate: summary.occupancyRate,
      inventoryCompletionRate: summary.inventoryCompletionRate,
      monthlyRentPotential: summary.monthlyRentPotential,
      totalExpenses: summary.totalExpenses,
      activeMaintenanceCount: summary.activeMaintenanceCount,
      pendingInvoices: summary.pendingInvoices,
      invoiceExposure: summary.invoiceExposure,
      units: property.units.map((unit) => {
        const activeResident = unit.residents.find(
          (resident) => resident.status === ResidentStatus.ACTIVE,
        );

        return {
          id: unit.id,
          number: unit.number,
          rentAmount: Number(unit.rentAmount || 0),
          status: unit.status,
          activeResident: activeResident
            ? {
                id: activeResident.id,
                name: activeResident.user.name,
                email: activeResident.user.email,
                phone: activeResident.user.phone,
              }
            : null,
          latestInvoices: unit.rentInvoices.map((invoice) => ({
            id: invoice.id,
            period: invoice.period,
            status: invoice.status,
            totalAmount: Number(invoice.totalAmount || 0),
            paidAmount: Number(invoice.paidAmount || 0),
            outstandingAmount: Math.max(
              Number(invoice.totalAmount || 0) -
                Number(invoice.paidAmount || 0),
              0,
            ),
            dueDate: invoice.dueDate,
          })),
        };
      }),
      maintenanceRequests: property.maintenanceRequests.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        priority: item.priority,
        estimatedCost: Number(item.estimatedCost ?? 0),
        createdAt: item.createdAt,
      })),
      expenses: property.expenses.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        amount: Number(item.amount || 0),
        expenseDate: item.expenseDate,
        status: item.status,
      })),
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }

  async findForInvestor(investorId: string) {
    const properties = await this.prisma.property.findMany({
      where: { ownerId: investorId },
      include: this.investorPropertyInclude,
      orderBy: { createdAt: 'desc' },
    });

    const balances = await this.getComputedAccountBalances(
      properties.map((property) => property.account?.id).filter(Boolean) as string[],
    );

    return properties.map((property) => {
      const summary = this.mapPropertySummary(property);
      const accountBalance = balances.get(property.account?.id ?? '') ?? 0;

      return {
        id: property.id,
        title: property.title,
        location: property.location,
        manager: property.manager
          ? {
              id: property.manager.id,
              name: property.manager.name,
              email: property.manager.email,
              phone: property.manager.phone,
            }
          : null,
        serviceChargeAmount: property.serviceChargeAmount ?? 0,
        garbageFeeAmount: property.garbageFeeAmount ?? 0,
        accountBalance,
        marketValue: property.marketValue ?? 0,
        marketPricePerShare: property.marketPricePerShare ?? 0,
        valuationCapRate: property.valuationCapRate ?? 0,
        totalUnits: summary.totalUnits,
        createdUnits: summary.createdUnits,
        uncreatedUnits: summary.uncreatedUnits,
        occupiedUnits: summary.occupiedUnits,
        vacantUnits: summary.vacantUnits,
        occupancyRate: summary.occupancyRate,
        inventoryCompletionRate: summary.inventoryCompletionRate,
        monthlyRentPotential: summary.monthlyRentPotential,
        activeMaintenanceCount: summary.activeMaintenanceCount,
        pendingInvoices: summary.pendingInvoices,
        invoiceExposure: summary.invoiceExposure,
        investmentOffer: property.investmentOffer
          ? {
              id: property.investmentOffer.id,
              totalShares: property.investmentOffer.totalShares,
              pricePerShare: property.investmentOffer.pricePerShare,
              sharesSold: property.investmentOffer.sharesSold,
              isActive: property.investmentOffer.isActive,
            }
          : null,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      };
    });
  }

  async findOneForInvestor(id: string, investorId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, ownerId: investorId },
      include: this.investorPropertyDetailInclude,
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const summary = this.mapPropertySummary(property);
    const accountBalance = await this.getComputedAccountBalance(
      property.account?.id,
    );

    return {
      id: property.id,
      title: property.title,
      location: property.location,
      manager: property.manager
        ? {
            id: property.manager.id,
            name: property.manager.name,
            email: property.manager.email,
            phone: property.manager.phone,
          }
        : null,
      serviceChargeAmount: property.serviceChargeAmount ?? 0,
      garbageFeeAmount: property.garbageFeeAmount ?? 0,
      accountBalance,
      marketValue: property.marketValue ?? 0,
      marketPricePerShare: property.marketPricePerShare ?? 0,
      valuationCapRate: property.valuationCapRate ?? 0,
      totalUnits: summary.totalUnits,
      createdUnits: summary.createdUnits,
      uncreatedUnits: summary.uncreatedUnits,
      occupiedUnits: summary.occupiedUnits,
      vacantUnits: summary.vacantUnits,
      occupancyRate: summary.occupancyRate,
      inventoryCompletionRate: summary.inventoryCompletionRate,
      monthlyRentPotential: summary.monthlyRentPotential,
      totalExpenses: summary.totalExpenses,
      totalInvestments: summary.totalInvestments,
      totalDistributedProfit: summary.totalDistributedProfit,
      activeMaintenanceCount: summary.activeMaintenanceCount,
      pendingInvoices: summary.pendingInvoices,
      invoiceExposure: summary.invoiceExposure,
      units: property.units.map((unit) => {
        const activeResident = unit.residents.find(
          (resident) => resident.status === ResidentStatus.ACTIVE,
        );

        return {
          id: unit.id,
          number: unit.number,
          rentAmount: Number(unit.rentAmount || 0),
          status: unit.status,
          activeResident: activeResident
            ? {
                id: activeResident.id,
                name: activeResident.user.name,
                email: activeResident.user.email,
                phone: activeResident.user.phone,
              }
            : null,
          latestInvoices: unit.rentInvoices.map((invoice) => ({
            id: invoice.id,
            period: invoice.period,
            status: invoice.status,
            totalAmount: Number(invoice.totalAmount || 0),
            paidAmount: Number(invoice.paidAmount || 0),
            outstandingAmount: Math.max(
              Number(invoice.totalAmount || 0) -
                Number(invoice.paidAmount || 0),
              0,
            ),
            dueDate: invoice.dueDate,
          })),
        };
      }),
      maintenanceRequests: property.maintenanceRequests.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        priority: item.priority,
        estimatedCost: Number(item.estimatedCost ?? 0),
        createdAt: item.createdAt,
      })),
      expenses: property.expenses.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        amount: Number(item.amount || 0),
        expenseDate: item.expenseDate,
        status: item.status,
      })),
      investmentOffer: property.investmentOffer
        ? {
            id: property.investmentOffer.id,
            totalShares: property.investmentOffer.totalShares,
            pricePerShare: property.investmentOffer.pricePerShare,
            sharesSold: property.investmentOffer.sharesSold,
            isActive: property.investmentOffer.isActive,
          }
        : null,
      shares: property.shares.map((share) => ({
        id: share.id,
        investorId: share.investorId,
        sharesOwned: share.sharesOwned,
        amountPaid: Number(share.amountPaid || 0),
        source: share.source,
        createdAt: share.createdAt,
      })),
      profitDistributions: property.profitDistributions.map((item) => ({
        id: item.id,
        investorId: item.investorId,
        amount: Number(item.amount || 0),
        periodMonth: item.periodMonth,
        periodYear: item.periodYear,
        createdAt: item.createdAt,
      })),
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }

  async findAll() {
    const properties = await this.prisma.property.findMany({
      include: this.adminPropertyInclude,
      orderBy: { createdAt: 'desc' },
    });

    const balances = await this.getComputedAccountBalances(
      properties.map((property) => property.account?.id).filter(Boolean) as string[],
    );

    const items = properties.map((property) => {
      const summary = this.mapPropertySummary(property);
      const accountBalance = balances.get(property.account?.id ?? '') ?? 0;

      return {
        id: property.id,
        title: property.title,
        location: property.location,
        owner: property.owner
          ? {
              id: property.owner.id,
              name: property.owner.name,
              email: property.owner.email,
              phone: property.owner.phone,
            }
          : null,
        manager: property.manager
          ? {
              id: property.manager.id,
              name: property.manager.name,
              email: property.manager.email,
              phone: property.manager.phone,
            }
          : null,
        serviceChargeAmount: Number(property.serviceChargeAmount ?? 0),
        garbageFeeAmount: Number(property.garbageFeeAmount ?? 0),
        accountBalance,
        marketValue: Number(property.marketValue ?? 0),
        marketPricePerShare: Number(property.marketPricePerShare ?? 0),
        valuationCapRate: Number(property.valuationCapRate ?? 0),
        valuationUpdatedAt: property.valuationUpdatedAt,
        valuationUpdatedBy: property.valuationUpdatedBy,
        investmentOffer: property.investmentOffer
          ? {
              id: property.investmentOffer.id,
              totalShares: Number(property.investmentOffer.totalShares ?? 0),
              pricePerShare: Number(property.investmentOffer.pricePerShare ?? 0),
              sharesSold: Number(property.investmentOffer.sharesSold ?? 0),
              isActive: property.investmentOffer.isActive,
            }
          : null,
        metrics: summary,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      };
    });

    const totalUnits = items.reduce(
      (sum, item) => sum + item.metrics.totalUnits,
      0,
    );

    const occupiedUnits = items.reduce(
      (sum, item) => sum + item.metrics.occupiedUnits,
      0,
    );

    const vacantUnits = items.reduce(
      (sum, item) => sum + item.metrics.vacantUnits,
      0,
    );

    return {
      summary: {
        totalProperties: items.length,
        withManagers: items.filter((item) => item.manager).length,
        withoutManagers: items.filter((item) => !item.manager).length,
        totalUnits,
        createdUnits: items.reduce(
          (sum, item) => sum + item.metrics.createdUnits,
          0,
        ),
        uncreatedUnits: items.reduce(
          (sum, item) => sum + item.metrics.uncreatedUnits,
          0,
        ),
        occupiedUnits,
        vacantUnits,
        averageOccupancyRate:
          totalUnits > 0
            ? Number(((occupiedUnits / totalUnits) * 100).toFixed(1))
            : 0,
        totalAccountBalance: items.reduce(
          (sum, item) => sum + Number(item.accountBalance || 0),
          0,
        ),
        totalMonthlyRentPotential: items.reduce(
          (sum, item) => sum + Number(item.metrics.monthlyRentPotential || 0),
          0,
        ),
        totalInvoiceExposure: items.reduce(
          (sum, item) => sum + Number(item.metrics.invoiceExposure || 0),
          0,
        ),
        activeMaintenanceCount: items.reduce(
          (sum, item) =>
            sum + Number(item.metrics.activeMaintenanceCount || 0),
          0,
        ),
        totalMarketValue: items.reduce(
          (sum, item) => sum + Number(item.marketValue || 0),
          0,
        ),
      },
      properties: items,
    };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: this.adminPropertyInclude,
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const summary = this.mapPropertySummary(property);
    const accountBalance = await this.getComputedAccountBalance(
      property.account?.id,
    );

    return {
      id: property.id,
      title: property.title,
      location: property.location,
      owner: property.owner
        ? {
            id: property.owner.id,
            name: property.owner.name,
            email: property.owner.email,
            phone: property.owner.phone,
          }
        : null,
      manager: property.manager
        ? {
            id: property.manager.id,
            name: property.manager.name,
            email: property.manager.email,
            phone: property.manager.phone,
          }
        : null,
      serviceChargeAmount: Number(property.serviceChargeAmount ?? 0),
      garbageFeeAmount: Number(property.garbageFeeAmount ?? 0),
      accountBalance,
      marketValue: Number(property.marketValue ?? 0),
      marketPricePerShare: Number(property.marketPricePerShare ?? 0),
      valuationCapRate: Number(property.valuationCapRate ?? 0),
      valuationUpdatedAt: property.valuationUpdatedAt,
      valuationUpdatedBy: property.valuationUpdatedBy,
      investmentOffer: property.investmentOffer
        ? {
            id: property.investmentOffer.id,
            totalShares: Number(property.investmentOffer.totalShares ?? 0),
            pricePerShare: Number(property.investmentOffer.pricePerShare ?? 0),
            sharesSold: Number(property.investmentOffer.sharesSold ?? 0),
            isActive: property.investmentOffer.isActive,
          }
        : null,
      metrics: summary,
      units: property.units.map((unit) => {
        const activeResident = unit.residents.find(
          (resident) => resident.status === ResidentStatus.ACTIVE,
        );

        const invoiceExposure = unit.rentInvoices.reduce(
          (sum, invoice) =>
            sum +
            Math.max(
              Number(invoice.totalAmount || 0) -
                Number(invoice.paidAmount || 0),
              0,
            ),
          0,
        );

        return {
          id: unit.id,
          number: unit.number,
          status: unit.status,
          rentAmount: Number(unit.rentAmount || 0),
          invoiceExposure,
          pendingInvoices: unit.rentInvoices.length,
          activeResident: activeResident
            ? {
                id: activeResident.id,
                name: activeResident.user.name,
                email: activeResident.user.email,
                phone: activeResident.user.phone,
              }
            : null,
        };
      }),
      maintenanceRequests: property.maintenanceRequests.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        priority: item.priority,
        estimatedCost: Number(item.estimatedCost ?? 0),
        createdAt: item.createdAt,
      })),
      expenses: property.expenses.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        amount: Number(item.amount || 0),
        status: item.status,
        expenseDate: item.expenseDate,
      })),
      shares: property.shares.map((share) => ({
        id: share.id,
        investorId: share.investorId,
        sharesOwned: Number(share.sharesOwned ?? 0),
        amountPaid: Number(share.amountPaid || 0),
        source: share.source,
        createdAt: share.createdAt,
      })),
      investments: property.investments.map((item) => ({
        id: item.id,
        investorId: item.investorId,
        amount: Number(item.amount || 0),
        createdAt: item.createdAt,
      })),
      profitDistributions: property.profitDistributions.map((item) => ({
        id: item.id,
        investorId: item.investorId,
        amount: Number(item.amount || 0),
        periodMonth: item.periodMonth,
        periodYear: item.periodYear,
        createdAt: item.createdAt,
      })),
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }

  async assertManagerOwnership(propertyId: string, userId: string, role: Role) {
    if (role === Role.ADMIN) return;

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { managerId: true },
    });

    if (!property || property.managerId !== userId) {
      throw new ForbiddenException('You are not the manager of this property');
    }
  }

  async assertInvestorOwnership(propertyId: string, userId: string, role: Role) {
    if (role === Role.ADMIN) return;

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property || property.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this property');
    }
  }
}