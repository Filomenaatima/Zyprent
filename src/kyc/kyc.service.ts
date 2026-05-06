import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  async submitKyc(userId: string, dto: SubmitKycDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.kycVerification.upsert({
      where: { userId },
      update: {
        ...dto,
        dateOfBirth: new Date(dto.dateOfBirth),
        status: 'PENDING',
        reviewedBy: null,
        reviewedAt: null,
      },
      create: {
        userId,
        ...dto,
        dateOfBirth: new Date(dto.dateOfBirth),
      },
      include: {
        user: true,
      },
    });
  }

  async getUserKyc(userId: string, requesterRole: Role, requesterId: string) {
    if (requesterRole !== Role.ADMIN && requesterId !== userId) {
      throw new ForbiddenException('You can only view your own KYC');
    }

    const kyc = await this.prisma.kycVerification.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    return kyc;
  }

  async getAllKyc() {
    return this.prisma.kycVerification.findMany({
      include: {
        user: true,
      },
      orderBy: [
        { status: 'asc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  async reviewKyc(kycId: string, adminId: string, dto: ReviewKycDto) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only a valid admin can review KYC');
    }

    const existing = await this.prisma.kycVerification.findUnique({
      where: { id: kycId },
      include: {
        user: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('KYC record not found');
    }

    return this.prisma.kycVerification.update({
      where: { id: kycId },
      data: {
        status: dto.status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      include: {
        user: true,
      },
    });
  }
}