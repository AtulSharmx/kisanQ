/**
 * Mocked Aadhaar + OTP. The spec calls for this to stay mocked — never wire a real UIDAI API in
 * here. The raw number is used in memory to derive demo profile data and a referenceToken, and
 * is never persisted.
 */

export interface MockProfile {
  name: string;
  mobile: string;
  state: string;
  district: string;
  address: string;
}

const DEMO_NAMES = [
  "Ramesh Kumar",
  "Suresh Yadav",
  "Sunita Devi",
  "Mahesh Chand",
  "Kavita Rani",
  "Om Prakash",
];

const DEMO_DISTRICTS: { district: string; state: string }[] = [
  { district: "Karnal", state: "Haryana" },
  { district: "Panipat", state: "Haryana" },
  { district: "Sonipat", state: "Haryana" },
];

function digitSum(value: string): number {
  return value
    .split("")
    .reduce((sum, ch) => sum + (Number.isNaN(Number(ch)) ? 0 : Number(ch)), 0);
}

/** Deterministic per-Aadhaar mock profile, so demo runs are repeatable. */
export function mockAadhaarLookup(aadhaar: string): MockProfile {
  const sum = digitSum(aadhaar);
  const name = DEMO_NAMES[sum % DEMO_NAMES.length];
  const { state, district } = DEMO_DISTRICTS[sum % DEMO_DISTRICTS.length];
  const mobileSuffix = aadhaar.slice(-8).padStart(8, "0");
  return {
    name,
    mobile: `9${mobileSuffix}`,
    state,
    district,
    address: `${district} Road, ${district}, ${state}`,
  };
}

export const DEMO_OTP = "123456";

export function isValidAadhaar(value: string): boolean {
  return /^\d{12}$/.test(value);
}

/** referenceToken for identityVerification/{farmerId} — never the raw Aadhaar number. */
export function makeReferenceToken(aadhaar: string): string {
  const sum = digitSum(aadhaar);
  return `MOCKREF-${sum.toString(16).toUpperCase()}-${aadhaar.slice(-4)}`;
}
