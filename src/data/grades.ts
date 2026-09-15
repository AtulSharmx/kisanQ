/**
 * Quality grades. Not specified anywhere in the docs — a small A/B/C set is a reasonable
 * stand-in for a real MSP grading scale, kept simple per "functional over pretty."
 *
 * Shared between the Operator's Quality Check screen (which grade the operator awards) and the
 * Admin Drilldown's grade-price editor (what the centre pays for each grade), so the two can
 * never drift apart and leave a grade with nowhere to hang a price.
 */
export const GRADES = ["A", "B", "C"];
