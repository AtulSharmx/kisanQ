import * as Crypto from "expo-crypto";

/**
 * Staff PIN hashing (CLAUDE.md rule 8: never store or compare PINs in plaintext).
 * Plain SHA-256, no salt — good enough to keep a PIN out of plaintext in a prototype's
 * Firestore documents, not a production-grade credential store. scripts/seed.ts hashes the
 * demo PIN the same way (Node's crypto.createHash('sha256')) so seeded accounts can log in.
 */
export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin.trim());
}
