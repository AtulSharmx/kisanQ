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

export type CentreStatus = "active" | "inactive";

/**
 * centres/{centreId}
 * `code` is not listed in the Master Spec's field list but is required to build the documented
 * token format `[Centre code]-[4-digit sequential number]` (KisanQ_Missing_Details_Polish.md
 * section 4) — added here for that reason.
 */
export interface Centre {
  name: string;
  code: string;
  district: string;
  location: GeoPoint;
  dailyCapacity: number;
  status: CentreStatus;
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
  | "no_show";

/**
 * bookings/{bookingId}
 * tokenNumber format: `[Centre code]-[4-digit sequential number, resets daily]`, e.g. "KSN-1048".
 */
export interface Booking {
  farmerId: string;
  centreId: string;
  slotId: string;
  tokenNumber: string;
  status: BookingStatus;
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

export const COLLECTIONS = {
  farmers: "farmers",
  identityVerification: "identityVerification",
  crops: "crops",
  centres: "centres",
  slots: "slots",
  bookings: "bookings",
  queue: "queue",
  procurement: "procurement",
  payments: "payments",
  notifications: "notifications",
  tokenCounters: "tokenCounters",
  staff: "staff",
} as const;
