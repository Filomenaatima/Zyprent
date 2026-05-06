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
import { RentContractService } from './rent-contract.service';
import { CreateRentContractDto } from './dto/create-rent-contract.dto';
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

@Controller('rent-contracts')
@UseGuards(JwtGuard, RolesGuard)
export class RentContractController {
  constructor(
    private readonly rentContractService: RentContractService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(
    @Body() dto: CreateRentContractDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rentContractService.create(dto, req.user.id, req.user.role);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.rentContractService.findAll();
  }

  @Get('manager/me')
  @Roles(Role.MANAGER)
  findForManager(@Req() req: AuthenticatedRequest) {
    return this.rentContractService.findForManager(req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rentContractService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id/terminate')
  @Roles(Role.ADMIN, Role.MANAGER)
  terminate(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rentContractService.terminate(
      id,
      req.user.id,
      req.user.role,
    );
  }
}