import { Request, Response } from 'express';
import { asyncHandler } from '../common/utils/asyncHandler';
import { BookingService } from './booking.service';
import {
  createPaymentTokenSchema,
  generateBookingServices,
  verifyPaymentSchema,
} from './schema/payment';
import httpStatus from 'http-status';
import { config } from '../config/app.config';

export class BookingController {
  private bookingService: BookingService;

  constructor(bookingService: BookingService) {
    this.bookingService = bookingService;
  }

  /**
   * Create payment token for reservation
   */
  public createPaymentToken = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      // Validate request body
      const validatedData = createPaymentTokenSchema.parse(req.body);

      // If services not provided, generate them from booking data
      const processedData = {
        ...validatedData,
        services:
          validatedData.services ||
          generateBookingServices(
            validatedData.checkIn,
            'Chalet Booking', // You can get chalet name from database if needed
          ),
      };

      const result =
        await this.bookingService.createPaymentTokenAndPrepareReservation(processedData);

      return res.status(httpStatus.CREATED).json({
        message: 'Payment token created successfully',
        data: result,
      });
    },
  );

  /**
   * Verify payment and complete reservation
   */
  public verifyPayment = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { reservationReference } = verifyPaymentSchema.parse(req.body);

    const result =
      await this.bookingService.verifyPaymentAndCompleteReservation(reservationReference);

    return res.status(httpStatus.OK).json({
      message: 'Payment verified and reservation completed successfully',
      data: result,
    });
  });

  /**
   * Handle DPO webhook
   */
  public handleDPOWebhook = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    try {
      // Get signature from headers if DPO provides one
      //   const signature = req.headers['x-dpo-signature'] as string;

      await this.bookingService.handlePaymentWebhook(req.body);

      // DPO expects a specific response format - check their documentation
      return res.status(httpStatus.OK).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      // Still return OK to prevent DPO from retrying failed webhooks indefinitely
      return res.status(httpStatus.OK).send('OK');
    }
  });

  /**
   * Handle payment success redirect
   */
  public handlePaymentSuccess = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { ref: reservationReference } = req.query;

    if (!reservationReference || typeof reservationReference !== 'string') {
      res.redirect(`${config.FRONTEND_URL}/booking/error?message=Invalid reservation reference`);
      return;
    }

    try {
      // Verify payment and complete reservation
      const result =
        await this.bookingService.verifyPaymentAndCompleteReservation(reservationReference);

      // Redirect to success page with booking details
      res.redirect(
        `${config.FRONTEND_URL}/booking/success?bookingId=${result.booking?.id}&status=confirmed`,
      );
    } catch (error) {
      console.error('Payment success handling error:', error);
      res.redirect(`${config.FRONTEND_URL}/booking/error?message=Payment verification failed`);
    }
  });

  /**
   * Handle payment cancellation redirect
   */
  public handlePaymentCancel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { ref: reservationReference } = req.query;

    // Clean up pending reservation if exists
    if (reservationReference && typeof reservationReference === 'string') {
      try {
        await this.bookingService.cancelPendingReservation(reservationReference);
      } catch (error) {
        console.error('Error cleaning up cancelled reservation:', error);
      }
    }

    res.redirect(`${config.FRONTEND_URL}/booking/cancelled?message=Payment was cancelled`);
  });

  /**
   * Handle payment error redirect
   */
  public handlePaymentError = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { ref: reservationReference, error } = req.query;

    // Clean up pending reservation if exists
    if (reservationReference && typeof reservationReference === 'string') {
      try {
        await this.bookingService.cancelPendingReservation(reservationReference);
      } catch (cleanupError) {
        console.error('Error cleaning up failed reservation:', cleanupError);
      }
    }

    const errorMessage = error || 'Payment failed';
    res.redirect(
      `${config.FRONTEND_URL}/booking/error?message=${encodeURIComponent(errorMessage as string)}`,
    );
  });

  /**
   * Get booking status (useful for frontend to check reservation status)
   */
  public getBookingStatus = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { bookingId } = req.params;

    const booking = await this.bookingService.getReservationByBookingId(bookingId as string);

    if (!booking) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'Booking not found',
      });
    }

    return res.status(httpStatus.OK).json({
      message: 'Booking found',
      data: booking,
    });
  });

  /**
   * Get booking status (useful for frontend to check reservation status)
   */
  public getBookingStatusByReference = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const { reservationReference } = req.params;

      const booking = await this.bookingService.getBookingStatusByReference(
        reservationReference as string,
      );

      if (!booking) {
        return res.status(httpStatus.NOT_FOUND).json({
          message: 'Booking not found',
        });
      }

      return res.status(httpStatus.OK).json({
        message: 'Booking found',
        data: booking,
      });
    },
  );
}
