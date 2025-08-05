import axios from 'axios';
import { Builder, parseStringPromise } from 'xml2js';
import { config } from '../config/app.config';

import {
  CreateTokenRequest,
  CreateTokenResponse,
  VerifyTokenRequest,
  VerifyTokenResponse,
} from './types/dpo.types';
import { DPOWebhookPayload } from '../booking/types/bookin.types';

export class DPOService {
  private readonly baseUrl = config.DPO_BASE_URL;
  private readonly paymentUrl = config.DPO_PAYMENT_URL;
  private readonly companyToken: string;

  constructor() {
    this.companyToken = config.DPO_COMPANY_TOKEN;
    if (!this.companyToken) {
      throw new Error('DPO_COMPANY_TOKEN is required');
    }
  }

  /**
   * Create a transaction token
   */
  async createToken(request: CreateTokenRequest): Promise<CreateTokenResponse> {
    try {
      const xmlRequest = this.buildCreateTokenXML(request);

      const response = await axios.post(this.baseUrl, xmlRequest, {
        headers: {
          'Content-Type': 'application/xml',
          Accept: 'application/xml',
        },
        timeout: 30000,
      });

      return await this.parseCreateTokenResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to create token');
    }
  }

  /**
   * Verify transaction status
   */
  async verifyToken(request: VerifyTokenRequest): Promise<VerifyTokenResponse> {
    try {
      const xmlRequest = this.buildVerifyTokenXML(request);

      const response = await axios.post(this.baseUrl, xmlRequest, {
        headers: {
          'Content-Type': 'application/xml',
          Accept: 'application/xml',
        },
        timeout: 30000,
      });

      return await this.parseVerifyTokenResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to verify token');
    }
  }

  private buildCreateTokenXML(request: CreateTokenRequest): string {
    const builder = new Builder({
      xmldec: { version: '1.0', encoding: 'utf-8' },
      renderOpts: { pretty: false },
    });

    const xmlObject = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'createToken',
        Transaction: {
          PaymentAmount: request.paymentAmount.toFixed(2),
          PaymentCurrency: request.paymentCurrency,
          CompanyRef: request.companyRef,
          CompanyRefUnique: 1,
          PTL: request.ptl || 96,
          ...(request.redirectUrl && { RedirectURL: request.redirectUrl }),
          ...(request.backUrl && { BackURL: request.backUrl }),
          customerFirstName: request.customer.firstName,
          customerLastName: request.customer.lastName,
          customerEmail: request.customer.email,
          ...(request.customer.phone && { customerPhone: request.customer.phone }),
          ...(request.customer.address && { customerAddress: request.customer.address }),
          ...(request.customer.city && { customerCity: request.customer.city }),
          ...(request.customer.country && { customerCountry: request.customer.country }),
          ...(request.customer.zip && { customerZip: request.customer.zip }),
          ...(request.defaultPayment && { DefaultPayment: request.defaultPayment }),
          ...(request.defaultPaymentCountry && {
            DefaultPaymentCountry: request.defaultPaymentCountry,
          }),
          ...(request.defaultPaymentMNO && { DefaultPaymentMNO: request.defaultPaymentMNO }),
          ...(request.transactionSource && { TransactionSource: request.transactionSource }),
          ...(request.metaData && {
            MetaData: {
              $: { 'xml:space': 'preserve' },
              _: `<![CDATA[${JSON.stringify(request.metaData)}]]>`,
            },
          }),
        },
        Services: {
          Service: request.services.map((service) => ({
            ServiceType: service.serviceType,
            ServiceDescription: service.serviceDescription,
            ServiceDate: service.serviceDate,
            ...(service.serviceFrom && { ServiceFrom: service.serviceFrom }),
            ...(service.serviceTo && { ServiceTo: service.serviceTo }),
          })),
        },
      },
    };

    return builder.buildObject(xmlObject);
  }

  private async parseCreateTokenResponse(xmlData: string): Promise<CreateTokenResponse> {
    const result = await parseStringPromise(xmlData);
    const api3g = result.API3G;

    return {
      result: api3g.r?.[0] || api3g.Result?.[0],
      resultExplanation: api3g.ResultExplanation?.[0] || '',
      transToken: api3g.TransToken?.[0],
      transRef: api3g.TransRef?.[0],
      notes: api3g.notes?.[0],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleError(error: any, message: string): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const data = error.response?.data || 'Unknown error';
      return new Error(`${message}: HTTP ${status} - ${data}`);
    }
    return new Error(`${message}: ${error.message}`);
  }

  /**
   * Generate payment URL
   */
  generatePaymentUrl(transToken: string): string {
    return `${this.paymentUrl}?ID=${transToken}`;
  }

  private buildVerifyTokenXML(request: VerifyTokenRequest): string {
    const builder = new Builder({
      xmldec: { version: '1.0', encoding: 'utf-8' },
      renderOpts: { pretty: false },
    });

    const xmlObject = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'verifyToken',
        ...(request.transactionToken && { TransactionToken: request.transactionToken }),
        ...(request.companyRef && { CompanyRef: request.companyRef }),
        VerifyTransaction: request.verifyTransaction !== false ? 1 : 0,
      },
    };

    return builder.buildObject(xmlObject);
  }

  private async parseVerifyTokenResponse(xmlData: string): Promise<VerifyTokenResponse> {
    const result = await parseStringPromise(xmlData);
    const api3g = result.API3G;

    return {
      result: api3g.r?.[0] || api3g.Result?.[0],
      resultExplanation: api3g.ResultExplanation?.[0] || '',
      customerName: api3g.CustomerName?.[0],
      customerCredit: api3g.CustomerCredit?.[0],
      customerCreditType: api3g.CustomerCreditType?.[0],
      transactionApproval: api3g.TransactionApproval?.[0],
      transactionCurrency: api3g.TransactionCurrency?.[0],
      transactionAmount: api3g.TransactionAmount?.[0]
        ? parseFloat(api3g.TransactionAmount[0])
        : undefined,
      fraudAlert: api3g.FraudAlert?.[0],
      fraudExplanation: api3g.FraudExplnation?.[0],
      transactionNetAmount: api3g.TransactionNetAmount?.[0]
        ? parseFloat(api3g.TransactionNetAmount[0])
        : undefined,
      transactionSettlementDate: api3g.TransactionSettlementDate?.[0],
      customerPhone: api3g.CustomerPhone?.[0],
      customerCountry: api3g.CustomerCountry?.[0],
      customerAddress: api3g.CustomerAddress?.[0],
      customerCity: api3g.CustomerCity?.[0],
      customerZip: api3g.CustomerZip?.[0],
      mobilePaymentRequest: api3g.MobilePaymentRequest?.[0],
      accRef: api3g.AccRef?.[0],
    };
  }

  /**
   * Validate webhook payload
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateWebhookPayload(payload: DPOWebhookPayload): boolean {
    // Check payload is not null/undefined
    if (!payload || typeof payload !== 'object') {
      console.error('Webhook payload is not a valid object');
      return false;
    }

    // Essential fields that must exist
    const requiredFields: (keyof DPOWebhookPayload)[] = ['TransToken', 'CompanyRef', 'Result'];

    for (const field of requiredFields) {
      if (!(field in payload) || !payload[field]) {
        console.error(`Missing required webhook field: ${field}`);
        return false;
      }
    }

    // For successful payments, we expect these additional fields
    if (payload.Result === '000') {
      if (!payload.TransactionAmount || payload.TransactionAmount <= 0) {
        console.error('Successful payment missing valid TransactionAmount');
        return false;
      }

      if (!payload.TransactionCurrency) {
        console.error('Successful payment missing TransactionCurrency');
        return false;
      }
    }

    return true;
  }
}
