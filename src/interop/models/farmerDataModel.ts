import type { CommonFarmerData } from "../../types/interop";
import type { Farmer } from "../../types/firestore";

/**
 * MOCK GOVERNMENT SYSTEM — PROTOTYPE ONLY
 * Maps external field names (e.g. from mock Farmer Registry API) to KisanQ Common Farmer Data Model.
 */

export interface RawExternalFarmerData {
  registration_number?: string;
  farmer_name?: string;
  mobile_no?: string;
  village_name?: string;
  district_name?: string;
  state_name?: string;
  land_area_hectares?: number;
  crop_list?: string[];
  [key: string]: unknown;
}

/**
 * Normalizes external field names into KisanQ's Common Farmer Data Model.
 */
export function normalizeFarmerData(raw: RawExternalFarmerData): CommonFarmerData {
  return {
    farmerId: String(raw.registration_number || raw.farmerId || "UNKNOWN"),
    name: String(raw.farmer_name || raw.name || "Farmer"),
    mobile: String(raw.mobile_no || raw.mobile || ""),
    village: String(raw.village_name || raw.village || ""),
    district: String(raw.district_name || raw.district || ""),
    state: String(raw.state_name || raw.state || ""),
    landArea: typeof raw.land_area_hectares === "number" ? raw.land_area_hectares : 2.5,
    crops: Array.isArray(raw.crop_list)
      ? raw.crop_list
      : Array.isArray(raw.crops)
      ? (raw.crops as string[])
      : ["Wheat"],
  };
}

/**
 * Converts existing KisanQ Farmer profile (from Firestore) into external registry format
 * for demonstration purposes.
 */
export function buildExternalFarmerData(
  farmer: Farmer | null,
  farmerId: string
): RawExternalFarmerData {
  return {
    registration_number: farmerId,
    farmer_name: farmer?.name || "Kisan Farmer",
    mobile_no: farmer?.mobile || "9876543210",
    village_name: farmer?.village || "Example Village",
    district_name: farmer?.district || "Example District",
    state_name: farmer?.state || "Punjab",
    land_area_hectares: 3.5, // Mock value for prototype demonstration
    crop_list: ["Wheat", "Paddy"],
  };
}
