import { Router } from 'express';
import { bookingController } from './booking.module';

const bookingRoutes = Router();

// Create payment token for booking
bookingRoutes.post('/create-token', bookingController.createPaymentToken);

// Verify payment and complete reservation
bookingRoutes.post('/verify', bookingController.verifyPayment);

// Get reservation status
bookingRoutes.get('/status/:bookingId', bookingController.getBookingStatus);

// Get reservation status by booking reference
bookingRoutes.get(
  '/status/reservation/reference/:reservationReference',
  bookingController.getBookingStatusByReference,
);

// DPO webhook endpoint
bookingRoutes.post('/webhook/dpo', bookingController.handleDPOWebhook);

// Payment redirect handlers
bookingRoutes.get('/success', bookingController.handlePaymentSuccess);
bookingRoutes.get('/cancel', bookingController.handlePaymentCancel);
bookingRoutes.get('/error', bookingController.handlePaymentError);

export default bookingRoutes;
