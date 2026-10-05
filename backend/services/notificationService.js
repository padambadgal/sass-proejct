import nodemailer from 'nodemailer';
import twilio from 'twilio';
import {
  generateBookingConfirmationHTML,
  generateBookingStatusHTML,
} from '../utils/emailTemplates.js';
import { emitToBusiness } from '../config/socket.js';

// ---------- Email ----------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) console.error('Email transporter error:', error);
  else console.log('✅ Email transporter ready');
});

// ---------- Twilio ----------
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('✅ Twilio client ready');
} else {
  console.warn('⚠️  Twilio credentials missing. SMS disabled.');
}

// ---------- Helpers ----------
const sendSMS = async (to, body) => {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) return;
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body,
    });
    console.log(`✅ SMS sent to ${to}`);
  } catch (err) {
    console.error('SMS error:', err.message);
  }
};

const sendEmail = async (to, subject, html) => {
  if (!to) return;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

// ---------- Public API ----------

/**
 * On new booking created
 */
export const sendBookingConfirmation = async (booking) => {
  await booking.populate('serviceId', 'name price duration');
  await booking.populate('businessId', 'name slug');

  const email = booking.customer?.email;
  const phone = booking.customer?.phone;

  // Email
  await sendEmail(
    email,
    `Booking Confirmation: ${booking.bookingReference}`,
    generateBookingConfirmationHTML(booking)
  );

  // SMS
  if (phone) {
    await sendSMS(
      phone,
      `Hi ${booking.customer.name}, your booking ${booking.bookingReference} at ${booking.businessId?.name} on ${new Date(booking.date).toLocaleDateString()} at ${booking.startTime} is confirmed.`
    );
  }

  // Real-time alert to business owner dashboard
  try {
    emitToBusiness(booking.businessId._id.toString(), 'booking:new', {
      bookingReference: booking.bookingReference,
      customerName: booking.customer.name,
      serviceName: booking.serviceId?.name,
      date: booking.date,
      startTime: booking.startTime,
      status: booking.status,
    });
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }
};

/**
 * On status change
 */
export const sendBookingStatusUpdate = async (booking, oldStatus) => {
  await booking.populate('serviceId', 'name price duration');
  await booking.populate('businessId', 'name slug');

  const email = booking.customer?.email;
  const phone = booking.customer?.phone;

  await sendEmail(
    email,
    `Booking ${booking.bookingReference} - Status Update`,
    generateBookingStatusHTML(booking, oldStatus)
  );

  if (phone) {
    await sendSMS(
      phone,
      `Your booking ${booking.bookingReference} status changed from ${oldStatus} to ${booking.status}.`
    );
  }

  try {
    emitToBusiness(booking.businessId._id.toString(), 'booking:status', {
      bookingReference: booking.bookingReference,
      status: booking.status,
      oldStatus,
    });
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }
};