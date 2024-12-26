import nodemailer, { TransportOptions } from 'nodemailer';
import { logger } from '../common/utils/logger';

interface EmailOptions {
  from: string | undefined;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: { filename: string; path: string }[];
}

interface MailError extends Error {
  code?: string;
  command?: string;
  responseCode?: number;
  response?: string;
}

export default async function sendEmailTwo(emailOptions: EmailOptions): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 587,
    // secure: true,
    auth: {
      user: process.env['EMAIL_USERNAME'],
      pass: process.env['EMAIL_PASSWORD'],
    },
  } as TransportOptions);

  try {
    const testResult = await transporter.verify();
    logger.info('Result Of Transport', testResult);
  } catch (error) {
    const mailError = error as MailError;
    logger.error('Transport verification failed', {
      message: mailError.message,
      code: mailError.code,
      command: mailError.command,
    });
    throw mailError; // Re-throw to handle in the caller
  }

  try {
    await transporter.sendMail(emailOptions);
    logger.info('Email sent successfully', { recipient: emailOptions.to });
  } catch (error) {
    const mailError = error as MailError;
    logger.error('Failed to send email', {
      message: mailError.message,
      code: mailError.code,
      responseCode: mailError.responseCode,
      recipient: emailOptions.to,
    });
    throw mailError; // Re-throw to handle in the caller
  }
}
