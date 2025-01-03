import { logger } from '../common/utils/logger';
import { BadRequestException, InternalServerException } from '../common/utils/catch-errors';
import prismaClient from '../config/prisma';
import { CreateAddonDto } from './dtos/create-addon.dto';
import { ErrorCode } from '../common/enum/error-code.enum';

export class AddonsService {
  
  public async createAddon(createAddonDto: CreateAddonDto) {
    const { name,price, description } = createAddonDto;


    const newAddon = await prismaClient.addOn.create({
      data: {
        name,
        description,
        price,
      },
    });

    if (!newAddon) {
      logger.warn(`Addon creation failed: ${name}`);
      throw new InternalServerException('Addon creation Failed', ErrorCode.INTERNAL_SERVER_ERROR);
    }

    return {
      addon: newAddon,
    };
  }

  public async getAddons() {
    const addons = await prismaClient.addOn.findMany({
      include: {
        bookingAddons:true,
        _count:true
      },
    });

    return {
      addons: addons,
    };
  }

  public async getAddon(addonId: string) {
    const addon = await prismaClient.addOn.findUnique({
      where: {
        id: addonId,
      },
      include: {
        bookingAddons: true,
      },
    });

    if (!addon) {
      throw new BadRequestException('Transaction not found');
    }
    return {
      addon: addon,
    };
  }
}
