/**
 * Firestore document types for the KisanQ data model.
 * Source of truth: docs/KisanQ_Master_Technical_Spec.md section 3.
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

/** identityVerification/{farmerId} — never holds the raw Aadhaar number, only a reference token. */
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

/** Label only — quantities are plain numbers, there is no conversion between the two. */
export type CommodityUnit = "quintal" | "ton";

/**
 * commodities/{commodityId} — the doc id is the commodity key, the same string used as
 * Crop.cropType, Booking.cropType and the second half of a capacity doc id.
 * `labels` is partial: bundled commodities ship all 12 languages, an admin-added one has
 * only the typed name, so rendering falls back labels[lang] -> name.
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
 * `code` builds the token prefix. `dailyCapacity` is a booking-count ceiling for the Admin
 * Drilldown's utilization % only — unrelated to CentreCropCapacity, which counts quintals.
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
 * centreCropCapacity/{centreId}_{cropType} — Daily Buying Capacity, per crop per centre.
 * Decremented by submitQualityCheck() on accept; only an admin raises it again. Opt-in: a
 * (centre, crop) pair with no doc here is not capacity-gated.
 * `gradePrices` is ₹ per Commodity.unit, typed by an admin — never derived from the grade
 * letter, and only a pre-fill for the operator, who can always override it.
 */
export interface CentreCropCapacity {
  centreId: string;
  cropType: string;
  dailyCapacityQuintals: number;
  remainingCapacityQuintals: number;
  gradePrices?: Record<string, number>;
}

/** slots/{slotId} */
export interface Slot {
  centreId: string;
  date: string; // "2026-09-13"
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
 * bookings/{bookingId} — tokenNumber is "[centre code]-[4 digits]", e.g. "KSN-1048".
 * `cropType` is denormalized from crops/{cropId} so capacity can be resolved from the booking
 * alone; optional for bookings written before the field existed.
 * Express is a capped fixed-price priority booking, not a bid — see EXPRESS_QUOTA_PER_DAY.
 */
export interface Booking {
  farmerId: string;
  centreId: string;
  slotId: string;
  cropId: string;
  cropType?: string;
  tokenNumber: string;
  status: BookingStatus;
  checkedInByStaffId?: string;
  isExpress?: boolean;
  expressFeePaid?: number;
}

export type QueueStatus = "waiting" | "processing" | "completed";

/** queue/{queueId} — the collection the farmer's Live Queue screen listens to. */
export interface QueueEntry {
  bookingId: string;
  centreId: string;
  position: number;
  status: QueueStatus;
  estimatedWaitMinutes: number;
  isExpress?: boolean;
}

export type QualityStatus = "pending" | "accepted" | "rejected";
export type ProcurementStatus =
  | "pending"
  | "weighed"
  | "quality_checked"
  | "completed"
  | "rejected";

/** procurement/{procurementId} — pricePerUnit stays null on a rejection, nothing was bought. */
export interface Procurement {
  bookingId: string;
  actualWeight: number | null;
  qualityStatus: QualityStatus;
  moisturePct: number | null;
  grade: string | null;
  pricePerUnit: number | null;
  procurementStatus: ProcurementStatus;
  rejectionReason?: string;
}

export type PaymentStatus = "processing" | "completed";

/**
 * payments/{paymentId} — simulated only, no real money moves.
 * `expectedPaymentDate` is a calendar date string, not a Timestamp, so the promised date does
 * not shift with the reader's timezone. Set once and never moved.
 */
export interface Payment {
  procurementId: string;
  amount: number;
  status: PaymentStatus;
  transactionReference: string | null;
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

export type StaffRole = "operator" | "admin";

/** staff/{staffId} — staff ID + PIN login, not Aadhaar-based. */
export interface Staff {
  name: string;
  role: StaffRole;
  pinHash: string;
  assignedCentreId: string | null; // required for operators, null for admin
}

/** tokenCounters/{centreId_date} — one doc per centre per day, incremented in a transaction. */
export interface TokenCounter {
  count: number;
}

/** queuePositionCounters/{centreId_date} — separate sequence from tokens: a no-show never gets one. */
export interface QueuePositionCounter {
  count: number;
}

/** expressSlotCounters/{centreId_date} — how many of EXPRESS_QUOTA_PER_DAY are sold. */
export interface ExpressSlotCounter {
  count: number;
}

/**
 * staffSessions/{authUid} — lets an anonymously signed-in device claim a staff identity, since
 * the mocked PIN login mints no real auth token. firestore.rules cross-check role and
 * assignedCentreId here against staff/{staffId}, which only an admin can write.
 * Known gap: a client that already knows a valid staffId can write this doc directly without
 * passing the PIN screen. Closing it needs a Cloud Function, out of scope for the prototype.
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
