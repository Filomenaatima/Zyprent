import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  BillingInterval,
  SubscriptionStatus,
  UsageMetricType,
  Role,
} from '@prisma/client';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { SubscriptionService } from './subscription.service';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: Role;
  };
};

@Controller('subscriptions')
@UseGuards(JwtGuard)
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  private ensureAdmin(req: AuthenticatedRequest) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only admin can access subscription billing controls',
      );
    }
  }

  @Get('me')
  getMySubscriptionStatus(@Req() req: AuthenticatedRequest) {
    return this.service.getMySubscriptionStatus(req.user.id);
  }

  @Post('activate-test')
  activateTestSubscription(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      planName: string;
      amount: number;
      paymentRef?: string;
    },
  ) {
    return this.service.activateTestSubscription({
      userId: req.user.id,
      planName: body.planName,
      amount: Number(body.amount),
      paymentRef: body.paymentRef,
    });
  }

  @Get('admin/overview')
  getAdminOverview(@Req() req: AuthenticatedRequest) {
    this.ensureAdmin(req);
    return this.service.getAdminOverview();
  }

  @Get('admin/all')
  getAllSubscriptions(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: SubscriptionStatus,
    @Query('search') search?: string,
  ) {
    this.ensureAdmin(req);
    return this.service.getAllSubscriptions({ status, search });
  }

  @Get('plans/all')
  listPlans(@Req() req: AuthenticatedRequest) {
    this.ensureAdmin(req);
    return this.service.listPlans();
  }

  @Post('plans')
  createPlan(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      name: string;
      billingInterval: BillingInterval;
      price: number;
      trialDays?: number;
      isActive?: boolean;
    },
  ) {
    this.ensureAdmin(req);

    return this.service.createPlan(body);
  }

  @Get('investor/:investorId/active')
  getActiveSubscription(
    @Req() req: AuthenticatedRequest,
    @Param('investorId') investorId: string,
  ) {
    this.ensureAdmin(req);

    return this.service.getActiveSubscriptionForInvestor(investorId);
  }

  @Get('investor/:investorId')
  getInvestorSubscriptions(
    @Req() req: AuthenticatedRequest,
    @Param('investorId') investorId: string,
  ) {
    this.ensureAdmin(req);

    return this.service.getSubscriptionsForInvestor(investorId);
  }

  @Post()
  createSubscription(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      investorId: string;
      planId: string;
      status?: SubscriptionStatus;
      startedAt?: string;
      trialEndsAt?: string | null;
      currentPeriodEnd: string;
    },
  ) {
    this.ensureAdmin(req);

    return this.service.createSubscription({
      investorId: body.investorId,
      planId: body.planId,
      status: body.status,
      startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
      trialEndsAt:
        body.trialEndsAt === null
          ? null
          : body.trialEndsAt
            ? new Date(body.trialEndsAt)
            : undefined,
      currentPeriodEnd: new Date(body.currentPeriodEnd),
    });
  }

  @Get(':id')
  getSubscriptionById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.ensureAdmin(req);

    return this.service.getSubscriptionById(id);
  }

  @Patch(':id/cancel')
  cancelSubscription(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.ensureAdmin(req);

    return this.service.cancelSubscription(id);
  }

  @Post(':id/usage')
  recordUsage(
    @Req() req: AuthenticatedRequest,
    @Param('id') subscriptionId: string,
    @Body()
    body: {
      metric: UsageMetricType;
      value: number;
    },
  ) {
    this.ensureAdmin(req);

    return this.service.recordUsageSnapshot({
      subscriptionId,
      metric: body.metric,
      value: body.value,
    });
  }
}