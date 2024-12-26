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
//import sendEmailTwo from '../mailers/mailer-two';
import { verifyEmailTemplate } from '../mailers/templates/verify-template';
import { emailQueue } from '../queue/email-queue';

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

    // const data = await sendEmail({
    //   to: newUser.email,
    //   ...verifyEmailTemplate(verificationUrl),
    // });

    // await sendEmailTwo({
    //   to: newUser.email,
    //   from: process.env['EMAIL_FROM'],
    //   ...verifyEmailTemplate(verificationUrl),
    // });

    const verificationUrl = `${config.APP_ORIGIN}/auth/confirm-account?code=${verification.code}`;
    const emailContent = verifyEmailTemplate(verificationUrl);

    try {
      // Remove 'sendEmailTwo' from add() - just pass the data
      await emailQueue.add(
        'send-verification-email', // Job name for identification
        {
          to: newUser.email,
          from: process.env['EMAIL_FROM'],
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        },
      );

      logger.info(`Verification email queued for ${newUser.email}`);
    } catch (error) {
      logger.error('Failed to queue verification email', error);
      // Decide if you want to throw an error or continue
      throw new InternalServerException(
        'Failed to queue verification email',
        ErrorCode.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      user: newUser,
    };
  }
}
