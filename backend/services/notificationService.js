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
const normalizePhoneNumber = (phoneNumber) =>
  String(phoneNumber || '').replace(/\D/g, '').replace(/^00/, '');

const isSamePhoneNumber = (first, second) => {
  const firstDigits = normalizePhoneNumber(first);
  const secondDigits = normalizePhoneNumber(second);

  if (!firstDigits || !secondDigits) return false;
  if (firstDigits === secondDigits) return true;

  const hasInternationalPrefix = (phoneNumber) =>
    /^\s*(?:\+|00)/.test(String(phoneNumber || ''));
  const matchesNationalNumber = (nationalInput, internationalInput) => {
    if (
      !/^0/.test(String(nationalInput || '').trim()) ||
      !hasInternationalPrefix(internationalInput)
    ) {
      return false;
    }
    const nationalDigits = normalizePhoneNumber(nationalInput).replace(/^0+/, '');
    const internationalDigits = normalizePhoneNumber(internationalInput);
    const callingCodeLength = internationalDigits.length - nationalDigits.length;
    return (
      callingCodeLength >= 1 &&
      callingCodeLength <= 3 &&
      internationalDigits.endsWith(nationalDigits)
    );
  };

  return (
    matchesNationalNumber(first, second) ||
    matchesNationalNumber(second, first)
  );
};

const sendSMS = async (to, body) => {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!twilioClient || !from) return;
  if (!to) {
    console.warn('SMS skipped: customer phone number is missing.');
    return;
  }
  if (isSamePhoneNumber(to, from)) {
    console.warn('SMS skipped: customer phone matches the configured Twilio sender number.');
    return;
  }

  try {
    await twilioClient.messages.create({ from, to, body });
    console.log('✅ SMS sent successfully');
    console.log(`   → To:   ${to}`);
    console.log(`   → From: ${from}`);
  } catch (err) {
    console.error('SMS error:', err.message);
  }
};

// ---------- Inline HTML builder for business notification ----------
const buildBusinessNotificationHTML = (booking, business, { isStatusUpdate = false, oldStatus = null } = {}) => {
  const c = booking.customer || {};
  const svc = booking.serviceId || {};
  const dateStr = booking.date
    ? new Date(booking.date).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const row = (label, value) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#555;font-size:13px;width:160px;">${label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#111;font-size:13px;font-weight:600;">${value || '—'}</td>
    </tr>`;

  const headerTitle = isStatusUpdate ? 'Booking Status Update' : 'New Booking Received';
  const headerSubtitle = isStatusUpdate && oldStatus
    ? `${business?.name || 'Your business'} · ${oldStatus} → ${booking.status}`
    : `${business?.name || 'Your business'} · Ref ${booking.bookingReference}`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:#4f46e5;padding:20px 24px;color:#fff;">
      <h2 style="margin:0;font-size:18px;">${headerTitle}</h2>
      <p style="margin:4px 0 0;font-size:13px;opacity:.9;">${headerSubtitle}</p>
    </div>

    <div style="padding:20px 24px;">
      <h3 style="margin:0 0 10px;font-size:15px;color:#111;">Customer Details</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${row('Name', c.name)}
        ${row('Email', c.email)}
        ${row('Phone', c.phone)}
      </table>

      <h3 style="margin:0 0 10px;font-size:15px;color:#111;">Booking Details</h3>
      <table style="width:100%;border-collapse:collapse;">
        ${row('Reference', booking.bookingReference)}
        ${row('Service', svc.name)}
        ${row('Price', svc.price != null ? `₹${svc.price}` : '—')}
        ${row('Duration', svc.duration ? `${svc.duration} min` : '—')}
        ${row('Date', dateStr)}
        ${row('Time', `${booking.startTime || '—'} – ${booking.endTime || '—'}`)}
        ${row('Status', booking.status)}
        ${row('Payment', booking.paymentStatus || 'unpaid')}
        ${row('Notes', booking.notes)}
      </table>

      <p style="margin:20px 0 0;font-size:12px;color:#6b7280;">
        Reply to this email to contact the customer directly.
      </p>
    </div>

    <div style="background:#f9fafb;padding:12px 24px;font-size:11px;color:#9ca3af;text-align:center;">
      Automated booking notification · ${business?.name || ''}
    </div>
  </div>`;
};

/**
 * Send a booking notification TO the business owner.
 *
 * Header layout:
 *   To:        "Acme Salon" <owner@acmesalon.com>   ← business inbox
 *   From:      "John Doe"   <platform@gmail.com>    ← customer display name
 *   Reply-To:  john@gmail.com                        ← replies reach the customer
 */
const sendBookingDetailsToBusiness = async ({ booking, business, subject, html }) => {
  const businessName = business?.name?.trim() || 'Business';
  const businessEmail = business?.email?.trim();
  const platformEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const customerName = booking.customer?.name?.trim() || 'Customer';
  const customerEmail = booking.customer?.email?.trim();

  if (!businessEmail) {
    console.warn('⚠️  Email skipped: business email is missing.');
    return;
  }

  const toHeader = `"${businessName}" <${businessEmail}>`;

  // 🔴 From = customer's actual email (as requested)
  const fromHeader = customerEmail
    ? `"${customerName}" <${customerEmail}>`
    : `"${customerName} via ${businessName}" <${platformEmail}>`;

  const replyTo = customerEmail || platformEmail;

  console.log('📧 Preparing business notification...');
  console.log(`   → To:       ${toHeader}`);
  console.log(`   → From:     ${fromHeader}`);
  console.log(`   → Reply-To: ${replyTo}`);
  console.log(`   → Subject:  ${subject}`);

  try {
    const info = await transporter.sendMail({
      from: fromHeader,
      to: toHeader,
      replyTo,
      subject,
      html,
    });

    console.log('✅ Email sent successfully');
    console.log(`   → To:         ${toHeader}`);
    console.log(`   → From:       ${fromHeader}`);
    console.log(`   → Reply-To:   ${replyTo}`);
    console.log(`   → Message ID: ${info.messageId}`);
    console.log(`   → Response:   ${info.response}`);
  } catch (err) {
    console.error('❌ Email error:', err.message);
    console.error(`   → Failed to: ${toHeader}`);
    console.error(`   → From:      ${fromHeader}`);

    // 🔄 Fallback: if Gmail rejected the custom From, retry with platform email
    if (customerEmail) {
      console.warn('↻ Retrying with platform sender...');
      try {
        const fallbackFrom = `"${customerName}" <${platformEmail}>`;
        const info = await transporter.sendMail({
          from: fallbackFrom,
          to: toHeader,
          replyTo,
          subject,
          html,
        });
        console.log('✅ Email sent (fallback)');
        console.log(`   → To:   ${toHeader}`);
        console.log(`   → From: ${fallbackFrom}`);
        console.log(`   → Message ID: ${info.messageId}`);
      } catch (fallbackErr) {
        console.error('❌ Fallback email also failed:', fallbackErr.message);
      }
    }
  }
};

// ---------- Public API ----------

/**
 * ✅ AUTO-SEND ON BOOKING CREATION.
 *
 * Call this function immediately after `booking.save()` in your
 * createBooking controller — no need to wait for the owner to confirm
 * anything. The customer's booking triggers the email right away,
 * whatever the initial status is (`pending` or `confirmed`).
 *
 * Flow:
 *   1. Customer submits the booking form
 *   2. Controller saves the booking
 *   3. Controller calls sendBookingConfirmation(booking)  ← right away
 *   4. Business owner receives an email with full details
 *   5. Customer gets a confirmation copy + SMS
 */
export const sendBookingConfirmation = async (booking) => {
  await booking.populate('serviceId', 'name price duration');
  await booking.populate('businessId', 'name slug email');

  const business = booking.businessId;
  const isConfirmed = booking.status === 'confirmed';
  const email = booking.customer?.email;
  const phone = booking.customer?.phone;

  console.log('──────────────────────────────────────────');
  console.log(`📨 New booking — ${booking.bookingReference}`);
  console.log(`   Business (To):   ${business?.name} (${business?.email || 'no email'})`);
  console.log(`   Customer (From): ${booking.customer?.name} (${email || 'no email'})`);
  console.log(`   Status:          ${booking.status}`);
  console.log('──────────────────────────────────────────');

  // 1) Notify the BUSINESS with customer + booking details — fires immediately
  await sendBookingDetailsToBusiness({
    booking,
    business,
    subject: `New Booking from ${booking.customer?.name || 'Customer'} — ${booking.bookingReference}`,
    html: buildBusinessNotificationHTML(booking, business),
  });

  // 2) Customer-facing confirmation (from the business)
  if (email) {
    try {
      await transporter.sendMail({
        from: `"${business?.name || 'Business'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        replyTo: business?.email || process.env.EMAIL_USER,
        subject: `${isConfirmed ? 'Booking Confirmation' : 'Booking Request Received'}: ${booking.bookingReference}`,
        html: generateBookingConfirmationHTML(booking),
      });
      console.log('✅ Customer confirmation sent');
    } catch (err) {
      console.error('❌ Customer confirmation failed:', err.message);
    }
  }

  // 3) SMS to customer
  if (phone) {
    await sendSMS(
      phone,
      isConfirmed
        ? `Hi ${booking.customer.name}, your booking ${booking.bookingReference} at ${business?.name} on ${new Date(booking.date).toLocaleDateString()} at ${booking.startTime} is confirmed.`
        : `Hi ${booking.customer.name}, we received your booking request ${booking.bookingReference} at ${business?.name} for ${new Date(booking.date).toLocaleDateString()} at ${booking.startTime}. The business will confirm it shortly.`
    );
  }

  // 4) Real-time dashboard alert to the owner
  try {
    emitToBusiness(business._id.toString(), 'booking:new', {
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
 * On status change — fires only when the owner changes a booking's status
 * (confirm / complete / cancel / paid / unpaid) from the dashboard.
 */
export const sendBookingStatusUpdate = async (booking, oldStatus) => {
  await booking.populate('serviceId', 'name price duration');
  await booking.populate('businessId', 'name slug email');

  const business = booking.businessId;
  const phone = booking.customer?.phone;

  console.log('──────────────────────────────────────────');
  console.log(`📨 Status update — ${booking.bookingReference}`);
  console.log(`   ${oldStatus} → ${booking.status}`);
  console.log(`   Business (To):   ${business?.name} (${business?.email || 'no email'})`);
  console.log(`   Customer:        ${booking.customer?.name}`);
  console.log('──────────────────────────────────────────');

  await sendBookingDetailsToBusiness({
    booking,
    business,
    subject: `Booking ${booking.bookingReference} — ${oldStatus} → ${booking.status}`,
    html: buildBusinessNotificationHTML(booking, business, {
      isStatusUpdate: true,
      oldStatus,
    }),
  });

  if (phone) {
    await sendSMS(
      phone,
      `Your booking ${booking.bookingReference} status changed from ${oldStatus} to ${booking.status}.`
    );
  }

  try {
    emitToBusiness(business._id.toString(), 'booking:status', {
      bookingReference: booking.bookingReference,
      status: booking.status,
      oldStatus,
    });
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }
};