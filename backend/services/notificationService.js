import nodemailer from 'nodemailer';
import { generateBookingConfirmationHTML, generateBookingStatusHTML } from '../utils/emailTemplates.js';



// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email transporter ready');
  }
});

/**
 * Send a booking confirmation email to the customer
 */
export const sendBookingConfirmation = async (booking) => {
  try {
    // Populate necessary fields
    await booking.populate('serviceId', 'name price duration');
    await booking.populate('businessId', 'name slug');

    const customerEmail = booking.customer.email;
    if (!customerEmail) {
      console.log('No customer email, skipping notification');
      return;
    }

    const html = generateBookingConfirmationHTML(booking);
    const subject = `Booking Confirmation: ${booking.bookingReference}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject,
      html,
    });

    console.log(`✅ Confirmation email sent to ${customerEmail} for booking ${booking.bookingReference}`);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    // We don't throw error to avoid breaking the flow
  }
};

/**
 * Send a booking status update email
 */
export const sendBookingStatusUpdate = async (booking, oldStatus) => {
  try {
    await booking.populate('serviceId', 'name price duration');
    await booking.populate('businessId', 'name slug');

    const customerEmail = booking.customer.email;
    if (!customerEmail) return;

    const html = generateBookingStatusHTML(booking, oldStatus);
    const subject = `Booking ${booking.bookingReference} - Status Update`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject,
      html,
    });

    console.log(`✅ Status update email sent to ${customerEmail} for booking ${booking.bookingReference}`);
  } catch (error) {
    console.error('Error sending status update email:', error);
  }
};