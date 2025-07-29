import httpStatus from 'http-status';
import { asyncHandler } from '../common/utils/asyncHandler';
import { Request, Response } from 'express';
import { z } from 'zod';
import { AddonsService } from './addons.service';

export class AddonController {
  private addonsService: AddonsService;

  constructor(addonsService: AddonsService) {
    this.addonsService = addonsService;
  }

  public createAddon = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { addon } = await this.addonsService.createAddon(req.body);

    return res.status(httpStatus.CREATED).json({
      message: 'Addon added successfully',
      data: addon,
    });
  });

  public getAddons = asyncHandler(async (_req: Request, res: Response): Promise<Response> => {
    const dataAddons = await this.addonsService.getAddons();

    return res.status(httpStatus.OK).json({
      message: 'Retrieved addons successfully',
      addons: dataAddons.addons,
    });
  });

  public getAddon = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const addonId = z.string().parse(req.params['id']);
    const dataAddon = await this.addonsService.getAddon(addonId);

    return res.status(httpStatus.OK).json({
      message: 'Retrieved addon successfully',
      addon: dataAddon.addon,
    });
  });

  public updateAddon = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const addonId = z.string().parse(req.params['id']);
    const updatedAddon = await this.addonsService.updateAddon(addonId, req.body);

    return res.status(httpStatus.OK).json({
      message: 'Updated Addon successfully',
      addon: updatedAddon.addon,
    });
  });
}
