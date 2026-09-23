import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, shadow, spacing } from "../theme";
import { useLanguage } from "../context/LanguageContext";
import { unitLabel } from "../data/commodities";
import { formatRupees, type ProcurementBreakdown } from "../config/msp";
import type { Procurement } from "../types/firestore";

/**
 * The stored breakdown on a procurement record, in the same shape computeBreakdown() returns —
 * or null until the lot has been accepted and priced. The farmer's screens render *this* (the
 * record) rather than recomputing from config, so a later config change can never rewrite what
 * the farmer was told at the mandi.
 */
export function breakdownFromProcurement(p: Procurement | null): ProcurementBreakdown | null {
  if (
    !p ||
    p.actualWeight == null ||
    p.mspPerQuintal == null ||
    p.grossAmount == null ||
    p.finalAmount == null
  ) {
    return null;
  }
  return {
    weightQuintals: p.actualWeight,
    mspPerQuintal: p.mspPerQuintal,
    grossAmount: p.grossAmount,
    moisturePct: p.moisturePct ?? 0,
    moistureLimitPct: p.moistureLimitPct,
    excessMoisturePct: p.excessMoisturePct ?? 0,
    deductionPctPerPoint: p.deductionPctPerPoint,
    deductionAmount: p.deductionAmount ?? 0,
    finalAmount: p.finalAmount,
    deductionRule: p.deductionRule ?? "",
  };
}

/**
 * Line-by-line payment arithmetic — weight × MSP, moisture found vs allowed limit, excess, the
 * deduction and the rule it came from, and the final amount. Shared by the operator's Quality
 * Check screen (live, before Accept) and the farmer's Procurement Status / Payment screens (from
 * the stored record), so both sides of the counter see the identical sum. This is the
 * transparency pitch in one card: every rupee cut is shown with the reason.
 */
export function PaymentBreakdown({ breakdown }: { breakdown: ProcurementBreakdown }) {
  const { t, lang } = useLanguage();
  const quintal = unitLabel("quintal", lang);
  const b = breakdown;
  const hasRule = b.moistureLimitPct != null && b.deductionPctPerPoint != null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🧾 {t("breakdownTitle")}</Text>
      <Row label={`⚖️ ${t("breakdownWeight")}`} value={`${b.weightQuintals} ${quintal}`} />
      <Row label={`🏛️ ${t("breakdownMsp")}`} value={`${formatRupees(b.mspPerQuintal)}/${quintal}`} />
      <Row label={t("breakdownGross")} value={formatRupees(b.grossAmount)} />
      <View style={styles.divider} />
      <Row label={`💧 ${t("breakdownMoistureFound")}`} value={`${b.moisturePct}%`} />
      <Row
        label={t("breakdownMoistureLimit")}
        value={b.moistureLimitPct != null ? `${b.moistureLimitPct}%` : t("breakdownNotSet")}
      />
      <Row label={t("breakdownExcess")} value={`${b.excessMoisturePct}%`} />
      <Row
        label={`➖ ${t("breakdownDeduction")}`}
        value={`− ${formatRupees(b.deductionAmount)}`}
      />
      <Text style={styles.rule}>
        {hasRule
          ? t("breakdownRule")
              .replace("{limit}", String(b.moistureLimitPct))
              .replace("{rate}", String(b.deductionPctPerPoint))
          : t("breakdownNoLimit")}
      </Text>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.finalLabel}>💰 {t("breakdownFinal")}</Text>
        <Text style={styles.finalValue}>{formatRupees(b.finalAmount)}</Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadow.card,
  },
  title: { fontSize: fontSize.label, fontWeight: "800", color: colors.text, marginBottom: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  label: { fontSize: fontSize.body, color: colors.textMuted, flexShrink: 1 },
  value: { fontSize: fontSize.body, fontWeight: "700", color: colors.text },
  rule: { fontSize: fontSize.body, color: colors.textMuted, fontStyle: "italic" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  finalLabel: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
  finalValue: { fontSize: fontSize.header, fontWeight: "800", color: colors.primary },
});
