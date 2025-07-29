import { BadRequestException } from '../common/utils/catch-errors';
import prismaClient from '../config/prisma';

export class ReservationService {
  public async getReservations() {
    const reservations = await prismaClient.chaletBooking.findMany({
      include: {
        customer: true,
        chalet: true,
        bookingDates: true,
        payments: true,
        _count: true,
      },
    });

    return {
      bookings: reservations,
    };
  }

  public async getReservation(reservationId: string) {
    const reservation = await prismaClient.chaletBooking.findUnique({
      where: {
        id: reservationId,
      },
      include: {
        chalet: true,
        bookingDates: true,
        bookingAddOn:{
          include: {
            addOn: true,
          } 
        },
        customer: true,
        payments: true,
        _count: true,
      },
    });

    if (!reservation) {
      throw new BadRequestException('Reservation not found');
    }
    return {
      booking: reservation,
    };
  }
}
