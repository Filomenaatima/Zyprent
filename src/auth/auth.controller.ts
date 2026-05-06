import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    dto: {
      name: string;
      email: string;
      password: string;
      role: 'ADMIN' | 'MANAGER' | 'INVESTOR' | 'RESIDENT' | 'SERVICE_PROVIDER';
    },
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(
    @Body()
    dto: {
      email: string;
      password: string;
    },
  ) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  async profile(@Req() req: any) {
    return this.authService.profile(req.user.id);
  }
}