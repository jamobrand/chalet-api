import crypto from 'crypto';
import { DPOService } from '../dpo-payment/dpo.service';
import { DPOWebhookPayload, PendingReservation } from './types/bookin.types';
import { CreatePaymentTokenDto } from './dto/create-payment-booking.dto';
import prismaClient from '../config/prisma';
import { BadRequestException } from '../common/utils/catch-errors';
import { ErrorCode } from '../common/enum/error-code.enum';
import { config } from '../config/app.config';
import sendEmailTwo from '../mailers/mailer-two';
import { bookingConfirmationTemplate } from '../mailers/templates/booking-confirmation';
import { generateBookingServices } from './schema/payment';
import {
  mapDPOPaymentMethod,
  mapDPOPaymentStatus,
  validateDPOPayment,
} from '../utils/payment-mapping';
import { Decimal } from '@prisma/client/runtime/library';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
const LENGTH = 7;

async function generateBookingCode(): Promise<string> {
  let code = '';
  for (let i = 0; i < LENGTH; i++) {
    const idx = await crypto.randomInt(0, CHARS.length);
    code += CHARS[idx];
  }
  return code;
}

export class BookingService {
  private dpoService: DPOService;
  private pendingReservations = new Map<string, PendingReservation>();

  constructor() {
    this.dpoService = new DPOService();
    // Clean up expired reservations every 30 minutes
    setInterval(() => this.cleanupExpiredReservations(), 30 * 60 * 1000);
  }

  /**
   * Clean up expired reservations
   */
  private cleanupExpiredReservations(): void {
    const now = new Date();
    for (const [key, reservation] of this.pendingReservations.entries()) {
      if (reservation.expiresAt < now) {
        this.pendingReservations.delete(key);
      }
    }
  }

  /**
   * Generate a secure reservation reference
   */
  private async generateReservationReference(): Promise<string> {
    const code = await generateBookingCode();
    return `CHA-${code}`;
  }

  /**
   * Store pending reservation temporarily (30 minutes)
   */
  private storePendingReservation(
    reference: string,
    data: Omit<PendingReservation, 'id' | 'expiresAt' | 'createdAt'>,
  ): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

    this.pendingReservations.set(reference, {
      id: reference,
      ...data,
      expiresAt,
      createdAt: now,
    });
  }

  /**
   * Get pending reservation
   */
  private getPendingReservation(reference: string): PendingReservation | null {
    const reservation = this.pendingReservations.get(reference);
    if (!reservation) return null;

    // Check if expired
    if (reservation.expiresAt < new Date()) {
      this.pendingReservations.delete(reference);
      return null;
    }

    return reservation;
  }

  /**
   * Create payment token for DPO payment and prepare reservation
   */
  public async createPaymentTokenAndPrepareReservation(
    prepareReservationTokenDto: CreatePaymentTokenDto,
  ) {
    try {
      // Generate unique reference for this reservation
      const reservationReference = await this.generateReservationReference();

      // Validate chalet exists and is available for selected dates
      const chalet = await prismaClient.chalet.findUnique({
        where: { id: prepareReservationTokenDto.chaletId },
      });

      if (!chalet) {
        throw new BadRequestException('Chalet not found', ErrorCode.CHALET_NOT_FOUND);
      }

      // Check for conflicting bookings
      const conflictingBookings = await prismaClient.chaletBooking.findMany({
        where: {
          chaletId: prepareReservationTokenDto.chaletId,
          status: {
            in: ['CONFIRMED', 'CHECKED_IN'],
          },
          bookingDates: {
            some: {
              date: {
                in: prepareReservationTokenDto.selectedDates.map((date) => new Date(date)),
              },
            },
          },
        },
      });

      if (conflictingBookings.length > 0) {
        throw new Error('Selected dates are not available');
      }

      // Store pending reservation
      this.storePendingReservation(reservationReference, {
        chaletId: prepareReservationTokenDto.chaletId,
        checkIn: prepareReservationTokenDto.checkIn,
        checkOut: prepareReservationTokenDto.checkOut,
        adults: prepareReservationTokenDto.adults,
        children: prepareReservationTokenDto.children,
        totalCost: prepareReservationTokenDto.totalCost,
        selectedDates: prepareReservationTokenDto.selectedDates,
        addons: prepareReservationTokenDto.addons,
        customer: prepareReservationTokenDto.customer,
      });

      // Generate services if not provided
      const services =
        prepareReservationTokenDto.services ||
        generateBookingServices(
          prepareReservationTokenDto.checkIn,
          chalet.name || 'Chalet Booking',
        );

      // Create DPO payment token
      const tokenResponse = await this.dpoService.createToken({
        paymentAmount: prepareReservationTokenDto.totalCost,
        paymentCurrency: 'KES',
        companyRef: reservationReference,
        redirectUrl: `${config.CHALET_USER_URL}/payment/success?ref=${reservationReference}`,
        backUrl: `${config.CHALET_USER_URL}/payment/cancel?ref=${reservationReference}`,
        customer: prepareReservationTokenDto.customer,
        services: services.map((service) => ({
          serviceType: service.serviceType,
          serviceDescription: service.serviceDescription,
          serviceDate: service.serviceDate,
        })),
      });

      if (tokenResponse.result !== '000') {
        throw new Error(
          `Payment token creation failed: ${tokenResponse.result} ${tokenResponse.resultExplanation}`,
        );
      }

      // Update pending reservation with token
      const pendingReservation = this.pendingReservations.get(reservationReference);
      if (pendingReservation && tokenResponse.transToken) {
        pendingReservation.transToken = tokenResponse.transToken;
        this.pendingReservations.set(reservationReference, pendingReservation);
      }

      return {
        reservationReference,
        transToken: tokenResponse.transToken,
        paymentUrl: this.dpoService.generatePaymentUrl(tokenResponse.transToken!),
        expiresIn: 30 * 60 * 1000, // 30 minutes in milliseconds
      };
    } catch (error) {
      console.error('Create payment token error:', error);
      throw error;
    }
  }

  /**
   * Verify payment and complete reservation
   */

  public async verifyPaymentAndCompleteReservation(reservationReference: string) {
    try {
      // Get pending reservation
      const pendingReservation = this.getPendingReservation(reservationReference);
      console.log('Pending reservation:', pendingReservation);

      if (!pendingReservation) {
        throw new Error('Reservation not found or expired');
      }

      if (!pendingReservation.transToken) {
        throw new Error('Payment token not found for this reservation');
      }

      // Verify payment with DPO
      const verificationResponse = await this.dpoService.verifyToken({
        transactionToken: pendingReservation.transToken,
        companyRef: reservationReference,
        verifyTransaction: true,
      });

      console.log('DPO verification response:', verificationResponse);

      if (verificationResponse.result !== '000') {
        throw new Error(`Payment verification failed: ${verificationResponse.resultExplanation}`);
      }

      // Check if payment was successful
      const isPaymentSuccessful =
        verificationResponse.result === '000' &&
        verificationResponse.transactionApproval &&
        verificationResponse.transactionApproval !== '' &&
        verificationResponse.transactionApproval !== 'null';

      console.log('Is payment successful:', isPaymentSuccessful);

      if (!isPaymentSuccessful) {
        throw new Error('Payment was not successful');
      }

      // Create customer record
      const customerRecord = await prismaClient.customer.create({
        data: {
          firstName: pendingReservation.customer.firstName,
          lastName: pendingReservation.customer.lastName,
          email: pendingReservation.customer.email,
          phone: pendingReservation.customer.phone,
          addresss: pendingReservation.customer.address,
          nationality: pendingReservation.customer.nationality,
          passportNumber: pendingReservation.customer.nationalIdNumber,
        },
      });

      // Create booking
      const booking = await prismaClient.chaletBooking.create({
        data: {
          customerId: customerRecord.id,
          chaletId: pendingReservation.chaletId,
          checkIn: new Date(pendingReservation.checkIn),
          checkOut: new Date(pendingReservation.checkOut),
          numberOfAdults: pendingReservation.adults,
          numberOfChildren: pendingReservation.children,
          totalCost: pendingReservation.totalCost,
          status: 'CONFIRMED',
          bookingReference: reservationReference,
          totalGuests: pendingReservation.adults + pendingReservation.children,
        },
      });

      // Create booking dates
      const transformedDates = pendingReservation.selectedDates.map((date) => ({
        bookingId: booking.id,
        date: new Date(date),
      }));

      await prismaClient.bookingDate.createMany({
        data: transformedDates,
        skipDuplicates: true,
      });

      // Create booking addons if any
      if (pendingReservation.addons.length > 0) {
        const transformedAddons = pendingReservation.addons.map((addon) => ({
          bookingId: booking.id,
          addOnId: addon.addonId,
        }));

        await prismaClient.bookingAddon.createMany({
          data: transformedAddons,
          skipDuplicates: true,
        });
      }

      // Validate payment details
      const paymentValidation = validateDPOPayment(
        verificationResponse,
        pendingReservation.totalCost,
        'KES',
      );

      console.log('Payment validation result:', paymentValidation);

      // If validation fails, throw an error with detailed messages and warnings
      if (!paymentValidation.isValid) {
        throw new Error(`Payment validation failed: ${paymentValidation.errors.join(', ')}`);
      }

      // Log warnings if any
      if (paymentValidation.warnings.length > 0) {
        console.warn('Payment validation warnings:', paymentValidation.warnings);
      }

      // Map DPO response to your enum values
      const paymentMethod = mapDPOPaymentMethod(verificationResponse);
      const paymentStatus = mapDPOPaymentStatus(verificationResponse);

      // Create payment record with proper enum values

      await prismaClient.payment.create({
        data: {
          bookingId: booking.id,
          customerId: customerRecord.id,
          amount: verificationResponse.transactionAmount || pendingReservation.totalCost,
          method: paymentMethod,
          transactionId: verificationResponse.accRef || pendingReservation.transToken,
          status: paymentStatus,
          // Add DPO-specific fields with proper null checks
          dpoTransToken: pendingReservation.transToken,
          dpoApprovalCode: verificationResponse.transactionApproval || null,
          dpoSettlementDate: verificationResponse.transactionSettlementDate || null,
          dpoCustomerCredit: verificationResponse.customerCredit || null,
          dpoFraudAlert: verificationResponse.fraudAlert || null,
          dpoFraudExplanation: verificationResponse.fraudExplanation || null,
          dpoResultCode: verificationResponse.result || null,
          dpoResultExplanation: verificationResponse.resultExplanation || null,
          dpoTransactionAmount: verificationResponse.transactionAmount
            ? new Decimal(verificationResponse.transactionAmount.toString())
            : null,
          dpoTransactionNetAmount: verificationResponse.transactionNetAmount
            ? new Decimal(verificationResponse.transactionNetAmount.toString())
            : null,
          dpoCurrency: verificationResponse.transactionCurrency || null,
          dpoCustomerCreditType: verificationResponse.customerCreditType || null,
          dpoFraudAlertCode: verificationResponse.fraudAlert || null, // You might want to map this differently
        },
      });

      // Remove from pending reservations
      this.pendingReservations.delete(reservationReference);

      // Send confirmation email
      await sendEmailTwo({
        to: pendingReservation.customer.email,
        from: process.env['EMAIL_FROM'],
        ...bookingConfirmationTemplate({
          booking: {
            ...booking,
            customer: customerRecord,
            checkIn: new Date(pendingReservation.checkIn),
            checkOut: new Date(pendingReservation.checkOut),
            totalAmount: pendingReservation.totalCost,
          },
        }),
      });

      // Get complete reservation details
      const completedReservation = await prismaClient.chaletBooking.findUnique({
        where: { id: booking.id },
        include: {
          chalet: true,
          customer: true,
          bookingDates: true,
          payments: true,
          bookingAddOn: {
            include: {
              addOn: true,
            },
          },
        },
      });

      return {
        booking: completedReservation,
        paymentDetails: verificationResponse,
      };
    } catch (error) {
      console.error('Verify payment and complete reservation error:', error);
      throw error;
    }
  }

  /**
   * Handle DPO webhook for payment notifications
   */

  public async handlePaymentWebhook(payload: DPOWebhookPayload) {
    try {
      console.log('Received DPO webhook payload:', payload);

      // Validate webhook payload structure
      if (!this.dpoService.validateWebhookPayload(payload)) {
        throw new Error('Invalid webhook payload structure');
      }

      // TODO: Implement signature validation when DPO provides it
      // if (signature && !this.dpoService.validateWebhookSignature(payload, signature)) {
      //   throw new Error('Invalid webhook signature');
      // }

      const { CompanyRef: reservationReference, Result: result } = payload;

      console.log(`Processing webhook for reservation: ${reservationReference}, result: ${result}`);

      // If payment is successful (DPO returns '000' for success)
      if (result === '000') {
        try {
          await this.verifyPaymentAndCompleteReservation(reservationReference);
          console.log(`Webhook successfully processed reservation: ${reservationReference}`);
        } catch (error) {
          console.error('Webhook reservation completion error:', error);
          // Log the error but don't throw - webhook should still return success
          // to prevent DPO from retrying infinitely
        }
      } else {
        console.log(
          `Payment not successful for reservation ${reservationReference}, result: ${result}`,
        );
        // You might want to update the reservation status to failed here
      }

      return { status: 'success', message: 'Webhook processed' };
    } catch (error) {
      console.error('Webhook processing error:', error);
      // For production, you might want to return success anyway to prevent retries
      // unless it's a critical validation error
      throw error;
    }
  }

  /**
   * Cancel pending reservation
   */
  public async cancelPendingReservation(reservationReference: string): Promise<void> {
    try {
      const pendingReservation = this.getPendingReservation(reservationReference);
      if (pendingReservation) {
        // Remove from pending reservations
        this.pendingReservations.delete(reservationReference);
        console.log(`Cancelled pending reservation: ${reservationReference}`);
      }
    } catch (error) {
      console.error('Cancel pending reservation error:', error);
      // Don't throw error as this is cleanup
    }
  }

  /**
   * Get reservation status by booking ID (for success redirects)
   */
  public async getReservationByBookingId(bookingId: string) {
    try {
      const reservation = await prismaClient.chaletBooking.findUnique({
        where: { id: bookingId },
        include: {
          chalet: true,
          customer: true,
          bookingDates: true,
          payments: true,
          bookingAddOn: {
            include: {
              addOn: true,
            },
          },
        },
      });

      return reservation;
    } catch (error) {
      console.error('Get reservation by booking ID error:', error);
      throw error;
    }
  }

  /**
   * Get booking status
   */
  public async getBookingStatusByReference(reservationReference: string) {
    // Check if it's a pending reservation
    const pendingReservation = this.getPendingReservation(reservationReference);
    if (pendingReservation) {
      return {
        status: 'PENDING',
        reservation: pendingReservation,
      };
    }

    // Check if it's a completed reservation
    const completedReservation = await prismaClient.chaletBooking.findFirst({
      where: {
        payments: {
          some: {
            transactionId: reservationReference,
          },
        },
      },
      include: {
        chalet: true,
        customer: true,
        bookingDates: true,
        payments: true,
        bookingAddOn: {
          include: {
            addOn: true,
          },
        },
      },
    });

    if (completedReservation) {
      return {
        status: completedReservation.status,
        reservation: completedReservation,
      };
    }

    return {
      status: 'NOT_FOUND',
      reservation: null,
    };
  }
}
