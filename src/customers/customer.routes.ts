import { Router } from 'express';
import { customerController } from './customer.module';

const customerRoutes = Router();

customerRoutes.get('/all-customers', customerController.getCustomers);
customerRoutes.get('/:id', customerController.getCustomer);

export default customerRoutes;
