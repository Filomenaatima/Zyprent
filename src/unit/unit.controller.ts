import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
  };
}

@Controller('units')
@UseGuards(JwtGuard, RolesGuard)
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  async create(
    @Body() dto: CreateUnitDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.unitService.create(dto, req.user.id, req.user.role);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return this.unitService.findAll();
  }

  @Get('manager/me')
  @Roles(Role.MANAGER)
  async getManagerUnits(@Req() req: AuthenticatedRequest) {
    return this.unitService.findForManager(req.user.id);
  }

  @Get('property/:propertyId')
  async getByProperty(@Param('propertyId') propertyId: string) {
    return this.unitService.findByProperty(propertyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.unitService.findOne(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.unitService.remove(id, req.user.id, req.user.role);
  }
}