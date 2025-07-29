import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

const customerService = new CustomerService();
const customerController = new CustomerController(customerService);

export { customerService, customerController };
