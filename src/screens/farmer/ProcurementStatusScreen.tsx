import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import {
  formatPaymentDate,
  getActiveBookingForFarmer,
  listenBooking,
  listenPaymentForProcurement,
  listenProcurementForBooking,
  type BookingWithId,
  type PaymentWithId,
  type ProcurementWithId,
} from "../../services/firestoreService";
import type { StringKey } from "../../i18n/strings";

type Props = NativeStackScreenProps<RootStackParamList, "ProcurementStatus">;

/**
 * A tracker row is three-state, not two. "pending" is a step nothing has happened on yet,
 * "done" is finished, and "active" is under way — used by the payment row once the lot is
 * accepted and the money has been raised but not settled. Icon + text together, never colour
 * alone (design principle 4).
 */
type StepState = "pending" | "active" | "done";

const STEP_ICON: Record<StepState, string> = {
  pending: "⬜",
  active: "⏳",
  done: "✅",
};

interface Step {
  key: StringKey;
  state: StepState;
}

/**
 * The transparency tracker: every weighing and quality-check write reaches this screen live.
 *
 * The payment row reads payments/ directly rather than inferring from booking.status, which
 * flips to "completed" at quality check whether the lot was accepted or rejected. It only ticks
 * on a settled payment; before that it shows "in process" and the date promised.
 */
export function ProcurementStatusScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { farmerId } = useFarmer();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingWithId | null>(null);
  const [procurement, setProcurement] = useState<ProcurementWithId | null>(null);
  const [payment, setPayment] = useState<PaymentWithId | null>(null);

  useEffect(() => {
    if (!farmerId) return;
    let unsubBooking: (() => void) | undefined;
    let unsubProcurement: (() => void) | undefined;
    let unsubPayment: (() => void) | undefined;

    getActiveBookingForFarmer(farmerId).then((b) => {
      setLoading(false);
      if (!b) return;
      setBooking(b);
      unsubBooking = listenBooking(b.id, setBooking);
      unsubProcurement = listenProcurementForBooking(b.id, (p) => {
        setProcurement(p);
        unsubPayment?.();
        unsubPayment = p ? listenPaymentForProcurement(p.id, setPayment) : undefined;
      });
    });

    return () => {
      unsubBooking?.();
      unsubProcurement?.();
      unsubPayment?.();
    };
  }, [farmerId]);

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!booking) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.icon}>📋</Text>
          <Text style={styles.body}>{t("emptyLiveQueue")}</Text>
          <PrimaryButton label={t("homeBookSlot")} onPress={() => navigation.navigate("AddCrop")} />
        </View>
      </ScreenContainer>
    );
  }

  if (procurement?.qualityStatus === "rejected") {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.icon}>❌</Text>
          <Text style={styles.rejectedTitle}>{t("procRejected")}</Text>
          {procurement.rejectionReason && (
            <Text style={styles.body}>{procurement.rejectionReason}</Text>
          )}
        </View>
      </ScreenContainer>
    );
  }

  const arrived = booking.status !== "booked";
  const weighed = procurement?.actualWeight != null;
  const qualityChecked = !!procurement && procurement.qualityStatus !== "pending";
  const accepted = procurement?.qualityStatus === "accepted";
  const paid = payment?.status === "completed";
  // submitQualityCheck() raises the payment doc with status "processing" the moment the lot is
  // accepted, so the row can say so honestly instead of sitting blank until settlement days later.
  const paymentProcessing = payment?.status === "processing";

  const steps: Step[] = [
    { key: "procStepBooked", state: "done" },
    { key: "procStepArrived", state: arrived ? "done" : "pending" },
    { key: "procStepWeighed", state: weighed ? "done" : "pending" },
    { key: "procStepQualityChecked", state: qualityChecked ? "done" : "pending" },
    { key: "procStepAccepted", state: accepted ? "done" : "pending" },
    paid
      ? { key: "procStepPayment", state: "done" }
      : paymentProcessing
        ? { key: "procStepPaymentProcessing", state: "active" }
        : { key: "procStepPayment", state: "pending" },
  ];

  return (
    <ScreenContainer>
      <Text style={styles.title}>{t("homeProcurementStatus")}</Text>
      <Text style={styles.token}>{booking.tokenNumber}</Text>

      <View style={styles.list}>
        {steps.map((step) => (
          <View key={step.key} style={styles.row}>
            <Text style={styles.checkbox}>{STEP_ICON[step.state]}</Text>
            <Text style={[styles.stepLabel, step.state === "pending" && styles.stepLabelPending]}>
              {t(step.key)}
            </Text>
          </View>
        ))}
      </View>

      {weighed && procurement?.actualWeight != null && (
        <Text style={styles.detail}>आपका वज़न दर्ज हुआ: {procurement.actualWeight} किलो।</Text>
      )}
      {qualityChecked && procurement?.grade && (
        <Text style={styles.detail}>गुणवत्ता जांच पूरी — ग्रेड: {procurement.grade}।</Text>
      )}
      {accepted && procurement?.pricePerUnit != null && procurement.actualWeight != null && (
        <Text style={styles.detail}>
          {t("procPriceDetail")
            .replace("{rate}", String(procurement.pricePerUnit))
            .replace("{amount}", String(Math.round(procurement.actualWeight * procurement.pricePerUnit)))}
        </Text>
      )}
      {paymentProcessing && payment?.expectedPaymentDate && (
        <Text style={styles.detail}>
          {t("procExpectedPaymentDate").replace(
            "{date}",
            formatPaymentDate(payment.expectedPaymentDate)
          )}
        </Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  icon: { fontSize: 56, marginBottom: spacing.sm },
  body: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center", marginBottom: spacing.lg },
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.xs },
  token: { fontSize: fontSize.label, color: colors.primary, fontWeight: "700", marginBottom: spacing.lg },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkbox: { fontSize: fontSize.header },
  stepLabel: { fontSize: fontSize.label, fontWeight: "700", color: colors.text },
  stepLabelPending: { color: colors.textMuted, fontWeight: "500" },
  detail: { fontSize: fontSize.body, color: colors.text, marginTop: spacing.lg },
  rejectedTitle: { fontSize: fontSize.header, fontWeight: "800", color: colors.error },
});
