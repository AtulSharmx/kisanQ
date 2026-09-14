/**
 * Firestore access for the Farmer App registration -> token flow, the Operator
 * scan/check-in + live-queue flow, and the Farmer App's real-time Live Queue / Procurement
 * Status screens. Collections/fields follow docs/KisanQ_Master_Technical_Spec.md section 3.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLLECTIONS } from "../types/firestore";
import type {
  AppNotification,
  Booking,
  Centre,
  Crop,
  Farmer,
  IdentityVerification,
  Payment,
  Procurement,
  QueueEntry,
  Slot,
} from "../types/firestore";

/** Average processing time per farmer, for wait estimates — see Missing Details Polish sec. 6. */
export const AVERAGE_PROCESSING_MINUTES = 8;

/**
 * Express (Tatkal-style) priority booking — a fixed, transparent, officially-priced, CAPPED
 * quota, not a live auction. Modelled on IRCTC/Passport Seva Tatkal: a small fixed number of
 * slots at a fixed (escalating-per-slot) price, and once they're gone nobody can buy their way
 * in no matter how much they'd pay — the cap is what stops it from turning into "everyone just
 * pays a bit more than the last person," which is the real fairness risk with an open-ended
 * pay-to-skip model. Deliberately small numbers: this is a demonstration of the *mechanism*,
 * not a revenue feature, and the price is a symbolic official fee, not a market price.
 */
export const EXPRESS_QUOTA_PER_DAY = 2;
export const EXPRESS_PRICES = [20, 40]; // ₹, one entry per rank (1st slot cheaper than 2nd)

/** Sort key for combined queue ordering: all Express entries before all regular entries,
 * ordered by arrival (position) within each group. Used everywhere "who's ahead of whom" is
 * computed, instead of comparing raw `position` — Express deliberately does not touch or
 * renumber anyone else's position, it only changes how the existing positions are compared. */
export function queueSortKey(e: { isExpress?: boolean; position: number }): [number, number] {
  return [e.isExpress ? 0 : 1, e.position];
}

function compareQueueSortKey(a: [number, number], b: [number, number]): number {
  return a[0] - b[0] || a[1] - b[1];
}

/** Comparator for Array.sort() — Express entries first, then by position — used by the
 * Operator's Live Queue Management screen so its display order matches what farmers actually
 * see reflected in isAheadInQueue()/queueSortKey() below. */
export function compareQueueEntries(
  a: { isExpress?: boolean; position: number },
  b: { isExpress?: boolean; position: number }
): number {
  return compareQueueSortKey(queueSortKey(a), queueSortKey(b));
}

export function isAheadInQueue(
  candidate: { isExpress?: boolean; position: number },
  of: { isExpress?: boolean; position: number }
): boolean {
  return compareQueueSortKey(queueSortKey(candidate), queueSortKey(of)) < 0;
}

export interface RegisterFarmerInput {
  farmerId: string; // the signed-in Firebase Auth uid — see src/lib/firebase.ts
  name: string;
  mobile: string;
  state: string;
  district: string;
  village: string;
  referenceToken: string;
}

/**
 * Creates farmers/{farmerId} + identityVerification/{farmerId}. `farmerId` must be the
 * caller's own auth.currentUser.uid — firestore.rules enforce this on write.
 */
export async function registerFarmer(input: RegisterFarmerInput): Promise<string> {
  const farmerRef = doc(db, COLLECTIONS.farmers, input.farmerId);
  const farmer: Farmer = {
    name: input.name,
    mobile: input.mobile,
    verificationStatus: "verified",
    village: input.village,
    district: input.district,
    state: input.state,
    createdAt: serverTimestamp() as unknown as Farmer["createdAt"],
  };
  const identity: IdentityVerification = {
    method: "AADHAAR",
    status: "verified",
    referenceToken: input.referenceToken,
    verifiedAt: serverTimestamp() as unknown as NonNullable<IdentityVerification["verifiedAt"]>,
  };

  await Promise.all([
    setDoc(farmerRef, farmer),
    setDoc(doc(db, COLLECTIONS.identityVerification, farmerRef.id), identity),
  ]);

  return farmerRef.id;
}

export async function getFarmer(farmerId: string): Promise<Farmer | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.farmers, farmerId));
  return snap.exists() ? (snap.data() as Farmer) : null;
}

export interface AddCropInput {
  farmerId: string;
  cropType: string;
  expectedQuantity: number;
  preferredCentreId: string;
}

export async function addCrop(input: AddCropInput): Promise<string> {
  const cropDoc: Crop = {
    farmerId: input.farmerId,
    cropType: input.cropType,
    expectedQuantity: input.expectedQuantity,
    preferredCentreId: input.preferredCentreId,
  };
  const ref = await addDoc(collection(db, COLLECTIONS.crops), cropDoc);
  return ref.id;
}

export interface CropWithId extends Crop {
  id: string;
}

export async function listCropsForFarmer(farmerId: string): Promise<CropWithId[]> {
  const q = query(collection(db, COLLECTIONS.crops), where("farmerId", "==", farmerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Crop) }));
}

export interface CentreWithId extends Centre {
  id: string;
}

export async function getCentre(centreId: string): Promise<CentreWithId | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.centres, centreId));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Centre) } : null;
}

export async function getSlot(slotId: string): Promise<SlotWithId | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.slots, slotId));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Slot) } : null;
}

export async function getBooking(bookingId: string): Promise<BookingWithId | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.bookings, bookingId));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Booking) } : null;
}

export async function getCrop(cropId: string): Promise<CropWithId | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.crops, cropId));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Crop) } : null;
}

export async function listActiveCentres(): Promise<CentreWithId[]> {
  const q = query(collection(db, COLLECTIONS.centres), where("status", "==", "active"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Centre) }));
}

/**
 * Rough "how backed up is this centre right now" signal for the pre-booking Centre Selection
 * list. The exact live-queue-position formula (Missing Details Polish sec. 6) only applies
 * once a farmer has checked in; this is an estimate from farmers currently waiting/processing.
 */
export async function getCentreEstimatedWaitMinutes(centreId: string): Promise<number> {
  const q = query(
    collection(db, COLLECTIONS.queue),
    where("centreId", "==", centreId),
    where("status", "in", ["waiting", "processing"])
  );
  const snap = await getDocs(q);
  return snap.size * AVERAGE_PROCESSING_MINUTES;
}

export interface SlotWithId extends Slot {
  id: string;
}

/** ISO date strings for today/tomorrow/day-after — advance booking is capped at 3 days out
 * since the daily capacity model (and the demo seed data) only plans that far ahead. */
export function advanceBookingDates(): string[] {
  return [0, 1, 2].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  });
}

export async function listSlotsForCentreOnDate(
  centreId: string,
  date: string
): Promise<SlotWithId[]> {
  const q = query(
    collection(db, COLLECTIONS.slots),
    where("centreId", "==", centreId),
    where("date", "==", date),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Slot) }));
}

export async function listSlotsForCentreToday(centreId: string): Promise<SlotWithId[]> {
  return listSlotsForCentreOnDate(centreId, advanceBookingDates()[0]);
}

export async function hasAvailableSlotToday(centreId: string): Promise<boolean> {
  const slots = await listSlotsForCentreToday(centreId);
  return slots.some((s) => s.bookedCount < s.capacity);
}

/** Express availability for a centre on a given date — see EXPRESS_QUOTA_PER_DAY above. */
export async function getExpressAvailability(
  centreId: string,
  date: string
): Promise<{ available: boolean; nextRank: number; price: number }> {
  const snap = await getDoc(doc(db, COLLECTIONS.expressSlotCounters, `${centreId}_${date}`));
  const count = snap.exists() ? (snap.data().count as number) : 0;
  return {
    available: count < EXPRESS_QUOTA_PER_DAY,
    nextRank: count + 1,
    price: EXPRESS_PRICES[count] ?? EXPRESS_PRICES[EXPRESS_PRICES.length - 1],
  };
}

export interface CreateBookingInput {
  farmerId: string;
  centreId: string;
  slotId: string;
  cropId: string;
  /** Opt into an Express (Tatkal-style) slot, if one of the EXPRESS_QUOTA_PER_DAY is still
   * available for this slot's date — see getExpressAvailability(). */
  wantsExpress?: boolean;
}

export interface CreateBookingResult {
  bookingId: string;
  tokenNumber: string;
  isExpress: boolean;
  expressFeePaid?: number;
}

/**
 * Atomically: bumps the slot's bookedCount, allocates the next daily sequential token number
 * for the centre (format `[Centre code]-[4-digit sequential]`, resets daily — Missing Details
 * Polish sec. 4), optionally claims one of the day's capped Express slots, and creates the
 * bookings/{id} doc with status "booked".
 *
 * The token/Express counters are keyed by the *slot's own* date, not the date this function
 * happens to run on — advance booking (booking a future day's slot) means those can differ, and
 * getting this wrong would silently mix today's token sequence with a future day's.
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const centreRef = doc(db, COLLECTIONS.centres, input.centreId);
  const slotRef = doc(db, COLLECTIONS.slots, input.slotId);
  const bookingRef = doc(collection(db, COLLECTIONS.bookings));
  const today = new Date().toISOString().slice(0, 10);

  const result = await runTransaction(db, async (tx) => {
    const [centreSnap, slotSnap] = await Promise.all([tx.get(centreRef), tx.get(slotRef)]);

    if (!centreSnap.exists()) throw new Error("Centre not found");
    if (!slotSnap.exists()) throw new Error("Slot not found");

    const centre = centreSnap.data() as Centre;
    const slot = slotSnap.data() as Slot;

    // Daily buying-capacity gate — only for *today's* date (this centre's
    // remainingCapacityQuintals has no separate tracking for future days, so advance bookings
    // for tomorrow/day-after are never blocked by it). Only gates *new* bookings; an
    // already-confirmed booking that's mid-queue when capacity runs out is deliberately left
    // alone — see the CENTRE_CAPACITY_FULL handling in SlotBookingScreen.
    if (slot.date === today && centre.remainingCapacityQuintals <= 0) {
      // Stable error code, same pattern as SLOT_FULL/EXPRESS_SOLD_OUT below — the screen maps
      // this to a translated message rather than showing raw English.
      throw new Error("CENTRE_CAPACITY_FULL");
    }

    if (slot.bookedCount >= slot.capacity) {
      // "SLOT_FULL" is a stable error code, not user-facing text — SlotBookingScreen maps it to
      // the translated slotJustFilled string rather than displaying this message directly, so
      // this race-condition error (two farmers booking the last slot at once) doesn't show up
      // in English inside an otherwise Hindi-default screen.
      throw new Error("SLOT_FULL");
    }

    const counterRef = doc(db, COLLECTIONS.tokenCounters, `${input.centreId}_${slot.date}`);
    const counterSnap = await tx.get(counterRef);
    const nextSeq = (counterSnap.exists() ? (counterSnap.data().count as number) : 0) + 1;
    const token = `${centre.code}-${String(nextSeq).padStart(4, "0")}`;

    // Express eligibility is read here (alongside the other reads) but only *written* below,
    // once every read this transaction needs has happened — Firestore transactions require all
    // reads before any writes.
    let expressCounterRef: ReturnType<typeof doc> | undefined;
    let expressCount = 0;
    if (input.wantsExpress) {
      expressCounterRef = doc(
        db,
        COLLECTIONS.expressSlotCounters,
        `${input.centreId}_${slot.date}`
      );
      const expressSnap = await tx.get(expressCounterRef);
      expressCount = expressSnap.exists() ? (expressSnap.data().count as number) : 0;
      if (expressCount >= EXPRESS_QUOTA_PER_DAY) {
        // Stable error code, same pattern as SLOT_FULL — the screen maps this to a translated
        // "sold out" message rather than showing raw English.
        throw new Error("EXPRESS_SOLD_OUT");
      }
    }

    tx.set(counterRef, { count: nextSeq });
    tx.update(slotRef, { bookedCount: slot.bookedCount + 1 });

    let isExpress = false;
    let expressFeePaid: number | undefined;
    if (expressCounterRef) {
      tx.set(expressCounterRef, { count: expressCount + 1 });
      isExpress = true;
      expressFeePaid = EXPRESS_PRICES[expressCount] ?? EXPRESS_PRICES[EXPRESS_PRICES.length - 1];
    }

    const booking: Booking = {
      farmerId: input.farmerId,
      centreId: input.centreId,
      slotId: input.slotId,
      cropId: input.cropId,
      tokenNumber: token,
      status: "booked",
      ...(isExpress ? { isExpress, expressFeePaid } : {}),
    };
    tx.set(bookingRef, booking);

    return { token, isExpress, expressFeePaid };
  });

  return {
    bookingId: bookingRef.id,
    tokenNumber: result.token,
    isExpress: result.isExpress,
    expressFeePaid: result.expressFeePaid,
  };
}

export interface BookingWithId extends Booking {
  id: string;
}

/**
 * Farmer-initiated cancel — UI/UX design principle 9 ("confirm before anything irreversible");
 * the confirm step itself lives in the screen via ConfirmDialog. Only legal while the booking is
 * still "booked" (not yet checked in) — once an operator has scanned the farmer in, cancelling
 * their spot in a physical queue they're already standing in doesn't make sense, so this
 * intentionally does not handle that case (matches the equivalent restriction firestore.rules
 * enforces server-side, not just this check).
 */
export async function cancelBooking(bookingId: string): Promise<void> {
  const bookingRef = doc(db, COLLECTIONS.bookings, bookingId);

  await runTransaction(db, async (tx) => {
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists()) throw new Error("Booking not found");
    const booking = bookingSnap.data() as Booking;
    if (booking.status !== "booked") {
      throw new Error("Only a booking that hasn't been checked in yet can be cancelled.");
    }

    const slotRef = doc(db, COLLECTIONS.slots, booking.slotId);
    const slotSnap = await tx.get(slotRef);
    if (slotSnap.exists()) {
      const slot = slotSnap.data() as Slot;
      // Frees the slot back up for another farmer to book — mirrors createBooking()'s +1 with
      // the opposite sign, same reasoning as the firestore.rules comment on slots.bookedCount.
      // Not clamped to 0: a booking existing at all means createBooking() already incremented
      // this same slot's bookedCount at least once, so it can never be 0 here — and the rule
      // requires this write to be exactly resource.data.bookedCount - 1, not a clamped value.
      tx.update(slotRef, { bookedCount: slot.bookedCount - 1 });
    }

    tx.update(bookingRef, { status: "cancelled" });
  });
}

/** Most recent non-terminal booking for "My Token" / re-opening the token screen. */
export async function getActiveBookingForFarmer(
  farmerId: string
): Promise<BookingWithId | null> {
  const q = query(
    collection(db, COLLECTIONS.bookings),
    where("farmerId", "==", farmerId),
    where("status", "in", ["booked", "arrived", "processing"]),
    limit(5)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Booking) };
}

// ---------------------------------------------------------------------------
// Operator: scan/check-in + live queue management (Master Spec build order step 3)
// ---------------------------------------------------------------------------

/**
 * Looks up a booking by its token (QR scan or manual entry), only if it hasn't been checked in
 * yet. Scoped to the operator's own centre AND "booked" status — Firestore rules can only
 * secure a *query* (as opposed to a single-doc get) when every field the rule checks is also
 * an equality filter in the query itself, so `centreId` has to be here even though
 * `isOperatorForCentre` would also pass a per-document check. Doesn't scope by date — tokens
 * reset daily per centre, so a stale token from a previous day that was never checked in could
 * theoretically still match; low-risk for a prototype that gets reseeded per demo, but a real
 * deployment would also filter by the booking's slot date.
 */
export async function findCheckInCandidate(
  tokenNumber: string,
  centreId: string
): Promise<BookingWithId | null> {
  const q = query(
    collection(db, COLLECTIONS.bookings),
    where("centreId", "==", centreId),
    where("tokenNumber", "==", tokenNumber.trim().toUpperCase()),
    where("status", "==", "booked"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Booking) };
}

export interface CheckInResult {
  queueId: string;
  position: number;
}

/**
 * Atomically: allocates the next daily queue position for the centre, creates the queue/{id}
 * doc (status "waiting"), and moves the booking to status "arrived" — UI/UX spec Operator
 * screen 2. This is the moment that starts populating the farmer's Live Queue (wired to
 * real-time listeners in build order step 4).
 */
export async function checkInBooking(input: {
  bookingId: string;
  staffId: string;
}): Promise<CheckInResult> {
  const today = new Date().toISOString().slice(0, 10);
  const bookingRef = doc(db, COLLECTIONS.bookings, input.bookingId);
  const queueRef = doc(collection(db, COLLECTIONS.queue));

  return runTransaction(db, async (tx) => {
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists()) throw new Error("Booking not found");
    const booking = bookingSnap.data() as Booking;
    if (booking.status !== "booked") {
      throw new Error("This token has already been checked in.");
    }

    const counterRef = doc(
      db,
      COLLECTIONS.queuePositionCounters,
      `${booking.centreId}_${today}`
    );
    const counterSnap = await tx.get(counterRef);
    const nextPosition = (counterSnap.exists() ? (counterSnap.data().count as number) : 0) + 1;

    tx.set(counterRef, { count: nextPosition });
    tx.update(bookingRef, { status: "arrived", checkedInByStaffId: input.staffId });

    const queueEntry: QueueEntry = {
      bookingId: input.bookingId,
      centreId: booking.centreId,
      position: nextPosition,
      status: "waiting",
      estimatedWaitMinutes: (nextPosition - 1) * AVERAGE_PROCESSING_MINUTES,
      ...(booking.isExpress ? { isExpress: true } : {}),
    };
    tx.set(queueRef, queueEntry);

    return { queueId: queueRef.id, position: nextPosition };
  });
}

export interface QueueEntryWithId extends QueueEntry {
  id: string;
}

/**
 * Real-time listener for a centre's queue — UI/UX spec Operator screen 3 ("this screen powers
 * the farmer's Live Queue screen — most important operator screen"). Returns an unsubscribe
 * function; callers own the listener's lifecycle.
 */
export function listenQueueForCentre(
  centreId: string,
  onChange: (entries: QueueEntryWithId[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.queue),
    where("centreId", "==", centreId),
    orderBy("position", "asc")
  );
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as QueueEntry) }))),
    (err) => onError?.(err)
  );
}

/**
 * "Call Next" — Operator screen 3: moves a waiting queue entry (and its booking) to
 * "processing", and notifies the farmer with the exact copy from Missing Details Polish sec. 1.
 * The doc's "[X]" counter placeholder is fixed to "1" here since the data model doesn't track
 * physical counter numbers — a real deployment would let an operator pick/enter their counter.
 */
export async function callNextInQueue(queueId: string): Promise<void> {
  const queueRef = doc(db, COLLECTIONS.queue, queueId);
  const notificationRef = doc(collection(db, COLLECTIONS.notifications));

  await runTransaction(db, async (tx) => {
    const queueSnap = await tx.get(queueRef);
    if (!queueSnap.exists()) throw new Error("Queue entry not found");
    const queueEntry = queueSnap.data() as QueueEntry;

    const bookingRef = doc(db, COLLECTIONS.bookings, queueEntry.bookingId);
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists()) throw new Error("Booking not found");
    const booking = bookingSnap.data() as Booking;

    tx.update(queueRef, { status: "processing" });
    tx.update(bookingRef, { status: "processing" });

    const notification: AppNotification = {
      farmerId: booking.farmerId,
      type: "call_next",
      message: "काउंटर 1 पर पहुंचें — आपकी बारी आ गई है।",
      channel: "in_app",
      status: "unread",
      createdAt: serverTimestamp() as unknown as AppNotification["createdAt"],
    };
    tx.set(notificationRef, notification);
  });
}

// ---------------------------------------------------------------------------
// Farmer: Live Queue + Procurement Status, wired to real-time listeners
// (Master Spec build order step 4)
// ---------------------------------------------------------------------------

/** Real-time listener on a single booking — Procurement Status screen's "booked"/"arrived" ticks. */
export function listenBooking(
  bookingId: string,
  onChange: (booking: BookingWithId | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTIONS.bookings, bookingId),
    (snap) => onChange(snap.exists() ? { id: snap.id, ...(snap.data() as Booking) } : null),
    (err) => onError?.(err)
  );
}

export interface ProcurementWithId extends Procurement {
  id: string;
}

/**
 * Real-time listener for the procurement doc tied to a booking (0 docs until the operator's
 * weighing screen creates one). At most one procurement doc per booking in practice, so this
 * reports the first match or null.
 */
export function listenProcurementForBooking(
  bookingId: string,
  onChange: (procurement: ProcurementWithId | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.procurement),
    where("bookingId", "==", bookingId),
    limit(1)
  );
  return onSnapshot(
    q,
    (snap) =>
      onChange(
        snap.empty ? null : { id: snap.docs[0].id, ...(snap.docs[0].data() as Procurement) }
      ),
    (err) => onError?.(err)
  );
}

export interface PaymentWithId extends Payment {
  id: string;
}

/**
 * Real-time listener for the payment doc tied to a procurement (0 docs today — nothing writes
 * to payments/ yet, since payment simulation isn't part of the build order steps done so far).
 * Used for the Procurement Status tracker's "Payment" tick, so it doesn't fall back to
 * approximating payment completion from booking.status (which now flips to "completed" the
 * moment quality-check finishes, whether or not any payment happened).
 */
export function listenPaymentForProcurement(
  procurementId: string,
  onChange: (payment: PaymentWithId | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.payments),
    where("procurementId", "==", procurementId),
    limit(1)
  );
  return onSnapshot(
    q,
    (snap) =>
      onChange(snap.empty ? null : { id: snap.docs[0].id, ...(snap.docs[0].data() as Payment) }),
    (err) => onError?.(err)
  );
}

export interface NotificationWithId extends AppNotification {
  id: string;
}

/**
 * Real-time listener for a farmer's notifications, newest first — same
 * query+onSnapshot shape as listenQueueForCentre(). Matches the farmerId+createdAt(desc)
 * composite index already in firestore.indexes.json.
 */
export function listenNotifications(
  farmerId: string,
  onChange: (notifications: NotificationWithId[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.notifications),
    where("farmerId", "==", farmerId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as AppNotification) }))),
    (err) => onError?.(err)
  );
}

// ---------------------------------------------------------------------------
// Operator: weighing + quality check (Master Spec build order step 5)
// ---------------------------------------------------------------------------

export interface RecordWeighingResult {
  procurementId: string;
}

/**
 * Weighing screen (UI/UX spec Operator screen 4) — creates the procurement doc for a booking
 * (idempotent: if the operator already weighed this booking once, e.g. after navigating back,
 * the same doc is reused rather than duplicated) and notifies the farmer with the exact copy
 * from Missing Details Polish sec. 1.
 */
export async function recordWeighing(input: {
  bookingId: string;
  farmerId: string;
  actualWeight: number;
}): Promise<RecordWeighingResult> {
  const existing = await getDocs(
    query(
      collection(db, COLLECTIONS.procurement),
      where("bookingId", "==", input.bookingId),
      limit(1)
    )
  );
  const procurementRef = existing.empty
    ? doc(collection(db, COLLECTIONS.procurement))
    : existing.docs[0].ref;
  const notificationRef = doc(collection(db, COLLECTIONS.notifications));

  await runTransaction(db, async (tx) => {
    const procurement: Procurement = {
      bookingId: input.bookingId,
      actualWeight: input.actualWeight,
      qualityStatus: "pending",
      moisturePct: null,
      grade: null,
      procurementStatus: "weighed",
    };
    tx.set(procurementRef, procurement);

    const notification: AppNotification = {
      farmerId: input.farmerId,
      type: "weighing_recorded",
      message: `आपका वज़न दर्ज हुआ: ${input.actualWeight} किलो।`,
      channel: "in_app",
      status: "unread",
      createdAt: serverTimestamp() as unknown as AppNotification["createdAt"],
    };
    tx.set(notificationRef, notification);
  });

  return { procurementId: procurementRef.id };
}

export interface QualityCheckInput {
  procurementId: string;
  bookingId: string;
  queueId: string;
  farmerId: string;
  moisturePct: number;
  grade: string;
  decision: "accept" | "reject";
  rejectionReason?: string;
  /** Needed to decrement the booking's centre's remainingCapacityQuintals on Accept — already
   * known to the screen from the earlier Weighing step, so no extra document read is needed to
   * get it. */
  actualWeight: number;
}

/**
 * Quality Check screen (UI/UX spec Operator screen 5) — Accept/Reject (the confirmation prompt
 * the spec calls for happens in the UI before this is called). On reject, procurementStatus is
 * set to "rejected" and the farmer keeps their produce with no payment obligation, per Missing
 * Details Polish sec. 8. Either outcome closes out the booking/queue entry — the farmer's turn
 * at the centre is over regardless of the quality outcome.
 *
 * On Accept only, this also decrements the booking's centre's remainingCapacityQuintals by the
 * actual weighed quantity, in the same transaction — the Daily Buying Capacity feature's core
 * write. A reject doesn't touch capacity at all (nothing was bought). Not clamped at 0: the
 * last farmer of the day can legitimately push the number slightly negative (their produce was
 * already weighed and is being bought regardless) — the feature's actual constraint is on *new*
 * bookings (see createBooking()'s CENTRE_CAPACITY_FULL check), not on a farmer already this far
 * into the process.
 */
export async function submitQualityCheck(input: QualityCheckInput): Promise<void> {
  const procurementRef = doc(db, COLLECTIONS.procurement, input.procurementId);
  const bookingRef = doc(db, COLLECTIONS.bookings, input.bookingId);
  const queueRef = doc(db, COLLECTIONS.queue, input.queueId);
  const notificationRef = doc(collection(db, COLLECTIONS.notifications));
  const accepted = input.decision === "accept";

  await runTransaction(db, async (tx) => {
    // All reads (across every branch) must happen before any writes below, per Firestore
    // transaction rules — so the centre lookup, gated on `accepted`, has to run first.
    let centreRef: ReturnType<typeof doc> | undefined;
    let centre: Centre | undefined;
    if (accepted) {
      const bookingSnap = await tx.get(bookingRef);
      if (!bookingSnap.exists()) throw new Error("Booking not found");
      const booking = bookingSnap.data() as Booking;
      centreRef = doc(db, COLLECTIONS.centres, booking.centreId);
      const centreSnap = await tx.get(centreRef);
      if (centreSnap.exists()) centre = centreSnap.data() as Centre;
    }

    tx.update(procurementRef, {
      moisturePct: input.moisturePct,
      grade: input.grade,
      qualityStatus: accepted ? "accepted" : "rejected",
      procurementStatus: accepted ? "completed" : "rejected",
      ...(input.rejectionReason ? { rejectionReason: input.rejectionReason } : {}),
    });
    tx.update(bookingRef, { status: "completed" });
    tx.update(queueRef, { status: "completed" });

    if (centreRef && centre) {
      tx.update(centreRef, {
        remainingCapacityQuintals: centre.remainingCapacityQuintals - input.actualWeight,
      });
    }

    const notification: AppNotification = {
      farmerId: input.farmerId,
      type: "quality_checked",
      // Missing Details Polish sec. 1 gives the exact accept copy; a distinct reject copy
      // isn't specified there, so this is a reasonable extension, not a verbatim doc quote.
      message: accepted
        ? `गुणवत्ता जांच पूरी — ग्रेड: ${input.grade}।`
        : `गुणवत्ता जांच पूरी — अस्वीकार किया गया${input.rejectionReason ? `: ${input.rejectionReason}` : "।"}`,
      channel: "in_app",
      status: "unread",
      createdAt: serverTimestamp() as unknown as AppNotification["createdAt"],
    };
    tx.set(notificationRef, notification);
  });
}

/**
 * Admin-only manual increase to a centre's remainingCapacityQuintals — e.g. head office
 * authorizing more purchase for the day. Deliberately kept separate from the Accept-triggered
 * decrement in submitQualityCheck(): per the feature spec, this stays a manual, deliberate
 * action, never automatic. No broadcast notification on increase (see SlotBookingScreen/
 * CentreSelectionScreen instead) — the live listener on centres/ already used elsewhere in this
 * file is enough for a farmer checking the Centre Selection screen to see the new number.
 */
export async function increaseCentreCapacity(centreId: string, byQuintals: number): Promise<void> {
  const centreRef = doc(db, COLLECTIONS.centres, centreId);
  await runTransaction(db, async (tx) => {
    const centreSnap = await tx.get(centreRef);
    if (!centreSnap.exists()) throw new Error("Centre not found");
    const centre = centreSnap.data() as Centre;
    tx.update(centreRef, {
      remainingCapacityQuintals: centre.remainingCapacityQuintals + byQuintals,
    });
  });
}

/**
 * Live remainingCapacityQuintals per active centre, for the Centre Selection screen — same
 * onSnapshot-on-a-collection pattern as listenQueueForCentre()/listenAdminOverview() elsewhere
 * in this file, scoped to just this one field so a capacity change (from an Accept or an
 * admin's manual increase) shows up on the screen without the farmer needing to reload, while
 * leaving the rest of that screen's one-time distance/wait/hasSlots computation untouched.
 */
export function listenActiveCentresCapacity(
  onChange: (remainingByCentreId: Record<string, number>) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.centres), where("status", "==", "active"));
  return onSnapshot(q, (snap) => {
    const remainingByCentreId: Record<string, number> = {};
    snap.docs.forEach((d) => {
      remainingByCentreId[d.id] = (d.data() as Centre).remainingCapacityQuintals;
    });
    onChange(remainingByCentreId);
  });
}

// ---------------------------------------------------------------------------
// Admin: overview + district->centre drill-down (Master Spec build order step 6)
// Real-time via onSnapshot on each underlying collection, combined and recomputed on every
// change — an admin watching this screen now sees a booking/check-in/completion land within
// the same second it happens on the Operator side, instead of needing a manual page reload
// (a stale-dashboard gap called out in review; the aggregation logic itself is unchanged from
// the one-shot version this replaces). Still full, unfiltered collection reads — fine at demo
// scale, not meant to scale to a real deployment's data volume. `totalBookings`/
// `completedBookings` are all-time counts: a booking doc doesn't carry its own date (only its
// linked slot does), so "today's bookings" would need an extra join per booking — a reasonable
// simplification for a non-differentiator screen, not an oversight.
// ---------------------------------------------------------------------------

/** Centre is flagged "overloaded" above this booking-count-vs-dailyCapacity percentage. */
export const OVERLOAD_THRESHOLD_PCT = 80;

export interface AdminOverview {
  totalCentres: number;
  totalFarmers: number;
  totalBookings: number;
  completedBookings: number;
  currentlyWaiting: number;
  averageWaitMinutes: number;
}

/**
 * Real-time Admin Overview — combines four independent onSnapshot listeners (centres, farmers,
 * bookings, queue) and recomputes the aggregate on every change to any of them. Each listener
 * fires immediately with its current data on subscribe, so onChange typically gets called a few
 * times in quick succession as they each report in, converging on the correct numbers within a
 * fraction of a second — simpler than gating the first call on all four being ready, and no
 * worse than the one-shot version's own brief loading state.
 */
export function listenAdminOverview(
  onChange: (overview: AdminOverview) => void
): Unsubscribe {
  let totalCentres = 0;
  let totalFarmers = 0;
  let bookings: Booking[] = [];
  let queueEntries: QueueEntry[] = [];

  const recompute = () => {
    const waiting = queueEntries.filter((q) => q.status === "waiting");
    onChange({
      totalCentres,
      totalFarmers,
      totalBookings: bookings.length,
      completedBookings: bookings.filter((b) => b.status === "completed").length,
      currentlyWaiting: waiting.length,
      averageWaitMinutes: waiting.length
        ? Math.round(
            waiting.reduce((sum, q) => sum + q.estimatedWaitMinutes, 0) / waiting.length
          )
        : 0,
    });
  };

  const unsubCentres = onSnapshot(collection(db, COLLECTIONS.centres), (snap) => {
    totalCentres = snap.size;
    recompute();
  });
  const unsubFarmers = onSnapshot(collection(db, COLLECTIONS.farmers), (snap) => {
    totalFarmers = snap.size;
    recompute();
  });
  const unsubBookings = onSnapshot(collection(db, COLLECTIONS.bookings), (snap) => {
    bookings = snap.docs.map((d) => d.data() as Booking);
    recompute();
  });
  const unsubQueue = onSnapshot(collection(db, COLLECTIONS.queue), (snap) => {
    queueEntries = snap.docs.map((d) => d.data() as QueueEntry);
    recompute();
  });

  return () => {
    unsubCentres();
    unsubFarmers();
    unsubBookings();
    unsubQueue();
  };
}

export interface CentreBreakdown {
  centre: CentreWithId;
  bookings: number;
  completed: number;
  waiting: number;
  averageWaitMinutes: number;
  utilizationPct: number;
  overloaded: boolean;
}

/**
 * Real-time per-centre stats for the District -> Centre drill-down table (grouped by district
 * by the caller) — same combined-listener pattern as listenAdminOverview, over centres/
 * bookings/queue.
 */
export function listenAdminCentreBreakdown(
  onChange: (breakdown: CentreBreakdown[]) => void
): Unsubscribe {
  let centres: CentreWithId[] = [];
  let bookings: Booking[] = [];
  let queueEntries: QueueEntry[] = [];

  const recompute = () => {
    onChange(
      centres.map((centre) => {
        const centreBookings = bookings.filter((b) => b.centreId === centre.id);
        const centreWaiting = queueEntries.filter(
          (q) => q.centreId === centre.id && q.status === "waiting"
        );
        const utilizationPct =
          centre.dailyCapacity > 0
            ? Math.round((centreBookings.length / centre.dailyCapacity) * 100)
            : 0;

        return {
          centre,
          bookings: centreBookings.length,
          completed: centreBookings.filter((b) => b.status === "completed").length,
          waiting: centreWaiting.length,
          averageWaitMinutes: centreWaiting.length
            ? Math.round(
                centreWaiting.reduce((sum, q) => sum + q.estimatedWaitMinutes, 0) /
                  centreWaiting.length
              )
            : 0,
          utilizationPct,
          overloaded: utilizationPct > OVERLOAD_THRESHOLD_PCT,
        };
      })
    );
  };

  const unsubCentres = onSnapshot(collection(db, COLLECTIONS.centres), (snap) => {
    centres = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Centre) }));
    recompute();
  });
  const unsubBookings = onSnapshot(collection(db, COLLECTIONS.bookings), (snap) => {
    bookings = snap.docs.map((d) => d.data() as Booking);
    recompute();
  });
  const unsubQueue = onSnapshot(collection(db, COLLECTIONS.queue), (snap) => {
    queueEntries = snap.docs.map((d) => d.data() as QueueEntry);
    recompute();
  });

  return () => {
    unsubCentres();
    unsubBookings();
    unsubQueue();
  };
}
