import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyValuationDto } from './dto/update-property-valuation.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
  };
}

@Controller('properties')
@UseGuards(JwtGuard, RolesGuard)
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @Roles(Role.INVESTOR)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertyService.create(dto, req.user.id);
  }

  @Patch(':id/assign-manager')
  @Roles(Role.INVESTOR, Role.ADMIN)
  assignManager(
    @Req() req: AuthenticatedRequest,
    @Param('id') propertyId: string,
    @Body('managerId') managerId: string,
  ) {
    return this.propertyService.assignManager(
      propertyId,
      managerId,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id/valuation')
  @Roles(Role.INVESTOR, Role.ADMIN)
  updateValuation(
    @Req() req: AuthenticatedRequest,
    @Param('id') propertyId: string,
    @Body() dto: UpdatePropertyValuationDto,
  ) {
    return this.propertyService.updateValuation(
      propertyId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Get('manager/me')
  @Roles(Role.MANAGER)
  getManagerProperties(@Req() req: AuthenticatedRequest) {
    return this.propertyService.findForManager(req.user.id);
  }

  @Get('manager/me/:id')
  @Roles(Role.MANAGER)
  getManagerPropertyById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.propertyService.findOneForManager(id, req.user.id);
  }

  @Get('investor/me')
  @Roles(Role.INVESTOR)
  getInvestorProperties(@Req() req: AuthenticatedRequest) {
    return this.propertyService.findForInvestor(req.user.id);
  }

  @Get('investor/me/:id')
  @Roles(Role.INVESTOR)
  getInvestorPropertyById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.propertyService.findOneForInvestor(id, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.propertyService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id);
  }
}