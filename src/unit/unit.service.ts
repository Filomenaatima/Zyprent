import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { Role, ResidentStatus, UnitStatus } from '@prisma/client';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUnitDto, userId: string, role: Role) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (role !== Role.ADMIN && property.managerId !== userId) {
      throw new ForbiddenException(
        'You are not the manager of this property',
      );
    }

    return this.prisma.unit.create({
      data: {
        number: dto.number,
        rentAmount: dto.rentAmount,
        propertyId: dto.propertyId,
      },
    });
  }

  async findAll() {
    const units = await this.prisma.unit.findMany({
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
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
        residents: {
          where: {
            status: ResidentStatus.ACTIVE,
          },
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
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        rentInvoices: {
          where: {
            status: {
              in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'],
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: [{ property: { createdAt: 'desc' } }, { number: 'asc' }],
    });

    const items = units.map((unit) => {
      const activeResident = unit.residents[0] ?? null;

      const invoiceExposure = unit.rentInvoices.reduce(
        (sum, invoice) =>
          sum +
          (Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0)),
        0,
      );

      return {
        id: unit.id,
        number: unit.number,
        rentAmount: Number(unit.rentAmount || 0),
        status: unit.status,
        property: unit.property
          ? {
              id: unit.property.id,
              title: unit.property.title,
              location: unit.property.location,
            }
          : null,
        manager: unit.property?.manager
          ? {
              id: unit.property.manager.id,
              name: unit.property.manager.name,
              email: unit.property.manager.email,
              phone: unit.property.manager.phone,
            }
          : null,
        owner: unit.property?.owner
          ? {
              id: unit.property.owner.id,
              name: unit.property.owner.name,
              email: unit.property.owner.email,
              phone: unit.property.owner.phone,
            }
          : null,
        activeResident: activeResident
          ? {
              id: activeResident.id,
              status: activeResident.status,
              user: {
                id: activeResident.user.id,
                name: activeResident.user.name,
                email: activeResident.user.email,
                phone: activeResident.user.phone,
              },
            }
          : null,
        pendingInvoices: unit.rentInvoices.length,
        invoiceExposure,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
      };
    });

    const summary = {
      totalUnits: items.length,
      occupiedUnits: items.filter((item) => item.status === UnitStatus.OCCUPIED)
        .length,
      vacantUnits: items.filter((item) => item.status === UnitStatus.VACANT)
        .length,
      assignedResidents: items.filter((item) => item.activeResident).length,
      unassignedUnits: items.filter((item) => !item.activeResident).length,
      totalRentPotential: items.reduce(
        (sum, item) => sum + Number(item.rentAmount || 0),
        0,
      ),
      totalInvoiceExposure: items.reduce(
        (sum, item) => sum + Number(item.invoiceExposure || 0),
        0,
      ),
      unitsWithPendingInvoices: items.filter((item) => item.pendingInvoices > 0)
        .length,
    };

    return {
      summary,
      units: items,
    };
  }

  async findForManager(managerId: string) {
    return this.prisma.unit.findMany({
      where: {
        property: {
          managerId,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
        residents: {
          where: {
            status: ResidentStatus.ACTIVE,
          },
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
      },
      orderBy: [{ property: { createdAt: 'desc' } }, { number: 'asc' }],
    });
  }

  async findByProperty(propertyId: string) {
    return this.prisma.unit.findMany({
      where: { propertyId },
      include: {
        residents: {
          where: {
            status: ResidentStatus.ACTIVE,
          },
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
      },
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
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
        residents: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        rentInvoices: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    const activeResident =
      unit.residents.find((resident) => resident.status === ResidentStatus.ACTIVE) ??
      null;

    const invoiceExposure = unit.rentInvoices
      .filter((invoice) =>
        ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status),
      )
      .reduce(
        (sum, invoice) =>
          sum +
          (Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0)),
        0,
      );

    return {
      id: unit.id,
      number: unit.number,
      rentAmount: Number(unit.rentAmount || 0),
      status: unit.status,
      property: unit.property
        ? {
            id: unit.property.id,
            title: unit.property.title,
            location: unit.property.location,
            manager: unit.property.manager
              ? {
                  id: unit.property.manager.id,
                  name: unit.property.manager.name,
                  email: unit.property.manager.email,
                  phone: unit.property.manager.phone,
                }
              : null,
            owner: unit.property.owner
              ? {
                  id: unit.property.owner.id,
                  name: unit.property.owner.name,
                  email: unit.property.owner.email,
                  phone: unit.property.owner.phone,
                }
              : null,
          }
        : null,
      activeResident: activeResident
        ? {
            id: activeResident.id,
            status: activeResident.status,
            moveOutDate: activeResident.moveOutDate,
            user: {
              id: activeResident.user.id,
              name: activeResident.user.name,
              email: activeResident.user.email,
              phone: activeResident.user.phone,
            },
          }
        : null,
      residentHistory: unit.residents.map((resident) => ({
        id: resident.id,
        status: resident.status,
        moveOutDate: resident.moveOutDate,
        createdAt: resident.createdAt,
        user: {
          id: resident.user.id,
          name: resident.user.name,
          email: resident.user.email,
          phone: resident.user.phone,
        },
      })),
      pendingInvoices: unit.rentInvoices
        .filter((invoice) =>
          ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status),
        )
        .map((invoice) => ({
          id: invoice.id,
          period: invoice.period,
          status: invoice.status,
          totalAmount: Number(invoice.totalAmount || 0),
          paidAmount: Number(invoice.paidAmount || 0),
          dueDate: invoice.dueDate,
        })),
      invoiceExposure,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }

  async remove(id: string, userId: string, role: Role) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: { property: true, residents: true },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    if (unit.residents.some((resident) => resident.unitId === id)) {
      throw new ForbiddenException(
        'Cannot delete a unit that still has resident history attached. Move out or reassign residents first.',
      );
    }

    if (role === Role.ADMIN) {
      return this.prisma.unit.delete({
        where: { id },
      });
    }

    if (unit.property.managerId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this unit',
      );
    }

    return this.prisma.unit.delete({
      where: { id },
    });
  }
}