import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { Role } from '@prisma/client';

type AuthRequest = Request & {
  user: {
    id: string;
    role: Role;
  };
};

@Controller('maintenance')
@UseGuards(JwtGuard)
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  /* =====================================================
      CREATE REQUEST (ALL USERS SAFE)
  ===================================================== */
  @Post()
  async create(
    @Req() req: AuthRequest,
    @Body() dto: CreateMaintenanceRequestDto,
  ) {
    const { id } = req.user;
    return this.service.createRequestForUser(id, dto);
  }

  /* =====================================================
      RESIDENT / MANAGER / ADMIN REQUEST VIEWS
  ===================================================== */

  @Get('resident/me')
  async residentMine(@Req() req: AuthRequest) {
    return this.service.getResidentRequests(req.user.id);
  }

  @Get('manager/me')
  async managerMine(@Req() req: AuthRequest) {
    return this.service.getManagerRequests(req.user.id);
  }

  /* 🔥 ADMIN VIEW (NEW – PLATFORM WIDE) */
  @Get('admin/all')
  async adminAll(
    @Req() req: AuthRequest,
    @Query('status') status?: string,
    @Query('propertyId') propertyId?: string,
  ) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can view all maintenance');
    }

    return this.service.getAdminRequests({
      status,
      propertyId,
    });
  }

  @Get('property/:propertyId')
  async propertyRequests(@Param('propertyId') propertyId: string) {
    return this.service.getPropertyRequests(propertyId);
  }

  /* =====================================================
      QUOTES
  ===================================================== */

  @Post('quote')
  async submitQuote(@Body() dto: CreateQuoteDto & { providerId: string }) {
    return this.service.submitQuote(dto);
  }

  @Post('provider/quote')
  async submitQuoteAsProvider(
    @Req() req: AuthRequest,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.service.submitQuoteForProvider(req.user.id, dto);
  }

  @Get('request/:requestId/quotes')
  async getQuotes(@Param('requestId') requestId: string) {
    return this.service.getQuotes(requestId);
  }

  @Patch('quote/:quoteId/accept')
  async acceptQuote(@Param('quoteId') quoteId: string) {
    return this.service.acceptQuote(quoteId);
  }

  /* =====================================================
      PROVIDER ASSIGNMENT & DISPATCH
  ===================================================== */

  @Patch('request/:requestId/assign/:providerId')
  async assignProvider(
    @Param('requestId') requestId: string,
    @Param('providerId') providerId: string,
  ) {
    return this.service.assignProvider(requestId, providerId);
  }

  /* =====================================================
      INSPECTION / PAYMENT STRUCTURE
  ===================================================== */

  @Patch('request/:requestId/inspection')
  async scheduleInspection(
    @Param('requestId') requestId: string,
    @Body() body: { date: string },
  ) {
    if (!body?.date) {
      throw new BadRequestException('date is required');
    }

    return this.service.scheduleInspection(requestId, new Date(body.date));
  }

  @Patch('request/:requestId/payment-responsibility')
  async setPaymentResponsibility(
    @Param('requestId') requestId: string,
    @Body() body: { responsibility: any },
  ) {
    return this.service.setPaymentResponsibility(
      requestId,
      body.responsibility,
    );
  }

  @Patch('request/:requestId/split-payment')
  async setSplitPayment(
    @Param('requestId') requestId: string,
    @Body() body: { propertyShare: number; residentShare: number },
  ) {
    return this.service.setSplitPayment(
      requestId,
      body.propertyShare,
      body.residentShare,
    );
  }

  /* =====================================================
      PAYMENT RECORDING
  ===================================================== */

  @Patch('request/:requestId/pay')
  async recordPayment(
    @Req() req: AuthRequest,
    @Param('requestId') requestId: string,
    @Body() body: { paymentReference: string },
  ) {
    return this.service.recordPayment(
      requestId,
      req.user.id,
      body.paymentReference,
    );
  }

  /* =====================================================
      WORKFLOW
  ===================================================== */

  @Post('request/:requestId/confirm-completion')
  async confirmCompletion(
    @Req() req: AuthRequest,
    @Param('requestId') requestId: string,
  ) {
    return this.service.confirmCompletionByResident(
      requestId,
      req.user.id,
    );
  }

  @Patch(':id/schedule-work')
  async scheduleWork(
    @Param('id') id: string,
    @Body() body: { date?: string; scheduledAt?: string },
  ) {
    const rawDate = body?.date || body?.scheduledAt;

    if (!rawDate) {
      throw new BadRequestException('date or scheduledAt is required');
    }

    return this.service.scheduleWork(id, new Date(rawDate));
  }

  @Patch(':id/start')
  async startRepair(@Param('id') id: string) {
    return this.service.startRepair(id);
  }

  @Patch(':id/complete')
  async completeRepair(@Param('id') id: string) {
    return this.service.completeRepair(id);
  }

  /* =====================================================
      PROVIDER PAYOUT
  ===================================================== */

  @Patch('request/:requestId/provider-payout')
  async markProviderPayoutPaid(@Param('requestId') requestId: string) {
    return this.service.markProviderPayoutPaid(requestId);
  }

  /* =====================================================
      PROVIDER RATING
  ===================================================== */

  @Post('request/:requestId/rate-provider')
  async rateProvider(
    @Req() req: AuthRequest,
    @Param('requestId') requestId: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.service.rateProviderByUser(
      requestId,
      req.user.id,
      body.rating,
      body.comment,
    );
  }

  /* =====================================================
      ANALYTICS
  ===================================================== */

  @Get('analytics/:propertyId')
  async analytics(@Param('propertyId') propertyId: string) {
    return this.service.getAnalyticsDashboard(propertyId);
  }

  /* 🔥 ADMIN PLATFORM ANALYTICS (NEW) */
  @Get('admin/analytics')
  async adminAnalytics(@Req() req: AuthRequest) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin allowed');
    }

    return this.service.getPlatformMaintenanceAnalytics();
  }

  @Get('provider/performance/:providerId')
  async providerPerformance(@Param('providerId') providerId: string) {
    return this.service.getProviderPerformance(providerId);
  }

  /* =====================================================
      PROVIDER SIDE
  ===================================================== */

  @Get('provider/dispatches')
  async providerDispatches(@Req() req: AuthRequest) {
    return this.service.getProviderDispatches(req.user.id);
  }

  @Patch('provider/dispatch/:requestId/view')
  async viewDispatch(
    @Req() req: AuthRequest,
    @Param('requestId') requestId: string,
  ) {
    const providerId = await this.service.getProviderIdForUser(
      req.user.id,
    );
    return this.service.viewDispatch(requestId, providerId);
  }

  @Patch('provider/dispatch/:requestId/accept')
  async acceptDispatch(
    @Req() req: AuthRequest,
    @Param('requestId') requestId: string,
  ) {
    const providerId = await this.service.getProviderIdForUser(
      req.user.id,
    );
    return this.service.acceptDispatch(requestId, providerId);
  }

  @Patch('provider/dispatch/:requestId/decline')
  async declineDispatch(
    @Req() req: AuthRequest,
    @Param('requestId') requestId: string,
  ) {
    const providerId = await this.service.getProviderIdForUser(
      req.user.id,
    );
    return this.service.declineDispatch(requestId, providerId);
  }

  @Get('provider/jobs')
  async providerJobs(@Req() req: AuthRequest) {
    return this.service.getProviderJobs(req.user.id);
  }

  @Get('provider/quotes')
  async providerQuotes(@Req() req: AuthRequest) {
    return this.service.getProviderQuotes(req.user.id);
  }

  @Get('provider/payouts')
  async providerPayouts(@Req() req: AuthRequest) {
    return this.service.getProviderPayouts(req.user.id);
  }
}