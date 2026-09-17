/**
 * All Firestore reads and writes for the app. Collections and fields follow
 * docs/KisanQ_Master_Technical_Spec.md section 3.
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
  CentreCropCapacity,
  Commodity,
  Crop,
  Farmer,
  IdentityVerification,
  Payment,
  Procurement,
  QueueEntry,
  Slot,
} from "../types/firestore";

/** Average processing time per farmer, for wait estimates (Missing Details Polish sec. 6). */
export const AVERAGE_PROCESSING_MINUTES = 8;

/**
 * Express priority booking: a capped quota at a fixed published price, never a live auction.
 * The cap is the point — without it, "pay a bit more than the last person" just recreates the
 * queue-jumping the app exists to stop.
 */
export const EXPRESS_QUOTA_PER_DAY = 2;
export const EXPRESS_PRICES = [20, 40]; // ₹, one entry per rank (1st slot cheaper than 2nd)

/**
 * Express entries first, then by arrival. Use this everywhere instead of comparing raw
 * `position` — Express never renumbers anyone, it only changes how positions compare.
 */
export function queueSortKey(e: { isExpress?: boolean; position: number }): [number, number] {
  return [e.isExpress ? 0 : 1, e.position];
}

function compareQueueSortKey(a: [number, number], b: [number, number]): number {
  return a[0] - b[0] || a[1] - b[1];
}

/** Array.sort() comparator, so the operator's queue order matches what farmers see. */
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

/** `farmerId` must be the caller's own auth uid — firestore.rules enforce that on write. */
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

// ---------------------------------------------------------------------------
// Commodity master (the runtime replacement for the compile-time crop list)
// ---------------------------------------------------------------------------

export interface CommodityWithId extends Commodity {
  id: string;
}

/**
 * Live commodity table, read through useCommodities() by every picker in the app.
 * Unfiltered on purpose: Admin Settings needs to see inactive rows to reactivate them, so
 * callers that only want sellable ones filter on `active` themselves.
 */
export function listenCommodities(
  onChange: (rows: CommodityWithId[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.commodities), (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Commodity) })));
  });
}

/**
 * Admin-only. The doc id is the commodity key, so it is normalised to a slug rather than
 * whatever was typed. merge:false is intentional — re-adding an existing key is how an admin
 * renames a commodity, not a collision.
 */
export async function upsertCommodity(input: {
  key: string;
  name: string;
  icon: string;
  unit: Commodity["unit"];
  active?: boolean;
}): Promise<string> {
  const key = commodityKeyFromName(input.key);
  if (!key) throw new Error("INVALID_COMMODITY_KEY");
  const commodity: Commodity = {
    name: input.name.trim(),
    icon: input.icon || "🌾",
    unit: input.unit,
    active: input.active ?? true,
  };
  await setDoc(doc(db, COLLECTIONS.commodities, key), commodity);
  return key;
}

/** Hides a commodity from the pickers. Deleting the row would orphan bookings using its key. */
export async function setCommodityActive(key: string, active: boolean): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.commodities, key), { active }, { merge: true });
}

/** "Kala Chana" -> "kala_chana". Doc ids can't hold "/", and capacity ids join on "_". */
export function commodityKeyFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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
 * Rough "how busy is this centre" estimate for the Centre Selection list. The exact wait
 * formula only applies once a farmer has actually checked in.
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

/** Today/tomorrow/day-after. Advance booking is capped at 3 days, same as the seed data. */
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
  /** Saves a read: the caller already has it from the crop the farmer picked. */
  cropType: string;
  /** Lets the capacity gate reject a booking that would overshoot, not just one that arrives
   *  after capacity already hit zero. Omitted = zero-check only. */
  expectedQuantity?: number;
  wantsExpress?: boolean;
}

export interface CreateBookingResult {
  bookingId: string;
  tokenNumber: string;
  isExpress: boolean;
  expressFeePaid?: number;
}

/**
 * One transaction: bump bookedCount, allocate the centre's next daily token, optionally claim
 * an Express slot, write the booking.
 *
 * The counters are keyed by the *slot's* date, not today's — with advance booking those differ,
 * and mixing them would corrupt a future day's token sequence.
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const centreRef = doc(db, COLLECTIONS.centres, input.centreId);
  const slotRef = doc(db, COLLECTIONS.slots, input.slotId);
  const bookingRef = doc(collection(db, COLLECTIONS.bookings));
  const today = new Date().toISOString().slice(0, 10);

  const capacityRef = doc(
    db,
    COLLECTIONS.centreCropCapacity,
    `${input.centreId}_${input.cropType}`
  );

  const result = await runTransaction(db, async (tx) => {
    const [centreSnap, slotSnap, capacitySnap] = await Promise.all([
      tx.get(centreRef),
      tx.get(slotRef),
      tx.get(capacityRef),
    ]);

    if (!centreSnap.exists()) throw new Error("Centre not found");
    if (!slotSnap.exists()) throw new Error("Slot not found");

    const centre = centreSnap.data() as Centre;
    const slot = slotSnap.data() as Slot;

    // Capacity gate. Opt-in (no capacity doc = not gated), today only (there is no per-day
    // tracking for future dates), and strictly per-commodity — wheat running out never blocks
    // a paddy booking. Gates new bookings only; a farmer already in the queue is left alone.
    if (capacitySnap.exists()) {
      const capacity = capacitySnap.data() as CentreCropCapacity;
      if (slot.date === today) {
        const remaining = capacity.remainingCapacityQuintals;
        // These are error codes, not user-facing text — the screen translates them. The two
        // are separate so a farmer with too big a load is told how much is left and can book a
        // smaller quantity, instead of just being told "closed".
        if (remaining <= 0) throw new Error("CENTRE_CAPACITY_FULL");
        if (input.expectedQuantity != null && input.expectedQuantity > remaining) {
          throw new Error(`CENTRE_CAPACITY_INSUFFICIENT:${remaining}`);
        }
      }
    }

    // Race: two farmers taking the last slot at once. SlotBookingScreen translates the code.
    if (slot.bookedCount >= slot.capacity) throw new Error("SLOT_FULL");

    const counterRef = doc(db, COLLECTIONS.tokenCounters, `${input.centreId}_${slot.date}`);
    const counterSnap = await tx.get(counterRef);
    const nextSeq = (counterSnap.exists() ? (counterSnap.data().count as number) : 0) + 1;
    const token = `${centre.code}-${String(nextSeq).padStart(4, "0")}`;

    // Read here, written below: Firestore wants every read before any write.
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
      if (expressCount >= EXPRESS_QUOTA_PER_DAY) throw new Error("EXPRESS_SOLD_OUT");
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
      // Denormalized so quality check can find the right capacity doc without a second read.
      cropType: input.cropType,
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
 * Only legal before check-in: once the farmer is physically standing in the queue, cancelling
 * their spot makes no sense. firestore.rules enforce the same restriction server-side.
 * The confirm prompt lives in the screen (ConfirmDialog).
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
      // Mirrors createBooking()'s +1. Not clamped at 0 — the booking existing proves the
      // count was incremented, and the security rule wants exactly bookedCount - 1.
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
 * Finds a booking by token (QR or typed), only if not yet checked in. The `centreId` filter is
 * required, not just defensive: Firestore can only secure a query when every field the rule
 * checks is also an equality filter in the query.
 * Known limitation: no date filter, so a stale token from a previous day could still match.
 * Fine for a demo that gets reseeded; a real deployment would filter on the slot's date.
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
 * Allocates the centre's next queue position, creates the queue doc and marks the booking
 * "arrived". This is the write that makes the farmer's Live Queue screen light up.
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

/** Live queue for one centre. Caller owns the returned unsubscribe. */
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
 * "Call Next": moves the entry and its booking to "processing" and notifies the farmer.
 * The spec's "[X]" counter placeholder is hardcoded to 1 — the data model has no counter
 * numbers, so a real deployment would let the operator pick theirs.
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

/** Null until the operator's weighing screen creates the doc. One per booking in practice. */
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
 * Backs the Procurement Status tracker's "Payment" tick. Reads payments/ directly rather than
 * inferring from booking.status, which flips to "completed" at quality check whether the
 * produce was accepted or rejected — which is not the same thing as paid.
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

/** Newest first. Needs the farmerId + createdAt(desc) index in firestore.indexes.json. */
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
 * Creates the booking's procurement doc and notifies the farmer. Idempotent — an operator who
 * navigates back and re-weighs reuses the same doc instead of creating a second one.
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
      pricePerUnit: null,
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
  /** Pre-filled from the centre's grade price, but always the operator's own typed number. */
  pricePerUnit: number;
  decision: "accept" | "reject";
  rejectionReason?: string;
  /** Decrements remaining capacity on Accept. The screen already has it from Weighing. */
  actualWeight: number;
}

/**
 * Days until the farmer is told to expect payment. Not a spec number — MSP procurement is
 * meant to settle within 72 hours, and printing a date at all is the point: "processing" with
 * no date is the open-ended limbo the tracker exists to replace.
 */
export const PAYMENT_SETTLEMENT_DAYS = 3;

/**
 * `from` + `days` as "YYYY-MM-DD" in local time. Not toISOString() — that goes through UTC,
 * which in IST reports yesterday for anything before 05:30.
 */
export function expectedPaymentDate(from: Date, days: number = PAYMENT_SETTLEMENT_DAYS): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * "YYYY-MM-DD" -> "DD-MM-YYYY". Numeric rather than a month name: that would be 12 more
 * translation tables, and this is the form on every Indian form already. Unparseable input is
 * returned unchanged so an old payment doc can't blank the line.
 */
export function formatPaymentDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}-${month}-${year}`;
}

export async function submitQualityCheck(input: QualityCheckInput): Promise<void> {
  const procurementRef = doc(db, COLLECTIONS.procurement, input.procurementId);
  const bookingRef = doc(db, COLLECTIONS.bookings, input.bookingId);
  const queueRef = doc(db, COLLECTIONS.queue, input.queueId);
  const notificationRef = doc(collection(db, COLLECTIONS.notifications));
  const paymentRef = doc(collection(db, COLLECTIONS.payments));
  const paymentNotificationRef = doc(collection(db, COLLECTIONS.notifications));
  const accepted = input.decision === "accept";
  const payableAmount = Math.round(input.actualWeight * input.pricePerUnit);
  // Device-side, not serverTimestamp(): the notification has to quote the same date the
  // payment doc carries, so it must exist before the write.
  const dueDate = expectedPaymentDate(new Date());

  await runTransaction(db, async (tx) => {
    // Firestore wants all reads before any write, so the capacity lookup runs first.
    let capacityRef: ReturnType<typeof doc> | undefined;
    let capacity: CentreCropCapacity | undefined;
    if (accepted) {
      const bookingSnap = await tx.get(bookingRef);
      if (!bookingSnap.exists()) throw new Error("Booking not found");
      const booking = bookingSnap.data() as Booking;
      // Older bookings predate the denormalized cropType — read the crop doc rather than
      // silently skipping their capacity decrement.
      let cropType = booking.cropType;
      if (!cropType) {
        const cropSnap = await tx.get(doc(db, COLLECTIONS.crops, booking.cropId));
        if (cropSnap.exists()) cropType = (cropSnap.data() as Crop).cropType;
      }
      if (cropType) {
        capacityRef = doc(
          db,
          COLLECTIONS.centreCropCapacity,
          `${booking.centreId}_${cropType}`
        );
        const capacitySnap = await tx.get(capacityRef);
        if (capacitySnap.exists()) capacity = capacitySnap.data() as CentreCropCapacity;
      }
    }

    tx.update(procurementRef, {
      moisturePct: input.moisturePct,
      grade: input.grade,
      // Null on reject: nothing was bought, so there is no rate.
      pricePerUnit: accepted ? input.pricePerUnit : null,
      qualityStatus: accepted ? "accepted" : "rejected",
      procurementStatus: accepted ? "completed" : "rejected",
      ...(input.rejectionReason ? { rejectionReason: input.rejectionReason } : {}),
    });
    tx.update(bookingRef, { status: "completed" });
    tx.update(queueRef, { status: "completed" });

    if (capacityRef && capacity) {
      tx.update(capacityRef, {
        remainingCapacityQuintals: capacity.remainingCapacityQuintals - input.actualWeight,
      });
    }

    if (accepted) {
      const payment: Payment = {
        procurementId: input.procurementId,
        amount: payableAmount,
        status: "processing",
        transactionReference: null,
        expectedPaymentDate: dueDate,
      };
      tx.set(paymentRef, payment);

      const paymentNotification: AppNotification = {
        farmerId: input.farmerId,
        type: "payment_processing",
        message:
          `भुगतान प्रक्रिया में: ₹${payableAmount} (${input.actualWeight} × ₹${input.pricePerUnit})। ` +
          `अपेक्षित तारीख: ${formatPaymentDate(dueDate)}।`,
        channel: "in_app",
        status: "unread",
        createdAt: serverTimestamp() as unknown as AppNotification["createdAt"],
      };
      tx.set(paymentNotificationRef, paymentNotification);
    }

    const notification: AppNotification = {
      farmerId: input.farmerId,
      type: "quality_checked",
      // Accept copy is verbatim from the docs; the reject wording isn't specified there.
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

/** Null means the pair isn't capacity-gated. One-shot: SlotBookingScreen refreshes it itself. */
export async function getCentreCropCapacity(
  centreId: string,
  cropType: string
): Promise<CentreCropCapacity | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.centreCropCapacity, `${centreId}_${cropType}`));
  return snap.exists() ? (snap.data() as CentreCropCapacity) : null;
}

/**
 * The only way a capacity doc gets created — nothing is gated until an admin calls this.
 * Overwriting an existing pair is allowed on purpose: that's how an admin resets the day.
 */
export async function addCentreCropCapacity(
  centreId: string,
  cropType: string,
  dailyCapacityQuintals: number
): Promise<void> {
  const capacity: CentreCropCapacity = {
    centreId,
    cropType,
    dailyCapacityQuintals,
    remainingCapacityQuintals: dailyCapacityQuintals,
  };
  await setDoc(doc(db, COLLECTIONS.centreCropCapacity, `${centreId}_${cropType}`), capacity);
}

/**
 * Manual top-up, e.g. head office authorising more purchase for the day. Kept separate from
 * the automatic decrement in submitQualityCheck() — raising capacity is always a decision.
 */
export async function increaseCentreCropCapacity(
  centreId: string,
  cropType: string,
  byQuintals: number
): Promise<void> {
  const capacityRef = doc(db, COLLECTIONS.centreCropCapacity, `${centreId}_${cropType}`);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(capacityRef);
    if (!snap.exists()) throw new Error("Capacity not configured for this crop yet");
    const capacity = snap.data() as CentreCropCapacity;
    tx.update(capacityRef, {
      remainingCapacityQuintals: capacity.remainingCapacityQuintals + byQuintals,
    });
  });
}

/**
 * What this centre pays per grade. Every price is typed in — "A" is worth a different number
 * of rupees in different mandis and seasons, so nothing here derives a rate from the letter.
 * Blank grades are dropped, not stored as 0: unpriced means "no rate published", not "worth
 * nothing". Merged so a price update can't clobber the capacity counter.
 */
export async function setCentreCropGradePrices(
  centreId: string,
  cropType: string,
  gradePrices: Record<string, number>
): Promise<void> {
  const cleaned: Record<string, number> = {};
  for (const [grade, price] of Object.entries(gradePrices)) {
    if (Number.isFinite(price) && price > 0) cleaned[grade] = price;
  }
  await setDoc(
    doc(db, COLLECTIONS.centreCropCapacity, `${centreId}_${cropType}`),
    { gradePrices: cleaned },
    { merge: true }
  );
}

export interface CentreCropCapacityWithId extends CentreCropCapacity {
  id: string;
}

/** Every configured (centre, crop) pair; the Admin Drilldown groups them by centre. */
export function listenCentreCropCapacities(
  onChange: (rows: CentreCropCapacityWithId[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.centreCropCapacity), (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as CentreCropCapacity) })));
  });
}

/**
 * One crop across all centres — by this screen the farmer has already picked their crop.
 * A centre missing from the map isn't capacity-gated, which is not the same as zero.
 * Returns the whole row, not just the remaining number: a farmer comparing centres wants both
 * "how much can they still buy" and "what will they pay me" from one listener.
 */
export function listenCropCapacityAcrossCentres(
  cropType: string,
  onChange: (byCentreId: Record<string, CentreCropCapacity>) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.centreCropCapacity),
    where("cropType", "==", cropType)
  );
  return onSnapshot(q, (snap) => {
    const byCentreId: Record<string, CentreCropCapacity> = {};
    snap.docs.forEach((d) => {
      const data = d.data() as CentreCropCapacity;
      byCentreId[data.centreId] = data;
    });
    onChange(byCentreId);
  });
}

// ---------------------------------------------------------------------------
// Admin: overview + district -> centre drill-down
//
// Full unfiltered collection reads, fine at demo scale and not meant to go further. Counts are
// all-time, not today's: a booking carries no date of its own (only its slot does), so scoping
// to today would mean a join per booking.
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
 * Four listeners, recomputed whenever any of them fires. Each fires once on subscribe, so
 * onChange is called a few times in quick succession before the numbers settle — simpler than
 * gating the first call on all four being ready, and not visible at this speed.
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

/** Per-centre stats for the drill-down table; the caller groups them by district. */
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
