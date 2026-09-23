/**
 * Minimum Support Price (MSP) and moisture-deduction configuration — the single place any rate in
 * the app comes from. Payment for an accepted lot is always:
 *
 *   final amount = accepted weight (quintals) × MSP  −  moisture deduction
 *
 * MSP VALUES: these are the official RMS (Rabi Marketing Season) 2026-27 MSPs announced by the
 * Government of India, in ₹ per quintal. Do not edit them to "demo" numbers — MSP is a single
 * fixed government price, not a range and not a per-mandi rate.
 *
 * Crops in the app that are NOT listed in MSP_PER_QUINTAL have no verified MSP here yet
 * (paddy, bajra, jowar, makka, kapas, ganna, moong — Kharif/KMS crops — plus any commodity an
 * admin adds at runtime). For those, mspFor() returns null, the Centre Selection card shows no MSP
 * line, and the operator's Quality Check screen blocks Accept rather than guessing a price.
 * TODO: add the verified KMS 2026-27 MSPs for paddy, bajra, jowar, makka (maize), kapas (cotton)
 * and moong, and the FRP for ganna (sugarcane, which is per tonne, not per quintal).
 *
 * Kept free of any firebase import so scripts/seed.ts can compute the exact same breakdown the
 * app does.
 */

/** Official RMS 2026-27 MSP, ₹ per quintal. Keyed by commodity key (= Crop.cropType). */
export const MSP_PER_QUINTAL: Record<string, number> = {
  wheat: 2585,
  chana: 5875, // Gram (Chickpea)
  mustard: 6200, // Rapeseed & Mustard
  barley: 2150,
  masur: 7000, // Lentil (Masur)
};

/**
 * Moisture rule per crop.
 *
 * `limitPct` — the maximum moisture % accepted without a deduction.
 * `deductionPctPerPoint` — ⚠️ DEMO VALUE, not an official rate: the % of the lot's MSP value
 * deducted for every 1 percentage point of moisture above the limit. Replace with the notified
 * FCI/state value-cut schedule before any real use.
 *
 * Only wheat's limit (12%) has been provided so far. TODO: add the moisture limits for gram,
 * rapeseed & mustard, barley and lentil. Until then those crops get no moisture deduction (and
 * the farmer is told the limit is not yet set), rather than an invented limit.
 */
export interface MoistureRule {
  limitPct: number;
  /** DEMO value — see comment above. */
  deductionPctPerPoint: number;
}

export const MOISTURE_RULES: Record<string, MoistureRule> = {
  wheat: { limitPct: 12, deductionPctPerPoint: 1 /* DEMO value */ },
};

export function mspFor(cropType: string): number | null {
  return MSP_PER_QUINTAL[cropType] ?? null;
}

export function moistureRuleFor(cropType: string): MoistureRule | null {
  return MOISTURE_RULES[cropType] ?? null;
}

export interface ProcurementBreakdown {
  weightQuintals: number;
  mspPerQuintal: number;
  /** weight × MSP, rounded to the rupee. */
  grossAmount: number;
  moisturePct: number;
  /** null = no moisture limit configured for this crop (no deduction applied). */
  moistureLimitPct: number | null;
  excessMoisturePct: number;
  deductionPctPerPoint: number | null;
  deductionAmount: number;
  finalAmount: number;
  /** Canonical English statement of the rule applied — stored on the procurement record. */
  deductionRule: string;
}

/** Avoids 13.5 - 12 = 1.4999999 style float noise in stored/displayed values. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * The full payment breakdown for a lot, or null when the crop has no verified MSP (in which case
 * the lot cannot be priced and must not be accepted).
 *
 * Example: 20 quintal wheat at 12% moisture -> 20 × 2585 = ₹51,700, no deduction.
 *          20 quintal wheat at 13.5% moisture -> excess 1.5 points × 1% (DEMO) = 1.5% of ₹51,700
 *          = ₹776 deduction -> ₹50,924.
 */
export function computeBreakdown(
  cropType: string,
  weightQuintals: number,
  moisturePct: number
): ProcurementBreakdown | null {
  const msp = mspFor(cropType);
  if (msp == null) return null;
  const rule = moistureRuleFor(cropType);
  const grossAmount = Math.round(weightQuintals * msp);
  const excess = rule ? round2(Math.max(0, moisturePct - rule.limitPct)) : 0;
  const deductionAmount = rule
    ? Math.round((grossAmount * excess * rule.deductionPctPerPoint) / 100)
    : 0;
  return {
    weightQuintals,
    mspPerQuintal: msp,
    grossAmount,
    moisturePct: round2(moisturePct),
    moistureLimitPct: rule ? rule.limitPct : null,
    excessMoisturePct: excess,
    deductionPctPerPoint: rule ? rule.deductionPctPerPoint : null,
    deductionAmount,
    finalAmount: grossAmount - deductionAmount,
    deductionRule: rule
      ? `${rule.deductionPctPerPoint}% of MSP value deducted per 1% moisture above ${rule.limitPct}% (DEMO rate)`
      : "No moisture limit configured for this crop — no deduction",
  };
}

/** 51700 -> "51,700" in the Indian grouping farmers read on every receipt ("1,23,456"). */
export function formatIndianNumber(n: number): string {
  const intPart = String(Math.abs(Math.round(n)));
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
  return `${n < 0 ? "-" : ""}${grouped}`;
}

/** 51700 -> "₹51,700". */
export function formatRupees(n: number): string {
  return n < 0 ? `-₹${formatIndianNumber(-n)}` : `₹${formatIndianNumber(n)}`;
}
