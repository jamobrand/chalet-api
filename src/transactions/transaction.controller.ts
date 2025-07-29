import httpStatus from 'http-status';
import { asyncHandler } from '../common/utils/asyncHandler';
import { Request, Response } from 'express';
import { z } from 'zod';
import { TransactionService } from './transaction.service';

export class TransactionController {
  private transactionService: TransactionService;

  constructor(transactionService: TransactionService) {
    this.transactionService = transactionService;
  }

  public getTransactions = asyncHandler(async (_req: Request, res: Response): Promise<Response> => {
    const dataTransactions = await this.transactionService.getTransactions();

    return res.status(httpStatus.OK).json({
      message: 'Retrieved transactions successfully',
      transactions: dataTransactions.transactions,
    });
  });

  public getTransaction = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const transactionId = z.string().parse(req.params['id']);
    const dataTransaction = await this.transactionService.getTransaction(transactionId);

    return res.status(httpStatus.OK).json({
      message: 'Retrieved transaction successfully',
      transaction: dataTransaction.transaction,
    });
  });
}
