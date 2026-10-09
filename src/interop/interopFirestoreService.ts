import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  orderBy,
  limit,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  INTEROP_COLLECTIONS,
  type ApplicationStatus,
  type AuditLog,
  type Consent,
  type InteropApplication,
  type MockGovSchemeApplication,
} from "../types/interop";
import { logInteropEvent } from "./auditService";
import { schemeStatusChangedText, schemeApprovedText } from "../services/notificationText";

// ---------------------------------------------------------------------------
// CONSENTS
// ---------------------------------------------------------------------------

export async function createConsent(input: {
  farmerId: string;
  requestingService: string;
  requestedDataFields: string[];
  purpose: string;
}): Promise<string> {
  const expiryAt = new Date();
  expiryAt.setDate(expiryAt.getDate() + 30); // 30 days validity

  const docRef = await addDoc(collection(db, INTEROP_COLLECTIONS.consents), {
    farmerId: input.farmerId,
    requestingService: input.requestingService,
    requestedDataFields: input.requestedDataFields,
    purpose: input.purpose,
    status: "ACTIVE",
    createdAt: serverTimestamp(),
    expiryAt: expiryAt.toISOString(),
  });

  return docRef.id;
}

export async function revokeConsent(consentId: string, farmerId: string, correlationId: string): Promise<void> {
  const consentRef = doc(db, INTEROP_COLLECTIONS.consents, consentId);
  await updateDoc(consentRef, {
    status: "REVOKED",
  });

  await logInteropEvent({
    eventType: "CONSENT_REVOKED",
    farmerId,
    requestingService: "Scheme Portal",
    consentId,
    correlationId,
    result: "SUCCESS",
  });
}

export async function getActiveConsent(farmerId: string, requestingService: string): Promise<(Consent & { id: string }) | null> {
  const q = query(
    collection(db, INTEROP_COLLECTIONS.consents),
    where("farmerId", "==", farmerId),
    where("requestingService", "==", requestingService),
    where("status", "==", "ACTIVE")
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docData = snap.docs[0];
  return { id: docData.id, ...(docData.data() as Consent) };
}

export function listenConsentsForFarmer(
  farmerId: string,
  onChange: (consents: (Consent & { id: string })[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, INTEROP_COLLECTIONS.consents),
    where("farmerId", "==", farmerId)
  );

  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Consent) }))),
    (err) => onError?.(err)
  );
}

// ---------------------------------------------------------------------------
// INTEROP APPLICATIONS & MOCK GOV SCHEME PERSISTENCE
// ---------------------------------------------------------------------------

export async function createGovernmentApplication(input: {
  farmerId: string;
  schemeId: string;
  schemeName: string;
  farmerName: string;
  farmerDistrict: string;
  landArea: number;
  crops: string[];
  consentId: string;
  correlationId: string;
}): Promise<{ applicationId: string; externalAppId: string }> {
  const externalAppId = `APP-${Date.now()}`;

  // 1. Create persistent record in mock government database
  const mockGovRef = await addDoc(collection(db, INTEROP_COLLECTIONS.mockGovSchemeApplications), {
    externalApplicationId: externalAppId,
    farmerId: input.farmerId,
    schemeName: input.schemeName,
    schemeId: input.schemeId,
    farmerName: input.farmerName,
    farmerDistrict: input.farmerDistrict,
    landArea: input.landArea,
    crops: input.crops,
    status: "PENDING",
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    _mockLabel: "MOCK_GOVERNMENT_SYSTEM_PROTOTYPE_ONLY",
  });

  // 2. Create KisanQ-side interop tracking record — doc id is externalAppId, so the admin's
  // status sync updates it by id instead of querying (see firestore.rules)
  await setDoc(doc(db, INTEROP_COLLECTIONS.interopApplications, externalAppId), {
    farmerId: input.farmerId,
    externalApplicationId: externalAppId,
    service: "Scheme Portal",
    schemeName: input.schemeName,
    status: "PENDING",
    sourceSystem: "schemePortal",
    consentId: input.consentId,
    correlationId: input.correlationId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { applicationId: mockGovRef.id, externalAppId };
}

export function listenInteropApplicationsForFarmer(
  farmerId: string,
  onChange: (apps: (InteropApplication & { id: string })[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, INTEROP_COLLECTIONS.interopApplications),
    where("farmerId", "==", farmerId)
  );

  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as InteropApplication) }))),
    (err) => onError?.(err)
  );
}

export function listenMockGovApplications(
  onChange: (apps: (MockGovSchemeApplication & { id: string })[]) => void
): Unsubscribe {
  const q = query(
    collection(db, INTEROP_COLLECTIONS.mockGovSchemeApplications)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as MockGovSchemeApplication) }));
    onChange(list);
  });
}

/**
 * CRITICAL STATUS SYNCHRONIZATION
 * Advances status on mockGovSchemeApplications -> syncs to interopApplications -> creates notification -> logs audit event.
 */
export async function advanceMockGovApplicationStatus(
  mockDocId: string,
  externalAppId: string,
  farmerId: string,
  schemeName: string,
  currentStatus: ApplicationStatus
): Promise<ApplicationStatus> {
  const sequence: ApplicationStatus[] = ["PENDING", "UNDER_REVIEW", "APPROVED"];
  const currentIndex = sequence.indexOf(currentStatus);
  const nextStatus = sequence[currentIndex + 1] || "APPROVED";

  // 1. Update mock government application doc
  const mockRef = doc(db, INTEROP_COLLECTIONS.mockGovSchemeApplications, mockDocId);
  await updateDoc(mockRef, {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });

  // 2. Update the KisanQ interopApplication doc (its id is the externalAppId)
  await updateDoc(doc(db, INTEROP_COLLECTIONS.interopApplications, externalAppId), {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });

  // 3. Write notification to existing KisanQ `notifications/` collection
  const notifText = nextStatus === "APPROVED"
    ? schemeApprovedText(schemeName, externalAppId)
    : schemeStatusChangedText(schemeName, nextStatus);

  await addDoc(collection(db, "notifications"), {
    farmerId,
    bookingId: null,
    type: "scheme_status_changed",
    message: notifText.hi,
    messageEn: notifText.en,
    channel: "in_app",
    status: "unread",
    createdAt: serverTimestamp(),
  });

  // 4. Log audit event
  await logInteropEvent({
    eventType: "STATUS_UPDATE",
    farmerId,
    requestingService: "Scheme Portal",
    correlationId: `SYNC-${externalAppId}`,
    result: "SUCCESS",
  });

  return nextStatus;
}

// ---------------------------------------------------------------------------
// AUDIT LOG LISTENER (Admin Dashboard)
// ---------------------------------------------------------------------------

export function listenAuditLogs(
  onChange: (logs: (AuditLog & { id: string })[]) => void
): Unsubscribe {
  const q = query(
    collection(db, INTEROP_COLLECTIONS.auditLogs),
    orderBy("timestamp", "desc"),
    limit(100)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as AuditLog) }));
    onChange(list);
  });
}
