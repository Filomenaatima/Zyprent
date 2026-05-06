import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRentContractDto } from './dto/create-rent-contract.dto';
import {
  Prisma,
  UnitStatus,
  ResidentStatus,
  Role,
  InvoiceStatus,
} from '@prisma/client';

@Injectable()
export class RentContractService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertManagerAccessToUnit(
    unitId: string,
    actorUserId: string,
    actorRole: Role,
  ) {
    if (actorRole === Role.ADMIN) return;

    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        property: {
          select: {
            managerId: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    if (unit.property?.managerId !== actorUserId) {
      throw new ForbiddenException(
        'You are not allowed to create a contract for this unit',
      );
    }
  }

  private async assertContractAccess(
    contractId: string,
    actorUserId: string,
    actorRole: Role,
  ) {
    if (actorRole === Role.ADMIN) return;

    const contract = await this.prisma.rentContract.findUnique({
      where: { id: contractId },
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
      throw new NotFoundException('Contract not found');
    }

    if (contract.unit.property?.managerId !== actorUserId) {
      throw new ForbiddenException(
        'You are not allowed to access this contract',
      );
    }
  }

  private mapContractListItem(contract: any) {
    const latestInvoice = contract.invoices?.[0] ?? null;

    const invoiceExposure = (contract.invoices || []).reduce(
      (sum: number, invoice: any) =>
        sum +
        (Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0)),
      0,
    );

    const monthsRunning = Math.max(
      0,
      (new Date().getFullYear() - new Date(contract.startDate).getFullYear()) *
        12 +
        (new Date().getMonth() - new Date(contract.startDate).getMonth()),
    );

    const estimatedEndDate = new Date(contract.startDate);
    estimatedEndDate.setMonth(
      estimatedEndDate.getMonth() + Number(contract.initialTermMonths || 0),
    );

    const isNearRenewal =
      contract.isActive &&
      estimatedEndDate.getTime() - Date.now() <= 45 * 24 * 60 * 60 * 1000 &&
      estimatedEndDate.getTime() > Date.now();

    return {
      id: contract.id,
      resident: contract.resident
        ? {
            id: contract.resident.id,
            status: contract.resident.status,
            moveOutDate: contract.resident.moveOutDate,
            user: contract.resident.user
              ? {
                  id: contract.resident.user.id,
                  name: contract.resident.user.name,
                  email: contract.resident.user.email,
                  phone: contract.resident.user.phone,
                }
              : null,
          }
        : null,
      unit: contract.unit
        ? {
            id: contract.unit.id,
            number: contract.unit.number,
            rentAmount: Number(contract.unit.rentAmount || 0),
            status: contract.unit.status,
            property: contract.unit.property
              ? {
                  id: contract.unit.property.id,
                  title: contract.unit.property.title,
                  location: contract.unit.property.location,
                  managerId: contract.unit.property.managerId,
                }
              : null,
          }
        : null,
      rentAmount: Number(contract.rentAmount || 0),
      depositAmount: Number(contract.depositAmount || 0),
      serviceCharge: Number(contract.serviceCharge || 0),
      garbageFee: Number(contract.garbageFee || 0),
      billingAnchorDay: Number(contract.billingAnchorDay || 0),
      nextBillingDate: contract.nextBillingDate,
      initialTermMonths: Number(contract.initialTermMonths || 0),
      startDate: contract.startDate,
      isActive: contract.isActive,
      latestInvoice: latestInvoice
        ? {
            id: latestInvoice.id,
            status: latestInvoice.status,
            totalAmount: Number(latestInvoice.totalAmount || 0),
            paidAmount: Number(latestInvoice.paidAmount || 0),
            dueDate: latestInvoice.dueDate,
            period: latestInvoice.period,
          }
        : null,
      invoiceExposure,
      monthsRunning,
      estimatedEndDate,
      isNearRenewal,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
    };
  }

  async create(
    dto: CreateRentContractDto,
    actorUserId: string,
    actorRole: Role,
  ) {
    await this.assertManagerAccessToUnit(dto.unitId, actorUserId, actorRole);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      let resident = await tx.resident.findFirst({
        where: { userId: dto.userId },
      });

      if (!resident) {
        resident = await tx.resident.create({
          data: {
            userId: dto.userId,
            status: ResidentStatus.ACTIVE,
          },
        });
      }

      const unit = await tx.unit.findUnique({
        where: { id: dto.unitId },
        include: {
          property: true,
        },
      });

      if (!unit) {
        throw new NotFoundException('Unit not found');
      }

      if (unit.status !== UnitStatus.VACANT) {
        throw new BadRequestException('Unit is not available for leasing');
      }

      if (
        actorRole !== Role.ADMIN &&
        unit.property?.managerId !== actorUserId
      ) {
        throw new ForbiddenException(
          'You are not allowed to lease this unit',
        );
      }

      const existingResidentContract = await tx.rentContract.findFirst({
        where: {
          residentId: resident.id,
          isActive: true,
        },
      });

      if (existingResidentContract) {
        throw new BadRequestException(
          'Resident already has an active contract',
        );
      }

      const existingUnitContract = await tx.rentContract.findFirst({
        where: {
          unitId: dto.unitId,
          isActive: true,
        },
      });

      if (existingUnitContract) {
        throw new BadRequestException(
          'Unit already has an active contract',
        );
      }

      const startDate = new Date(dto.startDate);

      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date');
      }

      const billingAnchorDay = dto.billingAnchorDay ?? startDate.getDate();

      if (billingAnchorDay < 1 || billingAnchorDay > 28) {
        throw new BadRequestException(
          'billingAnchorDay must be between 1 and 28',
        );
      }

      const nextBillingDate = dto.nextBillingDate
        ? new Date(dto.nextBillingDate)
        : new Date(startDate);

      if (isNaN(nextBillingDate.getTime())) {
        throw new BadRequestException('Invalid nextBillingDate');
      }

      const serviceCharge = dto.serviceCharge ?? 0;
      const garbageFee = dto.garbageFee ?? 0;

      const contract = await tx.rentContract.create({
        data: {
          residentId: resident.id,
          unitId: dto.unitId,
          rentAmount: new Prisma.Decimal(dto.rentAmount),
          depositAmount: new Prisma.Decimal(dto.depositAmount),
          serviceCharge: new Prisma.Decimal(serviceCharge),
          garbageFee: new Prisma.Decimal(garbageFee),
          initialTermMonths: dto.initialTermMonths,
          startDate,
          billingAnchorDay,
          nextBillingDate,
          isActive: true,
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
          invoices: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      await tx.unit.update({
        where: { id: dto.unitId },
        data: { status: UnitStatus.OCCUPIED },
      });

      await tx.resident.update({
        where: { id: resident.id },
        data: {
          unitId: dto.unitId,
          status: ResidentStatus.ACTIVE,
        },
      });

      return this.mapContractListItem(contract);
    });
  }

  async findAll() {
    const contracts = await this.prisma.rentContract.findMany({
      orderBy: { createdAt: 'desc' },
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
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    const items = contracts.map((contract) => this.mapContractListItem(contract));

    const summary = {
      totalContracts: items.length,
      activeContracts: items.filter((item) => item.isActive).length,
      inactiveContracts: items.filter((item) => !item.isActive).length,
      totalRentRoll: items
        .filter((item) => item.isActive)
        .reduce((sum, item) => sum + Number(item.rentAmount || 0), 0),
      totalDepositsHeld: items
        .filter((item) => item.isActive)
        .reduce((sum, item) => sum + Number(item.depositAmount || 0), 0),
      totalInvoiceExposure: items.reduce(
        (sum, item) => sum + Number(item.invoiceExposure || 0),
        0,
      ),
      contractsWithOverdueInvoices: items.filter(
        (item) => item.latestInvoice?.status === InvoiceStatus.OVERDUE,
      ).length,
      contractsNearRenewal: items.filter((item) => item.isNearRenewal).length,
    };

    return {
      summary,
      contracts: items,
    };
  }

  async findForManager(managerId: string) {
    const contracts = await this.prisma.rentContract.findMany({
      where: {
        unit: {
          property: {
            managerId,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    const items = contracts.map((contract) => this.mapContractListItem(contract));

    const summary = {
      totalContracts: items.length,
      activeContracts: items.filter((item) => item.isActive).length,
      inactiveContracts: items.filter((item) => !item.isActive).length,
      totalRentRoll: items
        .filter((item) => item.isActive)
        .reduce((sum, item) => sum + Number(item.rentAmount || 0), 0),
      totalInvoiceExposure: items.reduce(
        (sum, item) => sum + Number(item.invoiceExposure || 0),
        0,
      ),
      contractsNearRenewal: items.filter((item) => item.isNearRenewal).length,
    };

    return {
      summary,
      contracts: items,
    };
  }

  async findOne(id: string, actorUserId: string, actorRole: Role) {
    await this.assertContractAccess(id, actorUserId, actorRole);

    const contract = await this.prisma.rentContract.findUnique({
      where: { id },
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
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
                manager: {
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
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const mapped = this.mapContractListItem(contract);

    return {
      ...mapped,
      unit: contract.unit
        ? {
            ...mapped.unit,
            property: contract.unit.property
              ? {
                  id: contract.unit.property.id,
                  title: contract.unit.property.title,
                  location: contract.unit.property.location,
                  managerId: contract.unit.property.managerId,
                  owner: contract.unit.property.owner,
                  manager: contract.unit.property.manager,
                }
              : null,
          }
        : null,
      invoices: contract.invoices.map((invoice) => ({
        id: invoice.id,
        period: invoice.period,
        status: invoice.status,
        totalAmount: Number(invoice.totalAmount || 0),
        paidAmount: Number(invoice.paidAmount || 0),
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt,
      })),
    };
  }

  async terminate(id: string, actorUserId: string, actorRole: Role) {
    await this.assertContractAccess(id, actorUserId, actorRole);

    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.rentContract.findUnique({
        where: { id },
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
          invoices: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!contract) {
        throw new NotFoundException('Contract not found');
      }

      if (!contract.isActive) {
        throw new BadRequestException('Contract is already inactive');
      }

      const updatedContract = await tx.rentContract.update({
        where: { id },
        data: {
          isActive: false,
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
          invoices: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      await tx.unit.update({
        where: { id: contract.unitId },
        data: {
          status: UnitStatus.VACANT,
        },
      });

      await tx.resident.update({
        where: { id: contract.residentId },
        data: {
          unitId: null,
          status: ResidentStatus.MOVED_OUT,
          moveOutDate: new Date(),
        },
      });

      return this.mapContractListItem(updatedContract);
    });
  }
}