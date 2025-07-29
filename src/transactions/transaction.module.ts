// eslint-disable-next-line quotes
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

const transactionService = new TransactionService();
const transactionController = new TransactionController(transactionService);

export { transactionService, transactionController };
