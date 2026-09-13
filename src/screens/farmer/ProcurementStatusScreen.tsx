import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import {
  getActiveBookingForFarmer,
  listenBooking,
  listenProcurementForBooking,
  type BookingWithId,
  type ProcurementWithId,
} from "../../services/firestoreService";
import type { StringKey } from "../../i18n/strings";

type Props = NativeStackScreenProps<RootStackParamList, "ProcurementStatus">;

interface Step {
  key: StringKey;
  done: boolean;
}

/**
 * Procurement Status Tracker — UI/UX spec screen 10, wired to real-time listeners (Master Spec
 * build order step 4). This is the anti-corruption differentiator from the Winning Strategy
 * doc: every weighing/quality-check write the operator makes should reach this screen live.
 * Weighing and quality-check screens are build order step 5 and don't exist yet, so this can
 * only show real ticks up through "Arrived" for now — it's already wired for when step 5 lands.
 */
export function ProcurementStatusScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { farmerId } = useFarmer();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingWithId | null>(null);
  const [procurement, setProcurement] = useState<ProcurementWithId | null>(null);

  useEffect(() => {
    if (!farmerId) return;
    let unsubBooking: (() => void) | undefined;
    let unsubProcurement: (() => void) | undefined;

    getActiveBookingForFarmer(farmerId).then((b) => {
      setLoading(false);
      if (!b) return;
      setBooking(b);
      unsubBooking = listenBooking(b.id, setBooking);
      unsubProcurement = listenProcurementForBooking(b.id, setProcurement);
    });

    return () => {
      unsubBooking?.();
      unsubProcurement?.();
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
  const paid = booking.status === "completed"; // real payment linking lands with build order step 5

  const steps: Step[] = [
    { key: "procStepBooked", done: true },
    { key: "procStepArrived", done: arrived },
    { key: "procStepWeighed", done: weighed },
    { key: "procStepQualityChecked", done: qualityChecked },
    { key: "procStepAccepted", done: accepted },
    { key: "procStepPayment", done: paid },
  ];

  return (
    <ScreenContainer>
      <Text style={styles.title}>{t("homeProcurementStatus")}</Text>
      <Text style={styles.token}>{booking.tokenNumber}</Text>

      <View style={styles.list}>
        {steps.map((step) => (
          <View key={step.key} style={styles.row}>
            <Text style={styles.checkbox}>{step.done ? "✅" : "⬜"}</Text>
            <Text style={[styles.stepLabel, !step.done && styles.stepLabelPending]}>
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
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkbox: { fontSize: fontSize.header },
  stepLabel: { fontSize: fontSize.label, fontWeight: "700", color: colors.text },
  stepLabelPending: { color: colors.textMuted, fontWeight: "500" },
  detail: { fontSize: fontSize.body, color: colors.text, marginTop: spacing.lg },
  rejectedTitle: { fontSize: fontSize.header, fontWeight: "800", color: colors.error },
});
