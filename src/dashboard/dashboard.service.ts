import { BadRequestException } from '../common/utils/catch-errors';
import prismaClient from '../config/prisma';

export class DashboardService {
    public async getDashboardStats() {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
    
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
          // Get total bookings
          const totalBookings = await prismaClient.chaletBooking.count();
    
          // Get available chalets
          const availableChalets = await prismaClient.chalet.count({
            where: {
              isUnderMaintenance: false,
              ChaletUnavailableDates: {
                none: {
                  date: today
                }
              }
            }
          });
    
          // Get check-ins for today
          const checkInsToday = await prismaClient.chaletBooking.count({
            where: {
              checkIn: {
                gte: today,
                lt: tomorrow
              },
              status: 'CONFIRMED'
            }
          });
    
          // Get check-outs for today
          const checkOutsToday = await prismaClient.chaletBooking.count({
            where: {
              checkOut: {
                gte: today,
                lt: tomorrow
              },
              status: 'CHECKED_IN'
            }
          });
    
          // Calculate total revenue
          const totalRevenue = await prismaClient.payment.aggregate({
            _sum: {
              amount: true
            },
            where: {
              status: 'FULLY_PAID'
            }
          });
    
          // Get revenue history
          const revenueHistory = await prismaClient.payment.groupBy({
            by: ['createdAt'],
            _sum: {
              amount: true
            },
            where: {
              createdAt: {
                gte: thirtyDaysAgo
              },
              status: 'FULLY_PAID'
            },
            orderBy: {
              createdAt: 'asc'
            }
          });
    
          // Get recent bookings
          const recentBookings = await prismaClient.chaletBooking.findMany({
            take: 5,
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              chalet: true,
              customer: true
            }
          });
    
          return {
            stats: {
              totalBookings,
              availableChalets,
              checkInsToday,
              checkOutsToday,
              totalRevenue: totalRevenue._sum.amount || 0,
              revenueHistory: revenueHistory.map(entry => ({
                date: entry.createdAt.toISOString().split('T')[0],
                amount: Number(entry._sum.amount) || 0
              })),
              recentBookings: recentBookings.map(booking => ({
                id: booking.id,
                chaletName: booking.chalet.name,
                customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
                checkIn: booking.checkIn.toISOString().split('T')[0],
                status: booking.status
              }))
            }
          };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          throw new BadRequestException('Failed to fetch dashboard stats');
        }
      }
}