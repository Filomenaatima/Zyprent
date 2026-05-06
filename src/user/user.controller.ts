import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from '@prisma/client';
import { Request } from 'express';

interface JwtUser {
  id: string;
  role: Role;
  email: string;
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAllUsers() {
    return this.userService.findAllUsers();
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/pending')
  async findPendingUsers() {
    return this.userService.findPendingUsers();
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/:userId/approve')
  async approveUser(
    @Param('userId') userId: string,
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.userService.approveUser(userId, req.user.id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/:userId/reject')
  async rejectUser(
    @Param('userId') userId: string,
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.userService.rejectUser(userId, req.user.id);
  }

  @UseGuards(JwtGuard)
  @Get('me/profile')
  async getMyProfile(@Req() req: Request & { user: JwtUser }) {
    if (!req.user?.id) {
      throw new ForbiddenException('Invalid token: missing user id');
    }

    return this.userService.getMyProfile(req.user.id);
  }

  @UseGuards(JwtGuard)
  @Patch('me/profile')
  async updateMyProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: Request & { user: JwtUser },
  ) {
    if (!req.user?.id) {
      throw new ForbiddenException('Invalid token: missing user id');
    }

    return this.userService.updateMyProfile(req.user.id, dto);
  }

  @UseGuards(JwtGuard)
  @Patch('me/password')
  async changeMyPassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: Request & { user: JwtUser },
  ) {
    if (!req.user?.id) {
      throw new ForbiddenException('Invalid token: missing user id');
    }

    return this.userService.changeMyPassword(req.user.id, dto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.MANAGER)
  @Post('resident')
  async createResident(
    @Body() dto: CreateResidentDto,
    @Req() req: Request & { user: JwtUser },
  ) {
    if (!req.user?.id) {
      throw new ForbiddenException('Invalid token: missing user id');
    }

    return this.userService.createResident(dto, req.user.id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  @Patch('resident/:residentId/assign/:unitId')
  async assignResidentToUnit(
    @Param('residentId') residentId: string,
    @Param('unitId') unitId: string,
  ) {
    return this.userService.assignToUnit(residentId, unitId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  @Patch('resident/:residentId/move-out')
  async moveOutResident(@Param('residentId') residentId: string) {
    return this.userService.moveOut(residentId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  @Patch('resident/:residentId/transfer/:unitId')
  async transferResident(
    @Param('residentId') residentId: string,
    @Param('unitId') unitId: string,
  ) {
    return this.userService.transfer(residentId, unitId);
  }
}