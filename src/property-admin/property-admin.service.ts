import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertyAdminService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeTitle(value: string) {
    return value.trim().replace(/\s+/g, ' ');
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private buildSlug(title: string, phase: number) {
    if (phase === 1) {
      return this.slugify(title);
    }

    return `${this.slugify(title)}-phase-${phase}`;
  }

  async findAll() {
    return this.prisma.property.findMany({
      orderBy: [{ title: 'asc' }, { phase: 'asc' }],
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        units: true,
        investmentOffer: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async create(dto: CreatePropertyDto) {
    const title = this.normalizeTitle(dto.title);
    const phase = dto.phase ?? 1;
    const version = dto.version ?? 1;
    const slug = this.buildSlug(title, phase);

    const duplicate = await this.prisma.property.findFirst({
      where: {
        OR: [{ slug }, { title, phase }],
      },
    });

    if (duplicate) {
      throw new BadRequestException(
        `Property already exists: ${title} Phase ${phase}`,
      );
    }

    return this.prisma.property.create({
      data: {
        title,
        slug,
        location: dto.location,
        phase,
        version,
        isActive: dto.isActive ?? true,
        managerId: dto.managerId,
        serviceChargeAmount: dto.serviceChargeAmount ?? 0,
        garbageFeeAmount: dto.garbageFeeAmount ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdatePropertyDto) {
    const existing = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    const title = dto.title
      ? this.normalizeTitle(dto.title)
      : existing.title;

    const phase = dto.phase ?? existing.phase;
    const slug = this.buildSlug(title, phase);

    const duplicate = await this.prisma.property.findFirst({
      where: {
        id: { not: id },
        OR: [{ slug }, { title, phase }],
      },
    });

    if (duplicate) {
      throw new BadRequestException(
        `Another property already exists: ${title} Phase ${phase}`,
      );
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        title,
        slug,
        location: dto.location ?? existing.location,
        phase,
        version: dto.version ?? existing.version,
        isActive: dto.isActive ?? existing.isActive,
        managerId: dto.managerId ?? existing.managerId,
        serviceChargeAmount:
          dto.serviceChargeAmount ?? existing.serviceChargeAmount,
        garbageFeeAmount:
          dto.garbageFeeAmount ?? existing.garbageFeeAmount,
      },
    });
  }

  async deactivate(id: string) {
    const existing = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}