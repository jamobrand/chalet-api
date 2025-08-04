import { Router } from 'express';
import { dpoController } from './dpo.module';

const dpoRoutes = Router();

// Create payment token
dpoRoutes.post('/create-token', dpoController.createToken);

// Verify payment status by transaction token
dpoRoutes.get('/verify/token/:transactionToken', dpoController.verifyToken);

// Verify payment status by company reference
dpoRoutes.get('/verify/company/ref/:companyRef', dpoController.verifyToken);

export default dpoRoutes;
