/**
 * Generate HTML for booking confirmation email
 */
export const generateBookingConfirmationHTML = (booking) => {
  const businessName = booking.businessId?.name || 'Business';
  const serviceName = booking.serviceId?.name || 'Service';
  const date = new Date(booking.date).toLocaleDateString('en-IN');
  const time = booking.startTime + ' - ' + booking.endTime;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Booking Confirmation</h2>
      <p>Dear ${booking.customer.name},</p>
      <p>Your booking has been confirmed with <strong>${businessName}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Booking Reference</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingReference}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Service</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${serviceName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Time</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${time}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Status</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.status}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Payment</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.paymentStatus}</td>
        </tr>
      </table>
      <p style="margin-top: 20px;">If you have any questions, please contact the business directly.</p>
      <p>Thank you for choosing ${businessName}.</p>
    </div>
  `;
};

/**
 * Generate HTML for booking status update email
 */
export const generateBookingStatusHTML = (booking, oldStatus) => {
  const businessName = booking.businessId?.name || 'Business';
  const status = booking.status;

  let statusMessage = '';
  if (status === 'confirmed') statusMessage = 'has been confirmed by the business.';
  else if (status === 'cancelled') statusMessage = 'has been cancelled.';
  else if (status === 'completed') statusMessage = 'has been marked as completed.';
  else if (status === 'no_show') statusMessage = 'was marked as a no-show.';
  else statusMessage = `has been updated to ${status}.`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Booking Status Update</h2>
      <p>Dear ${booking.customer.name},</p>
      <p>Your booking (${booking.bookingReference}) with <strong>${businessName}</strong> ${statusMessage}</p>
      <p><strong>Old status:</strong> ${oldStatus}</p>
      <p><strong>New status:</strong> ${status}</p>
      <p>If you have any questions, please contact the business.</p>
    </div>
  `;
};