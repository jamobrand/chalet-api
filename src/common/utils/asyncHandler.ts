import { NextFunction, Request, Response } from 'express';

// interface CustomError {
//     message: string;
//     statusCode?: number;
//   }

type AsynControllerType = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (controller: AsynControllerType): AsynControllerType =>
  async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error: unknown) {
      next(error);
    }
  };
