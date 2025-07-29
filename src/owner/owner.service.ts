import { BadRequestException, InternalServerException } from '../common/utils/catch-errors';
import prismaClient from '../config/prisma';
import { OwnerDto } from './dtos/owner.dto';
import { ErrorCode } from '../common/enum/error-code.enum';
import * as argon2 from 'argon2';
import { generateAvatarUrl } from '../auth/auth-utils/image-generator';
import { logger } from '../common/utils/logger';
import { RoleEnum } from '../common/enum/role.enum';

export class OwnerService {
  public async createOwner(ownerDto: OwnerDto) {
    const { name, email, password, role } = ownerDto;

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
        email_verified: new Date(),
        isEmailVerified: true,
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

    return {
      owner: newUser,
    };
  }

  public async getOwners() {
    const users = await prismaClient.userAccount.findMany({
      where: { role: RoleEnum.CHALET_OWNER },
      select: {
        photo: {
          select: {
            image: true,
          },
        },
        password: false,
        name: true,
        id: true,
        isEmailVerified: true,
      },
      orderBy: { firstName: 'asc' },
    });

    return {
      owners: users,
    };
  }

  public async getOwner(ownerId: string) {
    const owner = await prismaClient.userAccount.findUnique({
      where: {
        id: ownerId,
      },
      include: { photo: true },
    });

    if (!owner) {
      throw new BadRequestException('Owner not found');
    }
    return {
      owner: owner,
    };
  }
}
