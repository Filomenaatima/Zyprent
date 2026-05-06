import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ResidentService } from './resident.service';
import { AssignResidentDto } from './dto/assign-resident.dto';
import { TransferResidentDto } from './dto/transfer-resident.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
  };
}

@Controller('residents')
@UseGuards(JwtGuard, RolesGuard)
export class ResidentController {
  constructor(private residentService: ResidentService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.residentService.findAll();
  }

  @Get('manager/me')
  @Roles(Role.MANAGER)
  getManagerResidents(@Req() req: AuthenticatedRequest) {
    return this.residentService.findForManager(req.user.id);
  }

  @Post(':id/assign')
  @Roles(Role.MANAGER)
  assign(
    @Param('id') residentId: string,
    @Body() dto: AssignResidentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.residentService.assignToUnit(
      residentId,
      dto.unitId,
      req.user.id,
    );
  }

  @Post(':id/move-out')
  @Roles(Role.MANAGER)
  moveOut(
    @Param('id') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.residentService.moveOut(residentId, req.user.id);
  }

  @Post(':id/transfer')
  @Roles(Role.MANAGER)
  transfer(
    @Param('id') residentId: string,
    @Body() dto: TransferResidentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.residentService.transfer(
      residentId,
      dto.newUnitId,
      req.user.id,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.residentService.findOne(id, req.user.id, req.user.role);
  }
}