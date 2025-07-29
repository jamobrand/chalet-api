import httpStatus from 'http-status';
import { asyncHandler } from '../common/utils/asyncHandler';
import { ReservationService } from './reservation.service';
import { Request, Response } from 'express';
import { z } from 'zod';

export class ReservationController {
  private reservationService: ReservationService;

  constructor(reservationService: ReservationService) {
    this.reservationService = reservationService;
  }

  public getReservations = asyncHandler(async (_req: Request, res: Response): Promise<Response> => {
    const dataReservations = await this.reservationService.getReservations();

    return res.status(httpStatus.OK).json({
      message: 'Retrieved reservations successfully',
      reservations: dataReservations.bookings,
    });
  });

  public getReservation = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const reservationId = z.string().parse(req.params['id']);
    const dataReservation = await this.reservationService.getReservation(reservationId);

    return res.status(httpStatus.OK).json({
      message: 'Retrieved reservation successfully',
      reservation: dataReservation.booking,
    });
  });
}
