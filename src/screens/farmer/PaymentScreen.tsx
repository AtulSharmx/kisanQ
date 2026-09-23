import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PaymentStages } from "../../components/PaymentStages";
import { PaymentBreakdown, breakdownFromProcurement } from "../../components/PaymentBreakdown";
import {
  getBooking,
  getProcurement,
  listenPaymentsForFarmer,
  type PaymentWithId,
} from "../../services/firestoreService";
import type { ProcurementBreakdown } from "../../config/msp";

interface PaymentExtras {
  tokenNumber: string | null;
  breakdown: ProcurementBreakdown | null;
}

/**
 * Payment — the Home 💰 tile. One card per accepted lot: the stage tracker (Quality accepted ->
 * J-Form generated -> Payment sent -> Credited to bank) with the promised date (accept + 3 days),
 * and the full breakdown it was calculated from. The stage list is a live listener, so an admin
 * moving the payment forward shows up here immediately. The breakdown is read once per payment:
 * it's fixed at acceptance and never changes afterwards.
 */
export function PaymentScreen() {
  const { t } = useLanguage();
  const { farmerId } = useFarmer();
  const [payments, setPayments] = useState<PaymentWithId[] | null>(null);
  const [extras, setExtras] = useState<Record<string, PaymentExtras>>({});

  useEffect(() => {
    if (!farmerId) return;
    return listenPaymentsForFarmer(farmerId, setPayments, (e) => {
      console.error(e);
      setPayments([]);
    });
  }, [farmerId]);

  useEffect(() => {
    if (!payments) return;
    payments
      .filter((p) => !extras[p.id])
      .forEach(async (p) => {
        const [booking, procurement] = await Promise.all([
          getBooking(p.bookingId).catch(() => null),
          getProcurement(p.procurementId).catch(() => null),
        ]);
        setExtras((prev) => ({
          ...prev,
          [p.id]: {
            tokenNumber: booking?.tokenNumber ?? null,
            breakdown: breakdownFromProcurement(procurement),
          },
        }));
      });
    // `extras` deliberately left out: it's only read to skip payments already loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments]);

  if (!payments) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (payments.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyBody}>{t("emptyPayment")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>{t("homePayment")}</Text>
      {payments.map((p) => {
        const extra = extras[p.id];
        return (
          <View key={p.id} style={styles.block}>
            {extra?.tokenNumber && <Text style={styles.token}>{extra.tokenNumber}</Text>}
            <PaymentStages payment={p} />
            {extra?.breakdown && <PaymentBreakdown breakdown={extra.breakdown} />}
          </View>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  block: { gap: spacing.md, marginBottom: spacing.xl },
  token: { fontSize: fontSize.label, color: colors.primary, fontWeight: "700" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyBody: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center" },
});
