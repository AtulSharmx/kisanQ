/**
 * Firestore access for the Farmer App registration -> token flow.
 * Collections/fields follow docs/KisanQ_Master_Technical_Spec.md section 3.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLLECTIONS } from "../types/firestore";
import type {
  Booking,
  Centre,
  Crop,
  Farmer,
  IdentityVerification,
  Slot,
} from "../types/firestore";

/** Average processing time per farmer, for wait estimates — see Missing Details Polish sec. 6. */
const AVERAGE_PROCESSING_MINUTES = 8;

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

export async function listSlotsForCentreToday(centreId: string): Promise<SlotWithId[]> {
  const today = new Date().toISOString().slice(0, 10);
  const q = query(
    collection(db, COLLECTIONS.slots),
    where("centreId", "==", centreId),
    where("date", "==", today),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Slot) }));
}

export async function hasAvailableSlotToday(centreId: string): Promise<boolean> {
  const slots = await listSlotsForCentreToday(centreId);
  return slots.some((s) => s.bookedCount < s.capacity);
}

export interface CreateBookingInput {
  farmerId: string;
  centreId: string;
  slotId: string;
}

export interface CreateBookingResult {
  bookingId: string;
  tokenNumber: string;
}

/**
 * Atomically: bumps the slot's bookedCount, allocates the next daily sequential token number
 * for the centre (format `[Centre code]-[4-digit sequential]`, resets daily — Missing Details
 * Polish sec. 4), and creates the bookings/{id} doc with status "booked".
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const today = new Date().toISOString().slice(0, 10);
  const centreRef = doc(db, COLLECTIONS.centres, input.centreId);
  const slotRef = doc(db, COLLECTIONS.slots, input.slotId);
  const counterRef = doc(db, COLLECTIONS.tokenCounters, `${input.centreId}_${today}`);
  const bookingRef = doc(collection(db, COLLECTIONS.bookings));

  const tokenNumber = await runTransaction(db, async (tx) => {
    const [centreSnap, slotSnap, counterSnap] = await Promise.all([
      tx.get(centreRef),
      tx.get(slotRef),
      tx.get(counterRef),
    ]);

    if (!centreSnap.exists()) throw new Error("Centre not found");
    if (!slotSnap.exists()) throw new Error("Slot not found");

    const centre = centreSnap.data() as Centre;
    const slot = slotSnap.data() as Slot;
    if (slot.bookedCount >= slot.capacity) {
      throw new Error("This slot just filled up — please pick another.");
    }

    const nextSeq = (counterSnap.exists() ? (counterSnap.data().count as number) : 0) + 1;
    const token = `${centre.code}-${String(nextSeq).padStart(4, "0")}`;

    tx.set(counterRef, { count: nextSeq });
    tx.update(slotRef, { bookedCount: slot.bookedCount + 1 });

    const booking: Booking = {
      farmerId: input.farmerId,
      centreId: input.centreId,
      slotId: input.slotId,
      tokenNumber: token,
      status: "booked",
    };
    tx.set(bookingRef, booking);

    return token;
  });

  return { bookingId: bookingRef.id, tokenNumber };
}

export interface BookingWithId extends Booking {
  id: string;
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
