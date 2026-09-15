/**
 * Firestore document types for every collection in the KisanQ data model.
 * Source of truth: docs/KisanQ_Master_Technical_Spec.md (section 3) and
 * docs/KisanQ_Missing_Details_Polish.md (sections 4, 6, 8).
 *
 * `Timestamp` is Firebase's server timestamp type — import from "firebase/firestore".
 */
import type { GeoPoint, Timestamp } from "firebase/firestore";

export type VerificationStatus = "pending" | "verified" | "failed";

/** farmers/{farmerId} */
export interface Farmer {
  name: string;
  mobile: string;
  verificationStatus: VerificationStatus;
  village: string;
  district: string;
  state: string;
  createdAt: Timestamp;
}

/**
 * identityVerification/{farmerId}
 * Never store the raw Aadhaar number — only a reference token from the (mocked) verification.
 */
export interface IdentityVerification {
  method: "AADHAAR" | "VOTER_ID" | "FAMILY_ID";
  status: VerificationStatus;
  referenceToken: string;
  verifiedAt: Timestamp | null;
}

/** crops/{cropId} */
export interface Crop {
  farmerId: string;
  cropType: string;
  expectedQuantity: number;
  preferredCentreId: string;
}

/**
 * The unit a commodity is bought and priced in. Everything the app computes with
 * (capacity, weights, ₹/unit) is a plain number — the unit only ever decides the *label* next
 * to it, so a mandi buying sugarcane in tonnes and wheat in quintals never needs two code
 * paths. There's deliberately no conversion factor here: a real mandi quotes MSP per quintal
 * for wheat and per tonne for cane, and converting between them would invent precision the
 * data doesn't have.
 */
export type CommodityUnit = "quintal" | "ton";

/**
 * commodities/{commodityId}
 * The runtime commodity master. The doc id *is* the commodity key — the same string that
 * lands in `Crop.cropType`, `Booking.cropType`, and the `{centreId}_{cropType}` capacity doc
 * id — so a commodity an admin adds at runtime flows through capacity, booking, validation and
 * pricing with no code change.
 *
 * `labels` is optional and partial on purpose: the ten commodities bundled in src/data/crops.ts
 * ship with all 12 languages hand-translated, but an admin adding "Soybean" from the Admin
 * Settings screen can only type one name. Rendering falls back `labels[lang] -> name`, so a
 * runtime-added commodity shows its typed name in every language rather than showing nothing.
 * See src/data/commodities.ts, which merges this collection over the bundled list (bundled ones
 * stay available even before anyone seeds this collection).
 */
export interface Commodity {
  name: string;
  icon: string;
  unit: CommodityUnit;
  labels?: Partial<Record<string, string>>;
  active: boolean;
}

export type CentreStatus = "active" | "inactive";

/**
 * centres/{centreId}
 * `code` is not listed in the Master Spec's field list but is required to build the documented
 * token format `[Centre code]-[4-digit sequential number]` (KisanQ_Missing_Details_Polish.md
 * section 4) — added here for that reason.
 *
 * `dailyCapacity` is a *booking-count* ceiling used only for the Admin Drilldown's utilization
 * %/overloaded flag — unrelated to the Daily Buying Capacity feature (see
 * CentreCropCapacity below), which tracks real-world quintals bought, per crop.
 */
export interface Centre {
  name: string;
  code: string;
  district: string;
  location: GeoPoint;
  dailyCapacity: number;
  status: CentreStatus;
}

/**
 * centreCropCapacity/{centreId}_{cropType}
 * Daily Buying Capacity, tracked per crop per centre rather than one number per centre — a
 * single mandi legitimately buys more than one crop on the same day (wheat and mustard
 * together in Rabi season, for instance), so one centre-wide ceiling couldn't tell you which
 * crop's capacity was actually the constraint. `remainingCapacityQuintals` is decremented
 * automatically, in the same transaction as the existing accept logic, by submitQualityCheck()
 * whenever a booking is Accepted (by that booking's actual weighed quantity) — never by a
 * manual per-farmer update, which wouldn't hold up at real volume. It's only ever increased by
 * an admin's deliberate action (increaseCentreCropCapacity()) — a real policy decision (head
 * office authorizing more purchase for the day), not something automatic. There's no automatic
 * day-rollover reset of this number in this prototype, matching how `slots.bookedCount` also
 * isn't auto-reset daily — it's admin-managed via scripts/seed.ts and scripts/reset.ts, same as
 * every other "today"-scoped demo number in this project.
 *
 * Opt-in, not universal: a (centre, crop) pair with no document here isn't capacity-gated at
 * all — an admin sets one up (via addCentreCropCapacity()) only for the crop(s) they're
 * actively managing capacity for. This matches CLAUDE.md's MSP scope (wheat, paddy) without
 * hard-blocking every other crop in the picker that isn't MSP-scoped.
 */
export interface CentreCropCapacity {
  centreId: string;
  cropType: string;
  dailyCapacityQuintals: number;
  remainingCapacityQuintals: number;
  /**
   * Grade -> price the centre pays for that grade, in ₹ per unit of the commodity (see
   * `Commodity.unit`). Typed in by an admin, never derived from the grade letter — the whole
   * point is that the rate is a real policy number that varies by mandi and by season, so the
   * app must not pretend to know that "A" means any particular figure.
   *
   * Optional, like the capacity doc itself: a (centre, commodity) pair with no prices set is
   * simply not publishing a rate yet, and the operator types the price free-hand at quality
   * check instead of having it pre-filled. Keyed by the same grade letters as
   * src/data/grades.ts; an unknown key is ignored rather than being an error, so changing the
   * grade scale later doesn't corrupt existing docs.
   */
  gradePrices?: Record<string, number>;
}

/** slots/{slotId} */
export interface Slot {
  centreId: string;
  date: string; // ISO date, e.g. "2026-09-13"
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  capacity: number;
  bookedCount: number;
}

export type BookingStatus =
  | "booked"
  | "arrived"
  | "processing"
  | "completed"
  | "no_show"
  | "cancelled";

/**
 * bookings/{bookingId}
 * tokenNumber format: `[Centre code]-[4-digit sequential number, resets daily]`, e.g. "KSN-1048".
 * `cropId` and `checkedInByStaffId` aren't in the Master Spec's field list — `cropId` links the
 * booking to the crops/ doc the operator needs to see at check-in (the spec's crops collection
 * has no bookingId of its own, so something has to bridge them), and `checkedInByStaffId` is an
 * audit-trail field consistent with the Winning Strategy doc's "timestamped trail" narrative.
 */
export interface Booking {
  farmerId: string;
  centreId: string;
  slotId: string;
  cropId: string;
  /**
   * The commodity this booking is for — denormalized from crops/{cropId}.cropType so that every
   * consumer that needs to know "which commodity's capacity does this booking draw down?" can
   * answer it from the booking alone. Optional only for backwards compatibility with bookings
   * created before this field existed (submitQualityCheck falls back to reading the crop doc).
   */
  cropType?: string;
  tokenNumber: string;
  status: BookingStatus;
  checkedInByStaffId?: string;
  /**
   * Express (Tatkal-style) priority booking — a fixed, transparent, capped-quota official fee
   * (never a live bid/auction — see EXPRESS_PRICES/EXPRESS_QUOTA_PER_DAY in firestoreService.ts)
   * to be processed ahead of the regular queue. `expressFeePaid` is simulated, like every other
   * payment in this app (CLAUDE.md rule 6) — no real money moves.
   */
  isExpress?: boolean;
  expressFeePaid?: number;
}

export type QueueStatus = "waiting" | "processing" | "completed";

/**
 * queue/{queueId}
 * This is the collection the farmer's Live Queue screen listens to in real time.
 * estimatedWaitMinutes = (position - 1) * average_processing_time (8 min for the demo).
 */
export interface QueueEntry {
  bookingId: string;
  centreId: string;
  position: number;
  status: QueueStatus;
  estimatedWaitMinutes: number;
  /** Copied from Booking.isExpress at check-in time — see queueSortKey() in firestoreService.ts. */
  isExpress?: boolean;
}

export type QualityStatus = "pending" | "accepted" | "rejected";
export type ProcurementStatus =
  | "pending"
  | "weighed"
  | "quality_checked"
  | "completed"
  | "rejected";

/** procurement/{procurementId} */
export interface Procurement {
  bookingId: string;
  actualWeight: number | null;
  qualityStatus: QualityStatus;
  moisturePct: number | null;
  grade: string | null;
  /**
   * ₹ per unit actually paid for this lot, typed in by the operator at quality check (pre-filled
   * from the centre's configured price for the chosen grade, but always editable — the rate is
   * never fixed by the grade letter alone). Null until quality check happens; on a rejection it
   * stays null, since nothing was bought.
   */
  pricePerUnit: number | null;
  procurementStatus: ProcurementStatus;
  rejectionReason?: string;
}

export type PaymentStatus = "processing" | "completed";

/**
 * payments/{paymentId}
 * Simulated values only — no real money movement, ever.
 */
export interface Payment {
  procurementId: string;
  amount: number;
  status: PaymentStatus;
  transactionReference: string | null;
  /**
   * The date the farmer is told to expect the money, as "YYYY-MM-DD" — set when the payment is
   * raised at quality check and never moved afterwards, so a farmer can hold the app to the date
   * it originally promised. Stored as a plain date string rather than a Timestamp because it is a
   * calendar date, not an instant: "you will be paid on the 18th" must not shift with the reader's
   * timezone. Optional only for payment docs written before this field existed.
   */
  expectedPaymentDate?: string;
}

export type NotificationType =
  | "day_before_reminder"
  | "near_slot_reminder"
  | "delay_update"
  | "call_next"
  | "weighing_recorded"
  | "quality_checked"
  | "payment_processing"
  | "payment_completed";

export type NotificationChannel = "in_app" | "sms";
export type NotificationStatus = "unread" | "read";

/** notifications/{notificationId} */
export interface AppNotification {
  farmerId: string;
  type: NotificationType;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  createdAt: Timestamp;
}

/** Staff (operator/admin) accounts — staff ID + PIN login, not Aadhaar-based. */
export type StaffRole = "operator" | "admin";

/** staff/{staffId} */
export interface Staff {
  name: string;
  role: StaffRole;
  pinHash: string;
  assignedCentreId: string | null; // required for operators, null for admin
}

/**
 * tokenCounters/{centreId_date}
 * Not in the Master Spec's collection list — added to generate the documented token format
 * `[Centre code]-[4-digit sequential number, resets daily]` atomically (one doc per centre
 * per day, incremented in a transaction).
 */
export interface TokenCounter {
  count: number;
}

/**
 * queuePositionCounters/{centreId_date}
 * Not in the Master Spec's collection list — same pattern as tokenCounters, but for the
 * queue/{queueId}.position sequence assigned at check-in (separate sequence from token
 * numbers, since a booking can go un-checked-in / no-show and never get a queue position).
 */
export interface QueuePositionCounter {
  count: number;
}

/**
 * expressSlotCounters/{centreId_date}
 * Same one-doc-per-centre-per-day counter pattern as tokenCounters/queuePositionCounters —
 * tracks how many of the fixed EXPRESS_QUOTA_PER_DAY Tatkal-style slots have been sold for a
 * centre on a given date, so createBooking()'s transaction can atomically enforce the cap
 * (see firestoreService.ts EXPRESS_PRICES / EXPRESS_QUOTA_PER_DAY).
 */
export interface ExpressSlotCounter {
  count: number;
}

/**
 * staffSessions/{authUid}
 * Not in the Master Spec's collection list. The mocked Staff ID + PIN login never mints a real
 * auth token, but firestore.rules still need *some* real request.auth to scope operator/admin
 * access. This doc lets an anonymously-signed-in device "claim" a staff identity — the rules
 * cross-check role/assignedCentreId here against the authoritative staff/{staffId} doc (which
 * only an admin can write) before trusting it, so a session can't self-declare a role a real
 * staff record doesn't have. What it can't stop is a technically-savvy client skipping the PIN
 * check UI and writing this doc directly if they already know/guess a valid staffId — closing
 * that gap for real would need a Cloud Function (or another server-side check) to verify the
 * PIN before minting the session, which is out of scope for this prototype. See
 * src/context/OperatorContext.tsx.
 */
export interface StaffSession {
  staffId: string;
  role: StaffRole;
  assignedCentreId: string | null;
}

export const COLLECTIONS = {
  farmers: "farmers",
  identityVerification: "identityVerification",
  crops: "crops",
  commodities: "commodities",
  centres: "centres",
  centreCropCapacity: "centreCropCapacity",
  slots: "slots",
  bookings: "bookings",
  queue: "queue",
  procurement: "procurement",
  payments: "payments",
  notifications: "notifications",
  tokenCounters: "tokenCounters",
  queuePositionCounters: "queuePositionCounters",
  expressSlotCounters: "expressSlotCounters",
  staff: "staff",
  staffSessions: "staffSessions",
} as const;
