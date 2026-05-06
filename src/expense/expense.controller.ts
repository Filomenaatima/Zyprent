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
} from '@nestjs/common';
import { Request } from 'express';
import { ExpenseStatus, Role } from '@prisma/client';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ReviewExpenseDto } from './dto/review-expense.dto';
import { MarkExpensePaidDto } from './dto/mark-expense-paid.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: Role;
  };
};

@Controller('expenses')
@UseGuards(JwtGuard, RolesGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  createExpense(
    @Body() dto: CreateExpenseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.expenseService.createExpense(dto, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  updateExpense(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.expenseService.updateExpense(id, dto, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Post(':id/submit')
  @Roles(Role.ADMIN, Role.MANAGER)
  submitExpense(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.expenseService.submitExpense(id, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Post(':id/review')
  @Roles(Role.ADMIN, Role.INVESTOR)
  reviewExpense(
    @Param('id') id: string,
    @Body() dto: ReviewExpenseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.expenseService.reviewExpense(id, dto, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Post(':id/mark-paid')
  @Roles(Role.ADMIN, Role.MANAGER, Role.INVESTOR)
  markExpensePaid(
    @Param('id') id: string,
    @Body() dto: MarkExpensePaidDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.expenseService.markExpensePaid(id, dto, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Get()
  @Roles(Role.ADMIN)
  getAdminExpenses(
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: ExpenseStatus,
    @Query('category') category?: string,
  ) {
    return this.expenseService.getAdminExpenses({
      propertyId,
      status,
      category,
    });
  }

  @Get('admin/summary')
  @Roles(Role.ADMIN)
  getAdminExpenseSummary() {
    return this.expenseService.getAdminExpenseSummary();
  }

  @Get('manager/me')
  @Roles(Role.MANAGER)
  getManagerExpenses(
    @Req() req: AuthenticatedRequest,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: ExpenseStatus,
    @Query('category') category?: string,
  ) {
    return this.expenseService.getManagerExpenses(req.user.id, {
      propertyId,
      status,
      category,
    });
  }

  @Get('manager/me/summary')
  @Roles(Role.MANAGER)
  getManagerExpenseSummary(@Req() req: AuthenticatedRequest) {
    return this.expenseService.getManagerExpenseSummary(req.user.id);
  }

  @Get('investor/me')
  @Roles(Role.INVESTOR)
  getInvestorExpenses(
    @Req() req: AuthenticatedRequest,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: ExpenseStatus,
    @Query('category') category?: string,
  ) {
    return this.expenseService.getInvestorExpenses(req.user.id, {
      propertyId,
      status,
      category,
    });
  }

  @Get('investor/me/summary')
  @Roles(Role.INVESTOR)
  getInvestorExpenseSummary(@Req() req: AuthenticatedRequest) {
    return this.expenseService.getInvestorExpenseSummary(req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.INVESTOR)
  getExpenseById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.expenseService.getExpenseById(id, {
      userId: req.user.id,
      role: req.user.role,
    });
  }
}