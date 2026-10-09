import type { CommonFarmerData } from "../types/interop";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates Common Farmer Data before transmission to external government systems.
 * Only checks fields a consent actually shares — mobile is never shared, and the mock Aadhaar
 * profile's mobile (src/services/mockAadhaar.ts) is 9 digits, so a mobile check failed every
 * real farmer's application.
 */
export function validateFarmerData(data: CommonFarmerData): ValidationResult {
  const errors: string[] = [];

  if (!data.farmerId || data.farmerId.trim() === "") {
    errors.push("Farmer ID is required.");
  }

  if (!data.name || data.name.trim() === "") {
    errors.push("Farmer Name is required.");
  }

  if (typeof data.landArea !== "number" || data.landArea <= 0) {
    errors.push("Valid land area (greater than 0 hectares) is required.");
  }

  if (!Array.isArray(data.crops) || data.crops.length === 0) {
    errors.push("At least one registered crop is required.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
