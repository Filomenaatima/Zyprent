import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: Role;
  };
};

@Controller('kyc')
@UseGuards(JwtGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit/:userId')
  submitKyc(
    @Param('userId') userId: string,
    @Body() dto: SubmitKycDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const actor = req.user;

    if (actor.role !== Role.ADMIN && actor.id !== userId) {
      throw new ForbiddenException('You can only submit your own KYC');
    }

    return this.kycService.submitKyc(userId, dto);
  }

  @Post('submit/me')
  submitMyKyc(
    @Body() dto: SubmitKycDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.kycService.submitKyc(req.user.id, dto);
  }

  @Get('me')
  getMyKyc(@Req() req: AuthenticatedRequest) {
    return this.kycService.getUserKyc(req.user.id, req.user.role, req.user.id);
  }

  @Get('admin/all')
  getAllKyc(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can view all KYC records');
    }

    return this.kycService.getAllKyc();
  }

  @Get(':userId')
  getUserKyc(
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.kycService.getUserKyc(userId, req.user.role, req.user.id);
  }

  @Post('review/:kycId/:adminId')
  reviewKyc(
    @Param('kycId') kycId: string,
    @Param('adminId') adminId: string,
    @Body() dto: ReviewKycDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can review KYC');
    }

    if (req.user.id !== adminId) {
      throw new ForbiddenException('Admin review user mismatch');
    }

    return this.kycService.reviewKyc(kycId, adminId, dto);
  }

  @Post('review/:kycId')
  reviewKycAsAdmin(
    @Param('kycId') kycId: string,
    @Body() dto: ReviewKycDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can review KYC');
    }

    return this.kycService.reviewKyc(kycId, req.user.id, dto);
  }
}