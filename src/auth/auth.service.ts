import * as argon2 from 'argon2';
import { ErrorCode } from '../common/enum/error-code.enum';
import { BadRequestException, InternalServerException } from '../common/utils/catch-errors';
import prismaClient from '../config/prisma';
import { RegisterDto } from './dtos/register.dto';
import { generateAvatarUrl } from './auth-utils/image-generator';
import { logger } from '../common/utils/logger';
import { generateUniqueCode } from '../common/lib/uuid';
import { VerificationEnum } from '../common/enum/verification-code.enum';
import { fortyFiveMinutesFromNow } from '../common/lib/date-time';
import { config } from '../config/app.config';
import sendEmailTwo from '../mailers/mailer-two';
import { verifyEmailTemplate } from '../mailers/templates/verify-template';
import { UserAccountStatus } from '@prisma/client';
import { LoginDto } from './dtos/login.dto';
import { createAccessToken } from '../common/lib/generateTokens.util';

export class AuthService {
  public async register(registerDto: RegisterDto) {
    const { name, email, password, role } = registerDto;

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
    const avatarUrl = generateAvatarUrl(email);

    const newUser = await prismaClient.userAccount.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        photo: {
          create: {
            image: avatarUrl,
            name: 'Gravatar',
            isGravatar: true,
          },
        },
      },
    });

    if (!newUser) {
      logger.warn(`User creation failed: ${email}`);
      throw new InternalServerException('User creation Failed', ErrorCode.INTERNAL_SERVER_ERROR);
    }

    const userId = newUser.id;

    const verification = await prismaClient.verificationCode.create({
      data: {
        userAccountId: userId,
        code: generateUniqueCode(),
        type: VerificationEnum.EMAIL_VERIFICATION,
        expiresAt: fortyFiveMinutesFromNow(),
      },
    });

    // Sending verification email link
    const verificationUrl = `${config.FRONTEND_URL}/confirm-account?code=${verification.code}`;

    const outputMail = await sendEmailTwo({
      to: newUser.email,
      from: process.env['EMAIL_FROM'],
      ...verifyEmailTemplate(verificationUrl),
    });

    console.log('outputMail:', outputMail)

    
    return {
      user: newUser,
    };
  }

  public async verifyEmail(code: string) {
    const validCode = await prismaClient.verificationCode.findFirst({
      where: {
        code: code,
        type: VerificationEnum.EMAIL_VERIFICATION,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!validCode) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const updatedUser = await prismaClient.userAccount.update({
      where: {
        id: validCode.userAccountId,
      },
      data: {
        isEmailVerified: true,
        email_verified: new Date(),
        status: UserAccountStatus.Active,
      },
    });

    if (!updatedUser) {
      throw new BadRequestException('Unable to verify email address', ErrorCode.VALIDATION_ERROR);
    }

    await prismaClient.verificationCode.delete({
      where: {
        id: validCode.id,
      },
    });

    return {
      user: updatedUser,
    };
  }

  public async login(loginData: LoginDto) {
    const { email, password } = loginData;

    logger.info(`Login attempt for email: ${email}`);
    const foundUser = await prismaClient.userAccount.findFirst({
      where: { email },
      include: { photo: true },
    });

    if (!foundUser) {
      logger.warn(`Login failed: User with email ${email} not found`);
      throw new BadRequestException(
        'Invalid email or password provided',
        ErrorCode.AUTH_USER_NOT_FOUND,
      );
    }

    const isPasswordMatch = await argon2.verify(foundUser.password, password);
    if (!isPasswordMatch) {
      logger.warn(`Login failed: Invalid password for email: ${email}`);
      throw new BadRequestException(
        'Invalid email or password provided',
        ErrorCode.AUTH_USER_NOT_FOUND,
      );
    }

    const accessToken = createAccessToken(foundUser.id);

    logger.info(`Login successful for user ID: ${foundUser.id}`);
    return {
      foundUser,
      accessToken,
    };
  }

  public async getUser(userId: string) {
    const userDetails = await prismaClient.userAccount.findUnique({
      where: {
        id: userId,
      },
      // include: {
      //   photo: true,
      // },
      select:{
        password: false,
        photo:true,
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isEmailVerified: true,
        email_verified: true
      },
    });
    return { userDetails };
  }
}
