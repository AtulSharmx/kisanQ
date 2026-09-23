/**
 * "9876543210" -> "98XXXXXX10". The SMS log never stores a full phone number. Kept free of any
 * firebase import so scripts/seed.ts masks demo numbers exactly the way sendSms() does.
 */
export function maskMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length < 4) return "XXXX";
  return `${digits.slice(0, 2)}${"X".repeat(digits.length - 4)}${digits.slice(-2)}`;
}
