import { logInteropEvent } from "../auditService";

let correlationCounter = 1;

export function generateCorrelationId(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const seq = String(correlationCounter++).padStart(5, "0");
  return `TXN-${yyyy}${mm}${dd}-${seq}`;
}

export abstract class BaseConnector {
  protected serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Executes an external operation with retry logic (up to maxRetries attempts with backoff)
   * and logs all attempts to auditLogs.
   */
  protected async callWithRetry<T>(
    operationName: string,
    farmerId: string,
    correlationId: string,
    operation: () => Promise<T>,
    dataFields: string[] = [],
    consentId: string | null = null,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await logInteropEvent({
          eventType: attempt === 1 ? "API_REQUEST" : "RETRY",
          farmerId,
          requestingService: this.serviceName,
          dataFields,
          consentId,
          correlationId,
          result: "PENDING",
        });

        const result = await operation();

        await logInteropEvent({
          eventType: "API_RESPONSE",
          farmerId,
          requestingService: this.serviceName,
          dataFields,
          consentId,
          correlationId,
          result: "SUCCESS",
        });

        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        
        await logInteropEvent({
          eventType: attempt < maxRetries ? "RETRY" : "API_FAILURE",
          farmerId,
          requestingService: this.serviceName,
          dataFields,
          consentId,
          correlationId,
          result: "FAILURE",
          errorMessage: lastError.message,
        });

        if (attempt < maxRetries) {
          // Exponential backoff delay: 300ms, 600ms, 900ms
          await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
        }
      }
    }

    throw new Error(
      `Communication with ${this.serviceName} failed after ${maxRetries} attempts: ${lastError?.message || "Service unavailable"}`
    );
  }
}
