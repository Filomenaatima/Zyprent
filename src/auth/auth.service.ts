import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: {
    name?: string;
    email: string;
    password: string;
    role: Role;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name ?? null,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        status: UserStatus.PENDING,
      },
    });

    return {
      message: 'Account created successfully. Your account is pending approval.',
      status: user.status,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name ?? null,
        status: user.status,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException(
        'Your account is pending approval. You will be notified once approved.',
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact support.',
      );
    }

    return this.buildAuthResponse(user);
  }

  async profile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });
  }

  private buildAuthResponse(user: {
    id: string;
    email: string | null;
    role: Role;
    name?: string | null;
    status: UserStatus;
  }) {
    const payload = {
      sub: user.id,
      email: user.email ?? '',
      role: user.role,
      status: user.status,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.accessTokenExpiry,
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.refreshTokenExpiry,
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name ?? null,
        status: user.status,
      },
    };
  }
}