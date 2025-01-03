import { BadRequestException } from '../common/utils/catch-errors';
import prismaClient from '../config/prisma';

export class CustomerService {
  public async getCustomers() {
    const customers = await prismaClient.customer.findMany({
      include: {
        bookings: {
          include: {
            bookingDates: true,
          },
        },
        _count: true,
      },
    });

    return {
      customers: customers,
    };
  }

  public async getCustomer(customerId: string) {
    const customer = await prismaClient.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        bookings: {
          include: {
            bookingDates: true,
            chalet: true,
          },
        },
        _count: true,
      },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }
    return {
      customer: customer,
    };
  }
}
