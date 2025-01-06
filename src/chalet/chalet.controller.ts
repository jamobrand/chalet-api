import { ChaletService } from './chalet.service';
import { Request, Response } from 'express';
import { asyncHandler } from '../common/utils/asyncHandler';
import httpStatus from 'http-status';
import { z } from 'zod';

export class ChaletController {
  private chaletService: ChaletService;

  constructor(chaletService: ChaletService) {
    this.chaletService = chaletService;
  }

  public createChalet = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { chalet } = await this.chaletService.createChalet(req.body);

    return res.status(httpStatus.CREATED).json({
      message: 'Chalet added successfully',
      data: chalet,
    });
  });

  public getChalets = asyncHandler(async (_req: Request, res: Response): Promise<Response> => {
    const dataChalets = await this.chaletService.getChalets();

    return res.status(httpStatus.OK).json({
      message: 'Retrieved chalets successfully',
      chalets: dataChalets.chalets,
    });
  });

  public searchChalets = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { checkIn, checkOut, rooms } = req.body;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const dataChalets = await this.chaletService.searchChalets(checkInDate, checkOutDate, rooms);

    return res.status(httpStatus.OK).json({
      message: 'Retrieved available chalets successfully',
      chalets: dataChalets.chalets,
    });
  });

  public searchChaletsByRoom = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const { checkIn, checkOut, rooms } = req.body;

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      const dataChalets = await this.chaletService.searchChaletsByRoom(
        checkInDate,
        checkOutDate,
        rooms,
      );

      return res.status(httpStatus.OK).json({
        message: 'Retrieved available chalets successfully',
        chalets: dataChalets.chalets,
      });
    },
  );

  public getChalet = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const chaletId = z.string().parse(req.params['id']);
    const dataChalet = await this.chaletService.getChalet(chaletId);

    return res.status(httpStatus.OK).json({
      message: 'Retrieved chalet successfully',
      chalet: dataChalet.chalet,
    });
  });

  public getChaletsHome = asyncHandler(async (_req: Request, res: Response): Promise<Response> => {
    const dataChalets = await this.chaletService.getChaletHomepage();

    return res.status(httpStatus.OK).json({
      message: 'Retrieved homepage chalets successfully',
      chalets: dataChalets.chalets,
    });
  });

  public reserveChalet = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { booking } = await this.chaletService.reserveChalet(req.body);

    return res.status(httpStatus.CREATED).json({
      message: 'Chalet booking successfully',
      data: booking,
    });
  });
}
