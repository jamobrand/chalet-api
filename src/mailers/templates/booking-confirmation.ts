export const bookingConfirmationTemplate = (data: { booking: any }) => ({
    subject: 'Your GRVL Chalet Booking Confirmation',
    text: 'Thank you for booking with GRVL Chalet! Your reservation has been confirmed.',
    html: `
      <html>
        <head>
          <style>
            body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); }
            .header { background-color: #26524C; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
            .logo { color: #ffffff; font-size: 24px; font-weight: bold; }
            .booking-id { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; }
            .content { padding: 20px; }
            .details { margin: 20px 0; }
            .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .amenities { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .total { background-color: #26524C; color: white; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: right; }
            .footer { font-size: 14px; color: #999999; text-align: center; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">GRVL Chalet</div>
            </div>
            
            <div class="content">
              <h1>Booking Confirmation</h1>
              <p>Dear ${data.booking.customer.firstName},</p>
              <p>Thank you for choosing GRVL Chalet! Your reservation has been confirmed.</p>
              
              <div class="booking-id">
                <strong>Booking Reference:</strong> ${data.booking.id}
              </div>
              
              <div class="details">
                <h2>Reservation Details</h2>
                <div class="details-row">
                  <span>Check-in:</span>
                  <strong>${data.booking.checkIn.toLocaleDateString()}</strong>
                </div>
                <div class="details-row">
                  <span>Check-out:</span>
                  <strong>${data.booking.checkOut.toLocaleDateString()}</strong>
                </div>
                <div class="details-row">
                  <span>Guests:</span>
                  <strong>${data.booking.numberOfAdults} Adults, ${data.booking.numberOfChildren} Children</strong>
                </div>
              </div>
              
              <div class="total">
                <h3>Total Amount Paid</h3>
                <strong>KES ${Number(data.booking.totalAmount).toLocaleString()}</strong>
              </div>
              
              <div class="amenities">
                <h3>Important Information</h3>
                <ul>
                  <li>Check-in time: 2:00 PM</li>
                  <li>Check-out time: 11:00 AM</li>
                  <li>Please present your ID/Passport upon check-in</li>
                  <li>Free parking is available on premises</li>
                </ul>
              </div>
              
              <p>Need to modify your booking? Contact us at support@grvlchalet.com</p>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing GRVL Chalet!</p>
              <p>If you have any questions, feel free to contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `
  });