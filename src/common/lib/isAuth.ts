import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/app.config';
import prismaClient from '../../config/prisma';

export const isAuth = async (req: Request, res: Response, next: NextFunction) => {
  // const token = req.cookies[config.JWT.COOKIE_NAME];
  const token = req.headers['authorization'];
  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT.SECRET) as {
        id: string;
      };

      const user = await prismaClient.userAccount.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      };
      next();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      res.status(401).send({ message: 'Invalid Token' });
    }
  } else {
    res.status(401).send({ message: 'No Token' });
  }
};
