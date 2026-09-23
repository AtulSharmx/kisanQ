/**
 * Farmer notification copy, in Hindi (stored as `message`, also the SMS text) and English (stored
 * as `messageEn`, shown when the app is in English). Pure functions with no firebase import, so
 * scripts/seed.ts writes demo notifications with exactly the wording the app itself produces.
 *
 * Hindi copy follows docs/KisanQ_Missing_Details_Polish.md section 1 verbatim where it exists,
 * with one deliberate change requested for the SIH26032 build: the weighing message says
 * "क्विंटल", not "किलो" — every weight in the app is in quintals, and "20 किलो" for a 20-quintal
 * lot was simply wrong.
 */
import type { PaymentStage } from "../types/firestore";
import { formatRupees, type ProcurementBreakdown } from "../config/msp";
import { formatPaymentDate } from "../utils/paymentDates";

export interface NotificationText {
  hi: string;
  en: string;
}

export function callNextText(counter = 1): NotificationText {
  return {
    hi: `काउंटर ${counter} पर पहुंचें — आपकी बारी आ गई है।`,
    en: `Please come to counter ${counter} — it's your turn.`,
  };
}

export function weighingText(weightQuintals: number): NotificationText {
  return {
    hi: `आपका वज़न दर्ज हुआ: ${weightQuintals} क्विंटल।`,
    en: `Your weight has been recorded: ${weightQuintals} quintal.`,
  };
}

function ruleText(b: ProcurementBreakdown): NotificationText {
  if (b.moistureLimitPct == null || b.deductionPctPerPoint == null) {
    return {
      hi: "इस फसल की नमी सीमा अभी तय नहीं — कोई कटौती नहीं",
      en: "moisture limit not yet set for this crop — no deduction",
    };
  }
  return {
    hi: `${b.moistureLimitPct}% से ऊपर हर 1% नमी पर MSP मूल्य का ${b.deductionPctPerPoint}% (डेमो दर)`,
    en: `${b.deductionPctPerPoint}% of MSP value per 1% moisture above ${b.moistureLimitPct}% (demo rate)`,
  };
}

/** Accepted lot: grade plus the full moisture/deduction breakdown, so the SMS alone is a receipt. */
export function qualityAcceptedText(grade: string, b: ProcurementBreakdown): NotificationText {
  const rule = ruleText(b);
  const limitHi = b.moistureLimitPct != null ? `${b.moistureLimitPct}%` : "तय नहीं";
  const limitEn = b.moistureLimitPct != null ? `${b.moistureLimitPct}%` : "not set";
  return {
    hi:
      `गुणवत्ता जांच पूरी — ग्रेड: ${grade}। ` +
      `नमी: ${b.moisturePct}% (सीमा ${limitHi}, अधिक ${b.excessMoisturePct}%)। ` +
      `${b.weightQuintals} क्विंटल × ${formatRupees(b.mspPerQuintal)} (MSP) = ${formatRupees(b.grossAmount)}। ` +
      `कटौती: ${formatRupees(b.deductionAmount)} (नियम: ${rule.hi})। ` +
      `अंतिम राशि: ${formatRupees(b.finalAmount)}।`,
    en:
      `Quality check complete — Grade: ${grade}. ` +
      `Moisture: ${b.moisturePct}% (limit ${limitEn}, excess ${b.excessMoisturePct}%). ` +
      `${b.weightQuintals} quintal × ${formatRupees(b.mspPerQuintal)} (MSP) = ${formatRupees(b.grossAmount)}. ` +
      `Deduction: ${formatRupees(b.deductionAmount)} (rule: ${rule.en}). ` +
      `Final amount: ${formatRupees(b.finalAmount)}.`,
  };
}

export function qualityRejectedText(moisturePct: number, reason?: string): NotificationText {
  return {
    hi: `गुणवत्ता जांच पूरी — अस्वीकार किया गया (नमी: ${moisturePct}%)${reason ? `: ${reason}` : "।"}`,
    en: `Quality check complete — rejected (moisture: ${moisturePct}%)${reason ? `: ${reason}` : "."}`,
  };
}

/** One message per payment stage — sent when the payment *enters* that stage. */
export function paymentStageText(
  stage: PaymentStage,
  amount: number,
  expectedDate: string | undefined,
  transactionReference?: string | null
): NotificationText {
  const amt = formatRupees(amount);
  const dateHi = expectedDate ? ` अपेक्षित तारीख: ${formatPaymentDate(expectedDate)}।` : "";
  const dateEn = expectedDate ? ` Expected date: ${formatPaymentDate(expectedDate)}.` : "";
  switch (stage) {
    case "quality_accepted":
      return {
        hi: `भुगतान प्रक्रिया में है। राशि: ${amt}।${dateHi}`,
        en: `Payment is in process. Amount: ${amt}.${dateEn}`,
      };
    case "jform_generated":
      return {
        hi: `J-फॉर्म बन गया — ${amt} का भुगतान शुरू।${dateHi}`,
        en: `J-Form generated — payment of ${amt} initiated.${dateEn}`,
      };
    case "payment_sent":
      return {
        hi: `${amt} का भुगतान आपके बैंक खाते में भेज दिया गया है।${transactionReference ? ` संदर्भ: ${transactionReference}।` : ""}`,
        en: `Payment of ${amt} has been sent to your bank account.${transactionReference ? ` Reference: ${transactionReference}.` : ""}`,
      };
    case "credited":
      return {
        hi: `भुगतान पूरा हुआ — ${amt} आपके खाते में।`,
        en: `Payment complete — ${amt} credited to your account.`,
      };
  }
}
