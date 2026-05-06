import {
  ForbiddenException,
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  Role,
  ResidentStatus,
  AccountType,
  SubscriptionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * =========================================
   * ADMIN: LIST ALL USERS
   * =========================================
   */
  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          select: {
            balance: true,
          },
        },
        account: {
          select: {
            balance: true,
            type: true,
          },
        },
        residentProfile: {
          select: {
            id: true,
            status: true,
            moveOutDate: true,
            unit: {
              select: {
                id: true,
                number: true,
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
        providerProfile: {
          select: {
            id: true,
            type: true,
            isActive: true,
            verificationStatus: true,
            companyName: true,
            city: true,
            rating: true,
            reviewCount: true,
            serviceRadiusKm: true,
            source: true,
          },
        },
        kycVerification: {
          select: {
            id: true,
            fullName: true,
            nationality: true,
            idType: true,
            status: true,
            reviewedAt: true,
            createdAt: true,
          },
        },
        sharesOwned: {
          select: {
            id: true,
            sharesOwned: true,
            amountPaid: true,
            property: {
              select: {
                id: true,
                title: true,
                location: true,
              },
            },
          },
        },
        ownedProperties: {
          select: {
            id: true,
            title: true,
            location: true,
            phase: true,
            isActive: true,
          },
        },
        managedProperties: {
          select: {
            id: true,
            title: true,
            location: true,
            phase: true,
            isActive: true,
          },
        },
        subscriptions: {
          select: {
            id: true,
            status: true,
            currentPeriodEnd: true,
            startedAt: true,
            plan: {
              select: {
                id: true,
                name: true,
                billingInterval: true,
                price: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const summary = {
      totalUsers: users.length,
      admins: users.filter((user) => user.role === Role.ADMIN).length,
      managers: users.filter((user) => user.role === Role.MANAGER).length,
      investors: users.filter((user) => user.role === Role.INVESTOR).length,
      residents: users.filter((user) => user.role === Role.RESIDENT).length,
      providers: users.filter((user) => user.role === Role.SERVICE_PROVIDER)
        .length,
      verifiedProviders: users.filter(
        (user) =>
          user.role === Role.SERVICE_PROVIDER &&
          user.providerProfile?.verificationStatus === 'VERIFIED',
      ).length,
      pendingKyc: users.filter(
        (user) => user.kycVerification?.status === 'PENDING',
      ).length,
      activeResidents: users.filter(
        (user) => user.residentProfile?.status === ResidentStatus.ACTIVE,
      ).length,
      activeSubscriptions: users.filter((user) =>
        user.subscriptions.some(
          (subscription) => subscription.status === SubscriptionStatus.ACTIVE,
        ),
      ).length,
    };

    return {
      summary,
      users: users.map((user) => {
        const latestSubscription = user.subscriptions[0] ?? null;
        const totalSharesOwned = user.sharesOwned.reduce(
          (sum, item) => sum + Number(item.sharesOwned ?? 0),
          0,
        );
        const totalAmountInvested = user.sharesOwned.reduce(
          (sum, item) => sum + Number(item.amountPaid ?? 0),
          0,
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,

          walletBalance: Number(user.wallet?.balance ?? 0),
          accountBalance: Number(user.account?.balance ?? 0),

          residentProfile: user.residentProfile
            ? {
                id: user.residentProfile.id,
                status: user.residentProfile.status,
                moveOutDate: user.residentProfile.moveOutDate,
                unitId: user.residentProfile.unit?.id ?? null,
                unitNumber: user.residentProfile.unit?.number ?? null,
                propertyId: user.residentProfile.unit?.property?.id ?? null,
                propertyTitle:
                  user.residentProfile.unit?.property?.title ?? null,
                propertyLocation:
                  user.residentProfile.unit?.property?.location ?? null,
              }
            : null,

          providerProfile: user.providerProfile
            ? {
                id: user.providerProfile.id,
                type: user.providerProfile.type,
                isActive: user.providerProfile.isActive,
                verificationStatus: user.providerProfile.verificationStatus,
                companyName: user.providerProfile.companyName,
                city: user.providerProfile.city,
                rating: user.providerProfile.rating,
                reviewCount: user.providerProfile.reviewCount,
                serviceRadiusKm: user.providerProfile.serviceRadiusKm,
                source: user.providerProfile.source,
              }
            : null,

          kycVerification: user.kycVerification
            ? {
                id: user.kycVerification.id,
                fullName: user.kycVerification.fullName,
                nationality: user.kycVerification.nationality,
                idType: user.kycVerification.idType,
                status: user.kycVerification.status,
                reviewedAt: user.kycVerification.reviewedAt,
                createdAt: user.kycVerification.createdAt,
              }
            : null,

          investmentProfile: {
            totalHoldings: user.sharesOwned.length,
            totalSharesOwned,
            totalAmountInvested,
            holdings: user.sharesOwned.map((item) => ({
              id: item.id,
              sharesOwned: item.sharesOwned,
              amountPaid: item.amountPaid,
              propertyId: item.property.id,
              propertyTitle: item.property.title,
              propertyLocation: item.property.location,
            })),
          },

          ownershipProfile: {
            ownedPropertiesCount: user.ownedProperties.length,
            managedPropertiesCount: user.managedProperties.length,
            ownedProperties: user.ownedProperties,
            managedProperties: user.managedProperties,
          },

          subscription: latestSubscription
            ? {
                id: latestSubscription.id,
                status: latestSubscription.status,
                currentPeriodEnd: latestSubscription.currentPeriodEnd,
                startedAt: latestSubscription.startedAt,
                plan: latestSubscription.plan,
              }
            : null,
        };
      }),
    };
  }

  /**
   * =========================================
   * GET MY PROFILE
   * =========================================
   */
  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        account: true,
        kycVerification: true,
        sharesOwned: {
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
        residentProfile: {
          include: {
            unit: {
              include: {
                property: true,
              },
            },
          },
        },
        providerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalSharesOwned = user.sharesOwned.reduce(
      (sum, item) => sum + Number(item.sharesOwned || 0),
      0,
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      walletBalance: Number(user.wallet?.balance ?? 0),
      accountBalance: Number(user.account?.balance ?? 0),

      totalPropertiesHeld: user.sharesOwned.length,
      totalSharesOwned,

      kyc: user.kycVerification
        ? {
            id: user.kycVerification.id,
            fullName: user.kycVerification.fullName,
            nationality: user.kycVerification.nationality,
            idType: user.kycVerification.idType,
            status: user.kycVerification.status,
            reviewedAt: user.kycVerification.reviewedAt,
            createdAt: user.kycVerification.createdAt,
          }
        : null,

      residentProfile: user.residentProfile
        ? {
            id: user.residentProfile.id,
            status: user.residentProfile.status,
            unitNumber: user.residentProfile.unit?.number ?? null,
            propertyTitle: user.residentProfile.unit?.property?.title ?? null,
            propertyLocation:
              user.residentProfile.unit?.property?.location ?? null,
          }
        : null,

      providerProfile: user.providerProfile
        ? {
            id: user.providerProfile.id,
            type: user.providerProfile.type,
            verificationStatus: user.providerProfile.verificationStatus,
            companyName: user.providerProfile.companyName,
            city: user.providerProfile.city,
            rating: user.providerProfile.rating,
            reviewCount: user.providerProfile.reviewCount,
          }
        : null,

      holdings: user.sharesOwned.map((item) => ({
        propertyId: item.propertyId,
        propertyTitle: item.property.title,
        propertyLocation: item.property.location,
        sharesOwned: item.sharesOwned,
        amountPaid: item.amountPaid,
      })),
    };
  }

  /**
   * =========================================
   * UPDATE MY PROFILE
   * =========================================
   */
  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== existingUser.email) {
      const emailOwner = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (emailOwner && emailOwner.id !== userId) {
        throw new ConflictException('Email already exists');
      }
    }

    if (dto.phone && dto.phone !== existingUser.phone) {
      const phoneOwner = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });

      if (phoneOwner && phoneOwner.id !== userId) {
        throw new ConflictException('Phone already exists');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name ?? existingUser.name,
        email: dto.email ?? existingUser.email,
        phone: dto.phone ?? existingUser.phone,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        updatedAt: updated.updatedAt,
      },
    };
  }

  /**
   * =========================================
   * CHANGE MY PASSWORD
   * =========================================
   */
  async changeMyPassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!passwordMatches) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return {
      message: 'Password changed successfully',
    };
  }

  /**
   * =========================================
   * CREATE RESIDENT (FULLY WIRED)
   * =========================================
   */
  async createResident(dto: CreateResidentDto, creatorId: string) {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
    });

    if (!creator || creator.role !== Role.MANAGER) {
      throw new ForbiddenException('Only managers can create residents');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (db) => {
      const user = await db.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          password: hashedPassword,
          role: Role.RESIDENT,
        },
      });

      await db.account.create({
        data: {
          userId: user.id,
          type: AccountType.USER,
          balance: 0,
        },
      });

      await db.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });

      const resident = await db.resident.create({
        data: {
          userId: user.id,
          createdById: creatorId,
          unitId: null,
          status: ResidentStatus.ACTIVE,
        },
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
        },
        resident,
      };
    });
  }

  /**
   * =========================================
   * ASSIGN TO UNIT
   * =========================================
   */
  async assignToUnit(residentId: string, unitId: string) {
    const occupied = await this.prisma.resident.findFirst({
      where: { unitId, status: ResidentStatus.ACTIVE },
    });

    if (occupied) {
      throw new ForbiddenException('Unit already occupied');
    }

    return this.prisma.resident.update({
      where: { id: residentId },
      data: {
        unitId,
        status: ResidentStatus.ACTIVE,
      },
    });
  }

  /**
   * =========================================
   * MOVE OUT
   * =========================================
   */
  async moveOut(residentId: string) {
    return this.prisma.resident.update({
      where: { id: residentId },
      data: {
        unitId: null,
        status: ResidentStatus.MOVED_OUT,
      },
    });
  }

  /**
   * =========================================
   * TRANSFER
   * =========================================
   */
  async transfer(residentId: string, newUnitId: string) {
    const occupied = await this.prisma.resident.findFirst({
      where: { unitId: newUnitId, status: ResidentStatus.ACTIVE },
    });

    if (occupied) {
      throw new ForbiddenException('Target unit already occupied');
    }

    return this.prisma.resident.update({
      where: { id: residentId },
      data: {
        unitId: newUnitId,
        status: ResidentStatus.TRANSFERRED,
      },
    });
  }
}