import httpStatus from 'http-status';
import { asyncHandler } from '../common/utils/asyncHandler';
import { Request, Response } from 'express';
import { z } from 'zod';
import { CustomerService } from './customer.service';

export class CustomerController {
  private customerService: CustomerService;

  constructor(customerService: CustomerService) {
    this.customerService = customerService;
  }

  public getCustomers = asyncHandler(async (_req: Request, res: Response): Promise<Response> => {
    const dataCustomers = await this.customerService.getCustomers();

    return res.status(httpStatus.OK).json({
      message: 'Retrieved customers successfully',
      customers: dataCustomers.customers,
    });
  });

  public getCustomer = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const customerId = z.string().parse(req.params['id']);
    const dataReservation = await this.customerService.getCustomer(customerId);

    return res.status(httpStatus.OK).json({
      message: 'Retrieved customer successfully',
      customer: dataReservation.customer,
    });
  });
}
