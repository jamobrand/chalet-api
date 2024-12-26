import { Request, Response } from 'express';
import { asyncHandler } from '../common/utils/asyncHandler';
import { registerSchema } from './auth-utils/auth.validator';
import { AuthService } from './auth.service';
import httpStatus from 'http-status';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public register = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const body = registerSchema.parse({
      ...req.body,
    });
    const { user } = await this.authService.register(body);
    return res.status(httpStatus.CREATED).json({
      message: 'User registered successfully',
      data: user,
    });
  });
}
