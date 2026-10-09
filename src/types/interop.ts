import type { Timestamp } from "firebase/firestore";

export type ConsentStatus = "ACTIVE" | "REVOKED" | "EXPIRED" | "DENIED";

export interface Consent {
  id?: string;
  farmerId: string;
  requestingService: string;
  requestedDataFields: string[];
  purpose: string;
  status: ConsentStatus;
  createdAt: Timestamp | string;
  expiryAt: Timestamp | string;
}

export type ApplicationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DOCUMENTS_REQUIRED";

export interface InteropApplication {
  id?: string;
  farmerId: string;
  externalApplicationId: string;
  service: string;
  schemeName: string;
  status: ApplicationStatus;
  sourceSystem: string;
  consentId: string;
  correlationId: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export type AuditEventType =
  | "CONSENT_GRANTED"
  | "CONSENT_REVOKED"
  | "CONSENT_DENIED"
  | "DATA_REQUESTED"
  | "DATA_SHARED"
  | "API_REQUEST"
  | "API_RESPONSE"
  | "API_FAILURE"
  | "RETRY"
  | "APPLICATION_CREATED"
  | "STATUS_UPDATE"
  | "VALIDATION_FAILED";

export interface AuditLog {
  id?: string;
  eventType: AuditEventType;
  farmerId: string;
  requestingService: string;
  dataFields: string[];
  consentId: string | null;
  correlationId: string;
  result: "SUCCESS" | "FAILURE" | "PENDING";
  errorMessage?: string;
  timestamp: Timestamp | string;
}

export interface MockGovSchemeApplication {
  id?: string;
  externalApplicationId: string;
  farmerId: string;
  schemeName: string;
  schemeId: string;
  farmerName: string;
  farmerDistrict: string;
  landArea: number;
  crops: string[];
  status: ApplicationStatus;
  submittedAt: Timestamp | string;
  updatedAt: Timestamp | string;
  _mockLabel: "MOCK_GOVERNMENT_SYSTEM_PROTOTYPE_ONLY";
}

export interface CommonFarmerData {
  farmerId: string;
  name: string;
  mobile: string;
  village: string;
  district: string;
  state: string;
  landArea: number;
  crops: string[];
}

export const INTEROP_COLLECTIONS = {
  consents: "consents",
  interopApplications: "interopApplications",
  auditLogs: "auditLogs",
  mockGovSchemeApplications: "mockGovSchemeApplications",
} as const;
