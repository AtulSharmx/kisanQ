import { BaseConnector } from "./baseConnector";
import { buildExternalFarmerData, normalizeFarmerData } from "../models/farmerDataModel";
import { validateFarmerData } from "../validation";
import type { CommonFarmerData } from "../../types/interop";
import type { Farmer } from "../../types/firestore";

/**
 * Connector for Farmer Registry Government System.
 * MOCK GOVERNMENT SYSTEM — PROTOTYPE ONLY
 */
export class FarmerRegistryConnector extends BaseConnector {
  constructor() {
    super("Farmer Registry");
  }

  /**
   * Verifies farmer identity and retrieves verified information.
   * Receives the existing farmer profile from the caller (no DB call or Context edit).
   */
  async verifyAndFetchFarmer(
    farmerId: string,
    farmerProfile: Farmer | null,
    correlationId: string,
    consentId: string
  ): Promise<CommonFarmerData> {
    const dataFields = ["farmerId", "name", "village", "district", "state", "landArea", "crops"];

    return this.callWithRetry(
      "verifyAndFetchFarmer",
      farmerId,
      correlationId,
      async () => {
        // 1. Simulate network latency (300ms)
        await new Promise((resolve) => setTimeout(resolve, 300));

        // 2. Build mock external payload from authenticated farmer's data
        const externalPayload = buildExternalFarmerData(farmerProfile, farmerId);

        // 3. Normalize external field names to KisanQ Common Farmer Data Model
        const normalized = normalizeFarmerData(externalPayload);

        // 4. Validate data against model rules
        const valResult = validateFarmerData(normalized);
        if (!valResult.valid) {
          throw new Error(`Validation failed: ${valResult.errors.join(", ")}`);
        }

        return normalized;
      },
      dataFields,
      consentId
    );
  }
}
