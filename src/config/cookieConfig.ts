import type { CookieOptions } from 'express';

export const setCookieConfig: CookieOptions = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 30 days
};

export const clearCookieConfig: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
};
