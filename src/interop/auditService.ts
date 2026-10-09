import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { INTEROP_COLLECTIONS, type AuditEventType } from "../types/interop";

export interface LogInteropInput {
  eventType: AuditEventType;
  farmerId: string;
  requestingService: string;
  dataFields?: string[];
  consentId?: string | null;
  correlationId: string;
  result: "SUCCESS" | "FAILURE" | "PENDING";
  errorMessage?: string;
}

/**
 * Creates an immutable audit log entry in the `auditLogs/` collection.
 */
export async function logInteropEvent(input: LogInteropInput): Promise<void> {
  try {
    await addDoc(collection(db, INTEROP_COLLECTIONS.auditLogs), {
      eventType: input.eventType,
      farmerId: input.farmerId,
      requestingService: input.requestingService,
      dataFields: input.dataFields || [],
      consentId: input.consentId || null,
      correlationId: input.correlationId,
      result: input.result,
      errorMessage: input.errorMessage || null,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to write interop audit log:", err);
  }
}
