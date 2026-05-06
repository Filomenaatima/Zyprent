export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'supersecret',
  accessTokenExpiry: '1d',
  refreshTokenExpiry: '7d',
};