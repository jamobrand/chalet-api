import { BadRequestException } from '../common/utils/catch-errors';
import prismaClient from '../config/prisma';

export class TransactionService {
  public async getTransactions() {
    const transactions = await prismaClient.payment.findMany({
      include: {
        booking: {
          include: {
            chalet: true,
            customer: true,
          },
        },
      },
    });

    return {
      transactions: transactions,
    };
  }

  public async getTransaction(transactionId: string) {
    const transaction = await prismaClient.payment.findUnique({
      where: {
        id: transactionId,
      },
      include: {
        booking: true,
      },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }
    return {
      transaction: transaction,
    };
  }
}
