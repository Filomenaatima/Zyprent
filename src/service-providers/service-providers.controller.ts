import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ServiceProvidersService } from './service-providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Role } from '@prisma/client';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: Role;
  };
};

@Controller('service-providers')
export class ServiceProvidersController {
  constructor(private readonly service: ServiceProvidersService) {}

  @UseGuards(JwtGuard)
  @Post()
  createProvider(
    @Body() body: CreateProviderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can create providers');
    }

    return this.service.createProvider(body);
  }

  @UseGuards(JwtGuard)
  @Get()
  getProviders(
    @Req() req: AuthenticatedRequest,
    @Query('includeInactive') includeInactive?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('search') search?: string,
  ) {
    const includeInactiveFlag =
      req.user.role === Role.ADMIN && includeInactive === 'true';

    return this.service.getProviders({
      requesterRole: req.user.role,
      includeInactive: includeInactiveFlag,
      verificationStatus,
      type,
      city,
      search,
    });
  }

  @UseGuards(JwtGuard)
  @Get('summary')
  getProvidersSummary(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can view provider summary');
    }

    return this.service.getProvidersSummary();
  }

  @UseGuards(JwtGuard)
  @Get('me')
  getMyProviderProfile(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== Role.SERVICE_PROVIDER) {
      throw new ForbiddenException(
        'Only service providers can view provider profile',
      );
    }

    return this.service.getProviderByUserId(req.user.id);
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  getProvider(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.getProvider(id, req.user.role, req.user.id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id/verify')
  verifyProvider(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can verify providers');
    }

    return this.service.verifyProvider(id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id/deactivate')
  deactivateProvider(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can deactivate providers');
    }

    return this.service.deactivateProvider(id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id/reactivate')
  reactivateProvider(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can reactivate providers');
    }

    return this.service.reactivateProvider(id);
  }
}