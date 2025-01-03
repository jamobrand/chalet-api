import { Request, Response } from 'express';
import { asyncHandler } from '../common/utils/asyncHandler';
import {
  loginSchema,
  registerSchema,
  verificationEmailSchema,
} from './auth-utils/auth.validator';
import { AuthService } from './auth.service';
import httpStatus from 'http-status';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public register = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const body = registerSchema.parse({
      ...req.body,
    });
    const { user } = await this.authService.register(body as RegisterDto);
    return res.status(httpStatus.CREATED).json({
      message: 'User registered successfully',
      data: user,
    });
  });

  public verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { code } = verificationEmailSchema.parse(req.body);
    await this.authService.verifyEmail(code);

    return res.status(httpStatus.OK).json({
      message: 'Email verified successfully',
    });
  });

  public login = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const body = loginSchema.parse({
      ...req.body,
    });

    const { foundUser, accessToken } = await this.authService.login(body as LoginDto);

    return res.status(httpStatus.OK).json({
      message: 'User login successfully',
      token: accessToken,
      user: foundUser,
    });
  });

  public getUserDetails = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user.id;
    const dataUser = await this.authService.getUser(userId);

       return res.status(httpStatus.OK).json({
        message: 'Retrieved user details successfully',
        user:dataUser.userDetails
    });
  });
}
