import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UnitStatus,
  ResidentStatus,
  Role,
} from '@prisma/client';

@Injectable()
export class ResidentService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const residents = await this.prisma.resident.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      summary: {
        totalResidents: residents.length,
        activeResidents: residents.filter(
          (resident) => resident.status === ResidentStatus.ACTIVE,
        ).length,
        inactiveResidents: residents.filter(
          (resident) => resident.status === ResidentStatus.INACTIVE,
        ).length,
        movedOutResidents: residents.filter(
          (resident) => resident.status === ResidentStatus.MOVED_OUT,
        ).length,
        transferredResidents: residents.filter(
          (resident) => resident.status === ResidentStatus.TRANSFERRED,
        ).length,
        assignedResidents: residents.filter((resident) => resident.unitId).length,
        unassignedResidents: residents.filter((resident) => !resident.unitId)
          .length,
      },
      residents,
    };
  }

  async findForManager(managerId: string) {
    return this.prisma.resident.findMany({
      where: {
        OR: [
          {
            createdById: managerId,
          },
          {
            unit: {
              property: {
                managerId,
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async assignToUnit(
    residentId: string,
    unitId: string,
    managerId: string,
  ) {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
      include: {
        user: true,
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    if (resident.createdById !== managerId) {
      throw new ForbiddenException(
        'You can only assign residents you created',
      );
    }

    if (resident.unitId) {
      throw new BadRequestException(
        'Resident already assigned to a unit',
      );
    }

    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { property: true },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    if (unit.property.managerId !== managerId) {
      throw new ForbiddenException(
        'You cannot assign residents to this property',
      );
    }

    if (unit.status === UnitStatus.OCCUPIED) {
      throw new BadRequestException('Unit is already occupied');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.unit.update({
        where: { id: unitId },
        data: { status: UnitStatus.OCCUPIED },
      });

      return tx.resident.update({
        where: { id: residentId },
        data: {
          unitId,
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
          unit: {
            include: {
              property: true,
            },
          },
        },
      });
    });
  }

  async moveOut(residentId: string, managerId: string) {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    if (!resident.unitId || !resident.unit) {
      throw new BadRequestException(
        'Resident is not assigned to any unit',
      );
    }

    if (resident.unit.property.managerId !== managerId) {
      throw new ForbiddenException(
        'You cannot move out residents from this property',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.unit.update({
        where: { id: resident.unitId! },
        data: { status: UnitStatus.VACANT },
      });

      return tx.resident.update({
        where: { id: residentId },
        data: {
          status: ResidentStatus.MOVED_OUT,
          moveOutDate: new Date(),
          unitId: null,
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
      });
    });
  }

  async transfer(
    residentId: string,
    newUnitId: string,
    managerId: string,
  ) {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    if (!resident.unitId || !resident.unit) {
      throw new BadRequestException(
        'Resident is not assigned to any unit',
      );
    }

    if (resident.unit.property.managerId !== managerId) {
      throw new ForbiddenException(
        'You cannot transfer residents from this property',
      );
    }

    const newUnit = await this.prisma.unit.findUnique({
      where: { id: newUnitId },
      include: { property: true },
    });

    if (!newUnit) {
      throw new NotFoundException('New unit not found');
    }

    if (newUnit.property.managerId !== managerId) {
      throw new ForbiddenException(
        'You cannot transfer to this property',
      );
    }

    if (newUnit.status === UnitStatus.OCCUPIED) {
      throw new BadRequestException(
        'New unit is already occupied',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.unit.update({
        where: { id: resident.unitId! },
        data: { status: UnitStatus.VACANT },
      });

      await tx.unit.update({
        where: { id: newUnitId },
        data: { status: UnitStatus.OCCUPIED },
      });

      return tx.resident.update({
        where: { id: residentId },
        data: {
          unitId: newUnitId,
          status: ResidentStatus.TRANSFERRED,
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
          unit: {
            include: {
              property: true,
            },
          },
        },
      });
    });
  }

  async findOne(id: string, actorUserId?: string, actorRole?: Role) {
    const resident = await this.prisma.resident.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
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
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    if (actorRole && actorRole !== Role.ADMIN) {
      const canAccess =
        resident.createdById === actorUserId ||
        resident.unit?.property?.managerId === actorUserId;

      if (!canAccess) {
        throw new ForbiddenException('You are not allowed to access this resident');
      }
    }

    return resident;
  }
}