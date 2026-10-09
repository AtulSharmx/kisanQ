import { buildExternalFarmerData, normalizeFarmerData } from "../src/interop/models/farmerDataModel";
import { mockAadhaarLookup } from "../src/services/mockAadhaar";
import type { Farmer } from "../src/types/firestore";
import { validateFarmerData } from "../src/interop/validation";

console.log("=== SIH26129 RUNTIME LOGIC VERIFICATION ===");

// Test 1: Normalization
const rawData = {
  registration_number: "F99999",
  farmer_name: "Test Farmer",
  mobile_no: "9876543210",
  village_name: "Test Village",
  district_name: "Test District",
  state_name: "Punjab",
  land_area_hectares: 4.2,
  crop_list: ["Wheat", "Paddy"],
};

const normalized = normalizeFarmerData(rawData);
console.log("Normalized Data:", normalized);
if (
  normalized.farmerId === "F99999" &&
  normalized.name === "Test Farmer" &&
  normalized.landArea === 4.2
) {
  console.log("✓ Test 1 Passed: Normalization correct");
} else {
  console.error("✗ Test 1 Failed: Normalization mismatch");
}

// Test 2: Validation (Valid Data)
const valValid = validateFarmerData(normalized);
console.log("Validation Valid Data:", valValid);
if (valValid.valid && valValid.errors.length === 0) {
  console.log("✓ Test 2 Passed: Valid data passed validation");
} else {
  console.error("✗ Test 2 Failed: Valid data failed validation");
}

// Test 3: Validation (Invalid Data)
const invalidData = { ...normalized, landArea: -1, mobile: "123" };
const valInvalid = validateFarmerData(invalidData);
console.log("Validation Invalid Data:", valInvalid);
if (!valInvalid.valid && valInvalid.errors.length === 1) {
  console.log("✓ Test 3 Passed: Invalid data rejected with correct errors");
} else {
  console.error("✗ Test 3 Failed: Invalid data validation logic mismatch");
}

// Test 4: A farmer registered through the real (mock Aadhaar) flow passes validation
const registered = { ...mockAadhaarLookup("234567891234"), village: "Test Village" } as unknown as Farmer;
const valRegistered = validateFarmerData(normalizeFarmerData(buildExternalFarmerData(registered, "uid-1")));
if (valRegistered.valid) {
  console.log("✓ Test 4 Passed: Registered farmer profile passes validation");
} else {
  console.error("✗ Test 4 Failed: Registered farmer rejected:", valRegistered.errors);
}

console.log("=== ALL LOGIC CHECKS COMPLETE ===");
