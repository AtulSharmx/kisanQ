import { BaseConnector } from "./baseConnector";
import { createGovernmentApplication } from "../interopFirestoreService";
import type { CommonFarmerData } from "../../types/interop";

/**
 * Connector for Government Scheme Portal.
 * MOCK GOVERNMENT SYSTEM — PROTOTYPE ONLY
 */
export class SchemeConnector extends BaseConnector {
  constructor() {
    super("Scheme Portal");
  }

  /**
   * Submits a scheme application after consent and data validation.
   */
  async submitApplication(input: {
    farmerData: CommonFarmerData;
    schemeId: string;
    schemeName: string;
    consentId: string;
    correlationId: string;
  }): Promise<{ applicationId: string; externalAppId: string }> {
    const dataFields = ["farmerId", "name", "district", "landArea", "crops", "schemeId"];

    return this.callWithRetry(
      "submitApplication",
      input.farmerData.farmerId,
      input.correlationId,
      async () => {
        // Simulate network latency (400ms)
        await new Promise((resolve) => setTimeout(resolve, 400));

        // Create persistent mock government application + KisanQ application record
        const result = await createGovernmentApplication({
          farmerId: input.farmerData.farmerId,
          schemeId: input.schemeId,
          schemeName: input.schemeName,
          farmerName: input.farmerData.name,
          farmerDistrict: input.farmerData.district,
          landArea: input.farmerData.landArea,
          crops: input.farmerData.crops,
          consentId: input.consentId,
          correlationId: input.correlationId,
        });

        return result;
      },
      dataFields,
      input.consentId
    );
  }
}
