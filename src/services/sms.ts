/**
 * SMS channel — the problem statement requires SMS as well as in-app notifications.
 *
 * No SMS gateway is integrated yet, so sendSms() only writes a "simulated" entry to the smsLog
 * collection (visible in the Admin portal's SMS Log). It is the ONLY place that knows how an SMS
 * is delivered: to go live, replace the body of sendSms() with a gateway call (e.g. MSG91 — best
 * done from a Cloud Function so the gateway API key never ships in the app) and log the gateway's
 * result instead of "simulated". No caller needs to change.
 *
 * Firestore rules allow only staff (operator/admin) to create smsLog entries and only an admin to
 * read them — every farmer notification is raised by a staff action, so that's where SMS go out.
 */
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLLECTIONS, type SmsLogEntry } from "../types/firestore";
import { maskMobile } from "../utils/maskMobile";

export { maskMobile };

export async function sendSms(
  mobile: string,
  text: string,
  bookingId: string | null = null
): Promise<void> {
  // PRODUCTION: call the SMS gateway here with the real `mobile` and `text`, then record its
  // delivery status below instead of "simulated".
  const entry: SmsLogEntry = {
    mobileMasked: maskMobile(mobile),
    text,
    bookingId,
    status: "simulated",
    createdAt: serverTimestamp() as unknown as SmsLogEntry["createdAt"],
  };
  await addDoc(collection(db, COLLECTIONS.smsLog), entry);
}
