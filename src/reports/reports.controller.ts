import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ReportType, Role } from '@prisma/client';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ReportRunnerService } from './report-runner.service';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: Role;
  };
};

@Controller('reports')
@UseGuards(JwtGuard)
export class ReportsController {
  constructor(private readonly runner: ReportRunnerService) {}

  @Get(':type')
  async runReport(
    @Param('type') type: ReportType,
    @Req() req: AuthenticatedRequest,
  ) {
    const context = {
      userId: req.user.id,
      role: req.user.role,
    };

    return this.runner.run(type, context);
  }

  @Get('property-income/:propertyId')
  async propertyIncome(
    @Param('propertyId') propertyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (
      req.user.role !== Role.ADMIN &&
      req.user.role !== Role.MANAGER &&
      req.user.role !== Role.INVESTOR
    ) {
      throw new ForbiddenException(
        'You are not allowed to view property income reports',
      );
    }

    return this.runner.propertyIncomeByProperty(propertyId);
  }

  @Get('occupancy/:propertyId')
  async occupancy(
    @Param('propertyId') propertyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (
      req.user.role !== Role.ADMIN &&
      req.user.role !== Role.MANAGER &&
      req.user.role !== Role.INVESTOR
    ) {
      throw new ForbiddenException(
        'You are not allowed to view occupancy reports',
      );
    }

    return this.runner.occupancyReport(propertyId);
  }
}