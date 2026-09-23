/**
 * Payment-date helpers, kept free of any firebase import so scripts/seed.ts can use the exact
 * same logic as the app. Re-exported from src/services/firestoreService.ts.
 */

/**
 * How many days after acceptance the farmer is told to expect the money.
 *
 * MSP procurement is supposed to settle within 72 hours of the purchase, so three days is the
 * honest promise to print — and printing a date at all is the point: "payment processing" with no
 * date is exactly the open-ended limbo farmers are made to live in today. A single named constant
 * so the promise is changed in one place if a state's actual settlement window differs.
 */
export const PAYMENT_SETTLEMENT_DAYS = 3;

/**
 * `from` plus `days`, as a "YYYY-MM-DD" calendar date in local time.
 *
 * Deliberately not toISOString().slice(0, 10) — that converts to UTC first, which in IST (UTC+5:30)
 * silently reports the *previous* day for anything before 05:30, so a payment accepted at 9am
 * would promise a date one day early.
 */
export function expectedPaymentDate(from: Date, days: number = PAYMENT_SETTLEMENT_DAYS): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * A "YYYY-MM-DD" date as "DD-MM-YYYY" for display — numeric rather than a month name, since the
 * app ships in 12 languages and DD-MM-YYYY is the form already printed on every Indian form a
 * farmer has filled in. Returns the input unchanged if it isn't a plain date.
 */
export function formatPaymentDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}-${month}-${year}`;
}
