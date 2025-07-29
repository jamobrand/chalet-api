import { Router } from 'express';
import { transactionController } from './transaction.module';

const transactionRoutes = Router();

transactionRoutes.get('/all-transactions', transactionController.getTransactions);
transactionRoutes.get('/:id', transactionController.getTransaction);

export default transactionRoutes;
