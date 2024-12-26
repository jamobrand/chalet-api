import * as argon2 from 'argon2';
import { ErrorCode } from '../common/enum/error-code.enum';
import { BadRequestException, InternalServerException } from '../common/utils/catch-errors';
import prismaClient from '../config/prisma';
import { RegisterDto } from './dtos/register.dto';
//import { generateAvatarUrl } from './auth-utils/image-generator';
import { logger } from '../common/utils/logger';

export class AuthService {
  public async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    const existingUser = await prismaClient.userAccount.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'User already exists with this email',
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
      );
    }

    const hashedPassword = await argon2.hash(password);
    // const avatarUrl = generateAvatarUrl(email);

    const newUser = await prismaClient.userAccount.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    if (!newUser) {
      logger.warn(`User creation failed: ${email}`);
      throw new InternalServerException('User creation Failed', ErrorCode.INTERNAL_SERVER_ERROR);
    }

    return {
      user: newUser,
    };
  }
}
