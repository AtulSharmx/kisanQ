import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { PaymentBreakdown, breakdownFromProcurement } from "../../components/PaymentBreakdown";
import { PaymentStages, PAYMENT_STAGE_LABEL } from "../../components/PaymentStages";
import { ObjectionPanel } from "../../components/ObjectionPanel";
import { unitLabel } from "../../data/commodities";
import {
  getLatestBookingForFarmer,
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
 * Procurement Status Tracker — UI/UX spec screen 10, wired to real-time listeners (Master Spec
 * build order step 4/5). This is the anti-corruption differentiator from the Winning Strategy
 * doc: every weighing/quality-check write the operator makes reaches this screen live.
 * The payment row reads the payments/ collection directly and deliberately does NOT approximate
 * from booking.status, which flips to "completed" the moment quality-check finishes regardless
 * of payment. It only ticks once the payment is "credited"; before that it shows the current
 * payment stage, and the full stage tracker + promised date are shown below.
 *
 * Also shows the full payment breakdown stored on the procurement record (weight × MSP,
 * moisture vs limit, deduction and rule, final amount) and the objection button — the farmer can
 * dispute a weight or quality result from the same screen that shows it. Loads the farmer's
 * latest booking *including* completed ones, since "completed" is exactly when the breakdown and
 * payment stages matter.
 */
export function ProcurementStatusScreen({ navigation }: Props) {
  const { t, lang } = useLanguage();
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

    getLatestBookingForFarmer(farmerId).then((b) => {
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
          {procurement.moisturePct != null && (
            <Text style={styles.body}>
              💧 {t("breakdownMoistureFound")}: {procurement.moisturePct}%
            </Text>
          )}
          {procurement.rejectionReason && (
            <Text style={styles.body}>{procurement.rejectionReason}</Text>
          )}
        </View>
        <ObjectionPanel booking={booking} procurement={procurement} />
      </ScreenContainer>
    );
  }

  const arrived = booking.status !== "booked";
  const weighed = procurement?.actualWeight != null;
  const qualityChecked = !!procurement && procurement.qualityStatus !== "pending";
  const accepted = procurement?.qualityStatus === "accepted";
  const paid = payment?.status === "credited";
  const breakdown = breakdownFromProcurement(procurement);

  const steps: Step[] = [
    { key: "procStepBooked", state: "done" },
    { key: "procStepArrived", state: arrived ? "done" : "pending" },
    { key: "procStepWeighed", state: weighed ? "done" : "pending" },
    { key: "procStepQualityChecked", state: qualityChecked ? "done" : "pending" },
    { key: "procStepAccepted", state: accepted ? "done" : "pending" },
    paid
      ? { key: "procStepPayment", state: "done" }
      : payment
        ? { key: PAYMENT_STAGE_LABEL[payment.status], state: "active" }
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
        <Text style={styles.detail}>
          {t("weighingRecordedDetail")
            .replace("{weight}", String(procurement.actualWeight))
            .replace("{unit}", unitLabel("quintal", lang))}
        </Text>
      )}
      {qualityChecked && procurement?.grade && (
        <Text style={styles.detail}>
          {t("qualityGradeDetail").replace("{grade}", procurement.grade)}
        </Text>
      )}
      {accepted && breakdown && (
        <View style={styles.section}>
          <PaymentBreakdown breakdown={breakdown} />
        </View>
      )}
      {payment && (
        <View style={styles.section}>
          <PaymentStages payment={payment} />
        </View>
      )}
      {weighed && procurement && <ObjectionPanel booking={booking} procurement={procurement} />}
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
  section: { marginTop: spacing.lg },
  rejectedTitle: { fontSize: fontSize.header, fontWeight: "800", color: colors.error },
});
