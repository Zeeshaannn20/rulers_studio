// Strategy meet: ₹99, paid through Razorpay before the Google booking page opens.
// Server-only settings (set in .env.local on your machine and in your host's env settings):
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET   — from Razorpay Dashboard → Account & Settings → API Keys
//   MEET_BOOKING_URL                        — the Google Calendar booking link (kept off the page so it opens only after payment)
export const MEET_PRICE_PAISE = 9900; // ₹99
export const meetBookingUrl = () => process.env.MEET_BOOKING_URL || "https://calendar.app.google/u3giLNoQPEix5Bi59";
export const razorpayKeys = () => {
  const id = process.env.RAZORPAY_KEY_ID || "";
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  return id && secret ? { id, secret } : null;
};
