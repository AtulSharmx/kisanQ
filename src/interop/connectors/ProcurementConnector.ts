import { BaseConnector } from "./baseConnector";
import { getLatestBookingForFarmer } from "../../services/firestoreService";

export interface LinkedProcurementSummary {
  hasBooking: boolean;
  tokenNumber?: string;
  centreName?: string;
  status?: string;
}

/**
 * Connector for Demonstrating Procurement Interoperability.
 * MOCK GOVERNMENT SYSTEM — PROTOTYPE ONLY
 * IMPORTANT: Does NOT replace or modify existing KisanQ procurement logic.
 */
export class ProcurementConnector extends BaseConnector {
  constructor() {
    super("Procurement System");
  }

  /**
   * Fetches linked procurement status for unified application tracking.
   * Reads existing KisanQ booking data read-only.
   */
  async getLinkedProcurementStatus(
    farmerId: string,
    correlationId: string
  ): Promise<LinkedProcurementSummary> {
    return this.callWithRetry(
      "getLinkedProcurementStatus",
      farmerId,
      correlationId,
      async () => {
        const booking = await getLatestBookingForFarmer(farmerId).catch(() => null);
        if (!booking) {
          return { hasBooking: false };
        }
        return {
          hasBooking: true,
          tokenNumber: booking.tokenNumber,
          centreName: booking.centreId,
          status: booking.status,
        };
      },
      ["farmerId", "bookingId", "status"]
    );
  }
}
