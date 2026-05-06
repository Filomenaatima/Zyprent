import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ApprovalsService } from './approvals.service';
import { ReviewApprovalDto } from './dto/review-approval.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: Role;
  };
};

@Controller('approvals')
@UseGuards(JwtGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  private ensureAdmin(req: AuthenticatedRequest) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can access approvals');
    }
  }

  @Get('summary')
  getSummary(@Req() req: AuthenticatedRequest) {
    this.ensureAdmin(req);
    return this.approvalsService.getSummary();
  }

  @Get('queue')
  getQueue(
    @Req() req: AuthenticatedRequest,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    this.ensureAdmin(req);
    return this.approvalsService.getQueue({ type, status, search });
  }

  @Get(':type/:id')
  getOne(
    @Req() req: AuthenticatedRequest,
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    this.ensureAdmin(req);
    return this.approvalsService.getOne(type, id);
  }

  @Post('kyc/:id/review')
  reviewKyc(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReviewApprovalDto,
  ) {
    this.ensureAdmin(req);
    return this.approvalsService.reviewKyc(id, req.user.id, dto);
  }

  @Post('provider/:id/review')
  reviewProvider(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReviewApprovalDto,
  ) {
    this.ensureAdmin(req);
    return this.approvalsService.reviewProvider(id, dto);
  }

  @Post('expense/:id/review')
  reviewExpense(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReviewApprovalDto,
  ) {
    this.ensureAdmin(req);
    return this.approvalsService.reviewExpense(id, req.user.id, dto);
  }

  @Post('profit-request/:id/review')
  reviewProfitRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReviewApprovalDto,
  ) {
    this.ensureAdmin(req);
    return this.approvalsService.reviewProfitRequest(id, req.user.id, dto);
  }
}