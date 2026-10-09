import * as Crypto from "expo-crypto";

export interface InteropToken {
  farmerId: string;
  issuedAt: number;
  expiresAt: number;
  token: string;
}

const TOKEN_SECRET = "SIH26129_KISANQ_FEDERATED_IDENTITY_SECRET_PROTOTYPE";
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * MOCK GOVERNMENT SYSTEM — PROTOTYPE ONLY
 * Generates an interoperability token for federated identity demonstration.
 * Existing Firebase Anonymous Auth is completely untouched.
 */
export async function generateInteropToken(farmerId: string): Promise<InteropToken> {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + TOKEN_TTL_MS;
  const payload = `${farmerId}:${issuedAt}:${expiresAt}:${TOKEN_SECRET}`;
  
  const token = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload
  );

  return {
    farmerId,
    issuedAt,
    expiresAt,
    token,
  };
}

export function isTokenValid(tokenObj: InteropToken): boolean {
  if (!tokenObj || !tokenObj.expiresAt) return false;
  return Date.now() < tokenObj.expiresAt;
}
