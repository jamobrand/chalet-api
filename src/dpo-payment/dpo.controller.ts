import { Request, Response } from 'express';
import { DPOService } from './dpo.service';
import { CreateTokenRequest, VerifyTokenRequest, WebhookPayload } from './types/dpo.types';

export class DpoController {
  private dpoService: DPOService;

  constructor(dpoService: DPOService) {
    this.dpoService = dpoService;
  }

  /**
   * Create a new payment token
   */
  async createToken(req: Request, res: Response): Promise<void> {
    try {
      const createTokenRequest: CreateTokenRequest = req.body;

      // Validate required fields
      this.validateCreateTokenRequest(createTokenRequest);

      const response = await this.dpoService.createToken(createTokenRequest);

      if (response.result === '000') {
        const paymentUrl = this.dpoService.generatePaymentUrl(response.transToken!);

        res.status(200).json({
          success: true,
          message: 'Token created successfully',
          data: {
            transactionToken: response.transToken,
            transactionRef: response.transRef,
            paymentUrl: paymentUrl,
            result: response.result,
            resultExplanation: response.resultExplanation,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to create token',
          error: {
            code: response.result,
            explanation: response.resultExplanation,
          },
        });
      }
    } catch (error) {
      console.error('Create token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Verify payment status
   */
  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const { transactionToken, companyRef } = req.params;
      const { verifyTransaction = true } = req.query;

      if (!transactionToken && !companyRef) {
        res.status(400).json({
          success: false,
          message: 'Either transactionToken or companyRef is required',
        });
        return;
      }

      const verifyRequest: VerifyTokenRequest = {
        transactionToken,
        companyRef,
        verifyTransaction: verifyTransaction === 'true',
      };

      const response = await this.dpoService.verifyToken(verifyRequest);

      const isPaid = response.result === '000';
      const isAuthorized = response.result === '001';
      const isPending = ['003', '005', '007'].includes(response.result);

      res.status(200).json({
        success: true,
        message: 'Token verification completed',
        data: {
          status: this.getPaymentStatus(response.result),
          isPaid,
          isAuthorized,
          isPending,
          result: response.result,
          resultExplanation: response.resultExplanation,
          transactionDetails: {
            customerName: response.customerName,
            transactionAmount: response.transactionAmount,
            transactionCurrency: response.transactionCurrency,
            transactionApproval: response.transactionApproval,
            customerCreditType: response.customerCreditType,
            fraudAlert: response.fraudAlert,
            fraudExplanation: response.fraudExplanation,
            transactionNetAmount: response.transactionNetAmount,
            transactionSettlementDate: response.transactionSettlementDate,
          },
        },
      });
    } catch (error) {
      console.error('Verify token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle webhook notifications
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      console.log('Webhook received:', req.body);

      // Validate webhook payload
      const webhookPayload = this.dpoService.validateWebhookPayload(req.body);

      console.log('Validated webhook payload:', webhookPayload);
      // Process webhook (you can add your business logic here)
      await this.processWebhookPayload(webhookPayload);

      // Respond with ACK as required by DPO
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook processing error:', error);

      // Still respond with OK to prevent retries for invalid payloads
      res.status(200).send('OK');
    }
  }

  private validateCreateTokenRequest(request: CreateTokenRequest): void {
    const requiredFields = [
      'paymentAmount',
      'paymentCurrency',
      'companyRef',
      'customer',
      'services',
    ];

    for (const field of requiredFields) {
      if (!request[field as keyof CreateTokenRequest]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!request.customer.firstName || !request.customer.lastName || !request.customer.email) {
      throw new Error('Customer firstName, lastName, and email are required');
    }

    if (!request.services.length) {
      throw new Error('At least one service is required');
    }

    for (const service of request.services) {
      if (!service.serviceType || !service.serviceDescription || !service.serviceDate) {
        throw new Error('Service must include serviceType, serviceDescription, and serviceDate');
      }
    }
  }

  private getPaymentStatus(resultCode: string): string {
    const statusMap: Record<string, string> = {
      '000': 'PAID',
      '001': 'AUTHORIZED',
      '002': 'OVERPAID_UNDERPAID',
      '003': 'PENDING_BANK',
      '005': 'QUEUED_AUTHORIZATION',
      '007': 'PENDING_SPLIT_PAYMENT',
      '900': 'NOT_PAID',
      '901': 'DECLINED',
      '902': 'DATA_MISMATCH',
      '903': 'EXPIRED',
      '904': 'CANCELLED',
    };

    return statusMap[resultCode] || 'UNKNOWN';
  }

  private async processWebhookPayload(payload: WebhookPayload): Promise<void> {
    // Add your business logic here
    // For example:
    // - Update order status in database
    // - Send confirmation emails
    // - Update inventory
    // - Log transaction details

    console.log('Processing webhook payload:', {
      transactionToken: payload.TransactionToken,
      companyRef: payload.CompanyRef,
      amount: payload.TransactionAmount,
      currency: payload.TransactionCurrency,
      customerName: payload.CustomerName,
      fraudAlert: payload.FraudAlert,
    });

    // Example: You might want to verify the transaction status
    try {
      const verificationResult = await this.dpoService.verifyToken({
        transactionToken: payload.TransactionToken,
      });

      console.log('Webhook verification result:', verificationResult);
    } catch (error) {
      console.error('Failed to verify webhook transaction:', error);
    }
  }
}
