/**
 * Calendar-date helpers, kept free of any firebase import so scripts/seed.ts and
 * scripts/reset.ts compute the exact same "today" the app does.
 *
 * Every date in this app is a *calendar date in the user's own timezone* — a slot's date, a
 * token counter's day, a payment's promised date. None of them is an instant, so none of them
 * may go through `toISOString()`, which converts to UTC first: in IST (UTC+5:30) that reports
 * the **previous day** for anything before 05:30 local time. Procurement mandis open before
 * dawn and farmers travel in exactly that window, so the bug this file exists to prevent is not
 * theoretical — it silently showed yesterday's slots under the "आज" tab, skipped the daily
 * buying-capacity gate (whose check is `slot.date === today`), and continued the previous day's
 * queue-position counter at check-in.
 *
 * Use `todayLocal()` / `localDateOffset()` for anything that will be compared against a stored
 * `date` string, and never `new Date().toISOString().slice(0, 10)`.
 */

/** A Date as "YYYY-MM-DD" in the local timezone. */
export function toLocalDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Today's calendar date, local time, as "YYYY-MM-DD". */
export function todayLocal(): string {
  return toLocalDateString(new Date());
}

/**
 * `from` plus `days` calendar days, as "YYYY-MM-DD" in local time.
 *
 * Built by constructing a new Date from the local y/m/d parts rather than mutating with
 * setDate(), so the result can't be nudged across a boundary by the time-of-day component.
 */
export function localDateOffset(days: number, from: Date = new Date()): string {
  return toLocalDateString(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days));
}
