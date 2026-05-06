import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtUtils {
  constructor(private jwt: JwtService, private config: ConfigService) {}

  signAccessToken(payload: any) {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
    });
  }

  signRefreshToken(payload: any) {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });
  }

  verify(token: string) {
    return this.jwt.verifyAsync(token, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });
  }
}
