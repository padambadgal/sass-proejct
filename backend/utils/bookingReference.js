import crypto from 'crypto';

/**
 * Generate a unique booking reference
 * Format: BK-YYYYMMDD-XXXXX (e.g., BK-20260820-A7F92)
 */
export const generateBookingReference = (date) => {
  // Format date as YYYYMMDD
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Generate 5 random alphanumeric characters (uppercase)
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);

  return `BK-${dateStr}-${randomStr}`;
};