import { BadRequestException } from '../common/utils/catch-errors';
import prismaClient from '../config/prisma';
import { ChaletDataDto, EditChaletDataDto } from './dtos/create-chalet.dto';
import { ErrorCode } from '../common/enum/error-code.enum';
import {
  AvailabilityCalendar,
  ChaletWithAvailability,
  ChaletWithRelations,
} from './dtos/get-chalet.dto';
import { add, endOfMonth, format, startOfToday } from 'date-fns';
import { ChaletReserveDto } from './dtos/chalet-reserve.dto';
import sendEmailTwo from '../mailers/mailer-two';
import { bookingConfirmationTemplate } from '../mailers/templates/booking-confirmation';

//import { SearchChaletInputDto } from './dtos/search-input-chalet';

export class ChaletService {
  public async createChalet(chaletDto: ChaletDataDto) {
    const { chaletDetails, location, roomDetails, amenities, availability, images } = chaletDto;

    // Check if a chalet with this name already exists
    const existingChalet = await prismaClient.chalet.findUnique({
      where: { name: chaletDetails.name },
    });

    if (existingChalet) {
      throw new BadRequestException(
        'Chalet with this name already exists',
        ErrorCode.CHALET_NAME_ALREADY_EXISTS,
      );
    }

    const newChalet = await prismaClient.chalet.create({
      data: {
        name: chaletDetails.name,
        propertyType: chaletDetails.propertyType,
        description: chaletDetails.description,
        basePrice: chaletDetails.basePrice,
        roomCount: Number(chaletDetails.roomCount),
        totalWashrooms: Number(chaletDetails.totalWashrooms),
        totalFloors: Number(chaletDetails.totalFloors),
        maxAdults: Number(chaletDetails.maxAdults),
        maxChildren: Number(chaletDetails.maxChildren),
        totalSleeps: Number(chaletDetails.totalSleeps),
        isEnsuite: Boolean(chaletDetails.isEnsuite),
        weekendPrice: chaletDetails.weekendPrice || 0,
        hasDownstairsLounge: Boolean(chaletDetails.hasDownstairsLounge),
        hasUpstairsLounge: Boolean(chaletDetails.hasUpstairsLounge),
        locationName: location.name,
        address: location.address,
        coordinates: location.coordinates,
        ownerId: chaletDetails.ownerId,
        // companyManagementId: chaletDetails?.companyManagementId || '', // Use null if optional
        images: {
          createMany: {
            data: images.map((image) => ({
              url: image.url,
              alt: image.alt,
              key: image.key,
              label: image.label,
              isMain: image.isMain,
            })),
          },
        },
      },
    });

    await prismaClient.room.createMany({
      data: roomDetails.map((roomDetail) => ({
        ...roomDetail,
        chaletId: newChalet.id,
      })),
    });

    // Handle amenities
    // First, ensure all predefined amenities exist
    const predefinedAmenitiesData = amenities.predefinedAmenities.map((name) => ({ name }));
    await prismaClient.chaletAmenity.createMany({
      data: predefinedAmenitiesData,
      skipDuplicates: true, // This will skip if the amenity already exists
    });

    // Now fetch all predefined amenities
    const existingAmenities = await prismaClient.chaletAmenity.findMany({
      where: {
        name: {
          in: amenities.predefinedAmenities,
        },
      },
    });

    // Create custom amenities
    const createdCustomAmenities = await Promise.all(
      amenities.customAmenities.map(async (amenity) => {
        return prismaClient.chaletAmenity.create({
          data: { name: amenity.name },
        });
      }),
    );

    // Combine all amenities
    const allAmenities = [...existingAmenities, ...createdCustomAmenities];

    // Update chalet with amenities
    await prismaClient.chalet.update({
      where: { id: newChalet.id },
      data: {
        amenities: {
          connect: allAmenities.map((amenity) => ({ id: amenity.id })),
        },
      },
    });

    const transformedDate = availability.unavailableDates.map((date) => ({
      chaletId: newChalet.id,
      date: new Date(date), // Convert string to Date object
    }));

    await prismaClient.chaletUnavailableDates.createMany({
      data: transformedDate,
      skipDuplicates: true, // Prevent duplicate entries if already saved
    });

    return {
      chalet: newChalet,
    };
  }

  public async getChalets() {
    const chalets = await prismaClient.chalet.findMany({
      include: {
        rooms: true,
        ChaletUnavailableDates: true,
        amenities: true,
        images: true,
        _count: true,
      },
    });

    return {
      chalets: chalets,
    };
  }

  public async deleteChalet(chaletId: string) {
    await prismaClient.$transaction([
      // prismaClient.image.deleteMany({
      //   where: { chaletId },
      // }),
      prismaClient.chalet.delete({
        where: { id: chaletId },
      }),
    ]);

    return { message: 'Chalet deleted successfully' };
  }

  public async searchChalets(
    checkIn: Date,
    checkOut: Date,
    rooms: { adults: number; children: number }[],
  ) {
    const totalGuests = rooms.reduce((sum, room) => sum + room.adults + room.children, 0);

    const availableChalets = await prismaClient.chalet.findMany({
      where: {
        AND: [
          {
            roomCount: {
              gte: rooms.length,
            },
          },
          {
            // Check ChaletUnavailableDates
            ChaletUnavailableDates: {
              none: {
                date: {
                  gte: checkIn,
                  lte: checkOut,
                },
              },
            },
          },
          {
            // Check BookingDates
            bookings: {
              none: {
                bookingDates: {
                  some: {
                    date: {
                      gte: checkIn,
                      lte: checkOut,
                    },
                  },
                },
              },
            },
          },
          {
            rooms: {
              some: {
                capacity: {
                  gte: Math.ceil(totalGuests / rooms.length),
                },
              },
            },
          },
        ],
      },

      include: {
        rooms: true,
        ChaletUnavailableDates: true,
        amenities: true,
        images: true,
        _count: true,
      },
    });
    return {
      chalets: availableChalets,
    };
  }

  public async searchChaletsByRoom(checkIn: Date, checkOut: Date, rooms: number) {
    const availableChalets = await prismaClient.chalet.findMany({
      where: {
        AND: [
          {
            roomCount: {
              gte: rooms,
            },
          },
          {
            // Check ChaletUnavailableDates
            ChaletUnavailableDates: {
              none: {
                date: {
                  gte: checkIn,
                  lte: checkOut,
                },
              },
            },
          },
          {
            // Check BookingDates
            bookings: {
              none: {
                bookingDates: {
                  some: {
                    date: {
                      gte: checkIn,
                      lte: checkOut,
                    },
                  },
                },
              },
            },
          },
          {
            rooms: {
              some: {
                capacity: {
                  gte: Math.ceil(rooms),
                },
              },
            },
          },
        ],
      },

      include: {
        rooms: true,
        ChaletUnavailableDates: true,
        amenities: true,
        images: true,
        _count: true,
      },
    });
    return {
      chalets: availableChalets,
    };
  }

  public async getChalet(chaletId: string) {
    const chalet = await prismaClient.chalet.findUnique({
      where: {
        id: chaletId,
      },
      include: {
        amenities: true,
        ChaletUnavailableDates: true,
        rooms: true,
        images: true,
        _count: true,
        bookings: {
          include: {
            bookingDates: true,
          },
        },
      },
    });

    if (!chalet) {
      throw new BadRequestException('Chalet not found');
    }
    return {
      chalet: chalet,
    };
  }

  public async getChaletHomepage(): Promise<{ chalets: ChaletWithAvailability[] }> {
    // Get current date and end of next month for availability window
    const today = startOfToday();
    const endDate = endOfMonth(add(today, { months: 2 })); // Show availability for next 2 months

    // Fetch 4 chalets with their related data
    const chalets = await prismaClient.chalet.findMany({
      take: 4,
      where: {
        isUnderMaintenance: false, // Only show available chalets
      },
      include: {
        rooms: true,
        amenities: true,
        images: true,
        ChaletUnavailableDates: {
          where: {
            date: {
              gte: today,
              lte: endDate,
            },
          },
        },
        bookings: {
          where: {
            OR: [
              {
                checkIn: {
                  gte: today,
                  lte: endDate,
                },
              },
              {
                checkOut: {
                  gte: today,
                  lte: endDate,
                },
              },
            ],
          },
          include: {
            bookingDates: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Show newest chalets first
      },
    });

    // Process availability for each chalet
    const chaletsWithAvailability: ChaletWithAvailability[] = chalets.map(
      (chalet: ChaletWithRelations) => {
        // Create array of dates between today and end date
        const availabilityCalendar: AvailabilityCalendar[] = [];
        let currentDate = today;

        while (currentDate <= endDate) {
          const isUnavailableDate = chalet.ChaletUnavailableDates.some(
            (unavailableDate) =>
              format(unavailableDate.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'),
          );

          const isBooked = chalet.bookings.some((booking) =>
            booking.bookingDates.some(
              (bookingDate) =>
                bookingDate.date &&
                format(bookingDate.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'),
            ),
          );

          availabilityCalendar.push({
            date: currentDate,
            isAvailable: !isUnavailableDate && !isBooked,
          });

          currentDate = add(currentDate, { days: 1 });
        }

        // Remove sensitive booking data and create the final object
        const { bookings, ChaletUnavailableDates, ...chaletData } = chalet;

        return {
          ...chaletData,
          availabilityCalendar,
          bookings,
          ChaletUnavailableDates,
        } as ChaletWithAvailability;
      },
    );

    return {
      chalets: chaletsWithAvailability,
    };
  }

  public async reserveChalet(reserveChaletDto: ChaletReserveDto) {
    const {
      checkIn,
      checkOut,
      chaletId,
      adults,
      customer,
      children,
      totalCost,
      payment,
      selectedDates,
      addons,
    } = reserveChaletDto;

    const customerRecord = await prismaClient.customer.create({
      data: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        addresss: customer.address,
        nationality: customer.nationality,
        passportNumber: customer.nationalIdNumber,
      },
    });

    // 2. Create Reservation
    const reservation = await prismaClient.chaletBooking.create({
      data: {
        customerId: customerRecord.id,
        chaletId: chaletId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        numberOfAdults: adults,
        numberOfChildren: children,
        totalCost,
        status: 'CONFIRMED',
        totalGuests: adults + children,
      },
    });

    const transformedDate = selectedDates.map((date) => ({
      bookingId: reservation.id,
      date: new Date(date), // Convert string to Date object
    }));

    const transformedAddon = addons.map((addon) => ({
      bookingId: reservation.id,
      addOnId: addon.addonId,
    }));

    await prismaClient.bookingDate.createMany({
      data: transformedDate,
      skipDuplicates: true, // Prevent duplicate entries if already saved
    });

    await prismaClient.bookingAddon.createMany({
      data: transformedAddon,
      skipDuplicates: true, // Prevent duplicate entries if already saved
    });

    if (reservation) {
      // 3. Create Payment Record
      if (payment) {
        await prismaClient.payment.create({
          data: {
            bookingId: reservation.id,
            amount: payment.amount,
            method: 'CREDIT_CARD',
            transactionId: payment.transactionId || null,
            status: 'FULLY_PAID',
          },
        });
      }

      // Send confirmation email
      await sendEmailTwo({
        to: customer.email,
        from: process.env['EMAIL_FROM'],
        ...bookingConfirmationTemplate({
          booking: {
            ...reservation,
            customer: customerRecord,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            totalAmount: payment.amount,
          },
        }),
      });
    }

    const reservedChalet = await prismaClient.chaletBooking.findUnique({
      where: {
        id: reservation.id,
      },
      include: {
        chalet: true,
        customer: true,
        bookingDates: true,
        payments: true,
      },
    });

    return {
      booking: reservedChalet,
    };
  }

  public async editChalet(chaletId: string, chaletData: EditChaletDataDto) {
    const { name, propertyType, description, basePrice } = chaletData;

    // Check if chalet exists
    const chalet = await prismaClient.chalet.findUnique({
      where: { id: chaletId },
    });

    if (!chalet) {
      throw new BadRequestException('Chalet not found', ErrorCode.CHALET_NOT_FOUND);
    }

    // Update chalet details
    const updatedChalet = await prismaClient.chalet.update({
      where: { id: chaletId },
      data: {
        name,
        propertyType,
        description,
        basePrice,
      },
    });

    return {
      chalet: updatedChalet,
    };
  }
}
