import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /* ================= ADMIN ================= */

  @Get('admin')
  @Roles('ADMIN')
  adminDashboard(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.dashboardService.adminDashboard(userId);
  }

  /* ================= INVESTOR ================= */

  @Get('investor')
  @Roles('INVESTOR')
  investorDashboard(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.dashboardService.investorDashboard(userId);
  }

  /* ================= RESIDENT ================= */

  @Get('resident')
  @Roles('RESIDENT')
  residentDashboard(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.dashboardService.residentDashboard(userId);
  }

  /* ================= MANAGER ================= */

  @Get('manager')
  @Roles('MANAGER')
  managerDashboard(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.dashboardService.managerDashboard(userId);
  }

  /* ================= SERVICE PROVIDER ================= */

  @Get('provider')
  @Roles('SERVICE_PROVIDER')
  providerDashboard(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.dashboardService.providerDashboard(userId);
  }
}