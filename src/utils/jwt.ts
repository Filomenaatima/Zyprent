// src/utils/jwt.ts
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

export const JWT_SECRET: Secret = process.env.JWT_SECRET || 'supersecret';
export const ACCESS_EXPIRES = '15m';
export const REFRESH_EXPIRES = '7d';

export function signAccessToken(payload: any) {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function signRefreshToken(payload: any) {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
