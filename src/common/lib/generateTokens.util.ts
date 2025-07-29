import jwt from 'jsonwebtoken';
import { config } from '../../config/app.config';

export const createAccessToken = (userId: string) => {
  return jwt.sign({ id: userId }, config.JWT.SECRET, {
    expiresIn: config.JWT.EXPIRES_IN,
  });
};