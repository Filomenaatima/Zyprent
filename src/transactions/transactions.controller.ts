import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Role } from '@prisma/client';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(JwtGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('me')
  async getMyTransactions(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const user = req.user as any;
    const userId = user.id as string;
    const role = user.role as Role;

    const parsedPage = Number(page ?? 1);
    const parsedLimit = Number(limit ?? 10);

    const params = {
      userId,
      page: Number.isNaN(parsedPage) ? 1 : parsedPage,
      limit: Number.isNaN(parsedLimit) ? 10 : parsedLimit,
      type,
      status,
      search,
    };

    if (role === Role.MANAGER) {
      return this.transactionsService.getManagerTransactions(params);
    }

    if (role === Role.RESIDENT) {
      return this.transactionsService.getResidentTransactions(params);
    }

    if (role === Role.INVESTOR) {
      return this.transactionsService.getInvestorTransactions(params);
    }

    if (role === Role.ADMIN) {
      return this.transactionsService.getAdminTransactions({
        page: params.page,
        limit: params.limit,
        type: params.type,
        status: params.status,
        search: params.search,
      });
    }

    return {
      items: [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      audience: 'unknown',
    };
  }

  @Get('summary')
  async getMyTransactionSummary(@Req() req: Request) {
    const user = req.user as any;
    const userId = user.id as string;
    const role = user.role as Role;

    if (role === Role.MANAGER) {
      return this.transactionsService.getManagerTransactionSummary(userId);
    }

    if (role === Role.RESIDENT) {
      return this.transactionsService.getResidentTransactionSummary(userId);
    }

    if (role === Role.INVESTOR) {
      return this.transactionsService.getInvestorTransactionSummary(userId);
    }

    if (role === Role.ADMIN) {
      return this.transactionsService.getAdminTransactionSummary();
    }

    return {
      inflow: 0,
      outflow: 0,
      netCashFlow: 0,
      pendingCount: 0,
      completedCount: 0,
      audience: 'unknown',
    };
  }
}