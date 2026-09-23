/**
 * Quality grades. Not specified anywhere in the docs — a small A/B/C set is a reasonable
 * stand-in for a real MSP grading scale, kept simple per "functional over pretty."
 *
 * Recorded on the procurement record at quality check. The grade does not change the price:
 * every accepted lot is paid at the crop's single official MSP (src/config/msp.ts), minus any
 * moisture deduction.
 */
export const GRADES = ["A", "B", "C"];
