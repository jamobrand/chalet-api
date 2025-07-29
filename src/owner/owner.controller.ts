import { Request, Response } from 'express';
import { asyncHandler } from '../common/utils/asyncHandler';
import { OwnerService } from './owner.service';
import { ownerSchema } from './owner-utils/owner.validator';
import { OwnerDto } from './dtos/owner.dto';
import httpStatus from 'http-status';

export class OwnerController {
  private ownerService: OwnerService;

  constructor(ownerService: OwnerService) {
    this.ownerService = ownerService;
  }

  public createOwner = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const body = ownerSchema.parse({
      ...req.body,
    });
    const { owner } = await this.ownerService.createOwner(body as OwnerDto);
    return res.status(httpStatus.CREATED).json({
      message: 'User registered successfully',
      data: owner,
    });
  });

  public getOwners = asyncHandler(async (_req: Request, res: Response): Promise<Response> => {
    const dataOwners = await this.ownerService.getOwners();

    return res.status(httpStatus.OK).json({
      message: 'Retrieved owners successfully',
      owners: dataOwners.owners,
    });
  });
}
