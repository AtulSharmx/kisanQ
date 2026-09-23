import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, shadow, spacing } from "../theme";
import { useLanguage } from "../context/LanguageContext";
import { PAYMENT_STAGES, type Payment, type PaymentStage } from "../types/firestore";
import type { StringKey } from "../i18n/strings";
import { formatPaymentDate } from "../utils/paymentDates";

export const PAYMENT_STAGE_LABEL: Record<PaymentStage, StringKey> = {
  quality_accepted: "payStageAccepted",
  jform_generated: "payStageJform",
  payment_sent: "payStageSent",
  credited: "payStageCredited",
};

/**
 * Step tracker for a payment: Quality accepted -> J-Form generated -> Payment sent -> Credited
 * to bank, with the promised date (accept date + 3 days). Icon + text for every state, never
 * colour alone (design principle 4): ✅ reached, ⏳ the next step being waited on, ⬜ later.
 */
export function PaymentStages({ payment }: { payment: Payment }) {
  const { t } = useLanguage();
  const current = PAYMENT_STAGES.indexOf(payment.status);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>💰 {t("payTrackerTitle")}</Text>
      {PAYMENT_STAGES.map((stage, i) => {
        const icon = i <= current ? "✅" : i === current + 1 ? "⏳" : "⬜";
        return (
          <View key={stage} style={styles.row}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[styles.label, i > current && styles.labelPending]}>
              {t(PAYMENT_STAGE_LABEL[stage])}
            </Text>
          </View>
        );
      })}
      {payment.status !== "credited" && (
        <Text style={styles.detail}>
          📅{" "}
          {t("procExpectedPaymentDate").replace(
            "{date}",
            formatPaymentDate(payment.expectedPaymentDate)
          )}
        </Text>
      )}
      {payment.transactionReference && (
        <Text style={styles.detail}>
          {t("payReference").replace("{ref}", payment.transactionReference)}
        </Text>
      )}
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
    gap: spacing.sm,
    ...shadow.card,
  },
  title: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  icon: { fontSize: fontSize.header },
  label: { fontSize: fontSize.label, fontWeight: "700", color: colors.text },
  labelPending: { color: colors.textMuted, fontWeight: "500" },
  detail: { fontSize: fontSize.body, color: colors.text },
});
