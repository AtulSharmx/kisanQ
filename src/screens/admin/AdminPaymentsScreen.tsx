import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useOperator } from "../../context/OperatorContext";
import { OperatorHeader } from "../../components/OperatorHeader";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PAYMENT_STAGE_LABEL } from "../../components/PaymentStages";
import { formatRupees } from "../../config/msp";
import { formatPaymentDate } from "../../utils/paymentDates";
import {
  advancePaymentStage,
  getBooking,
  getFarmer,
  listenAllPayments,
  nextPaymentStage,
  type PaymentWithId,
} from "../../services/firestoreService";
import { PAYMENT_STAGES } from "../../types/firestore";

type Props = NativeStackScreenProps<OperatorStackParamList, "AdminPayments">;

interface Who {
  tokenNumber: string;
  farmerName: string;
}

/**
 * Admin Payments — every simulated payment with its current stage, and one button to move it to
 * the next stage (Quality accepted -> J-Form generated -> Payment sent -> Credited to bank). Each
 * move notifies the farmer in-app and by (simulated) SMS; the ConfirmDialog makes that explicit
 * before it happens, since a farmer-facing message can't be unsent. No money moves (CLAUDE.md
 * rule 6).
 */
export function AdminPaymentsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { staffName } = useOperator();
  const [payments, setPayments] = useState<PaymentWithId[] | null>(null);
  const [who, setWho] = useState<Record<string, Who>>({});
  const [pending, setPending] = useState<PaymentWithId | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => listenAllPayments(setPayments), []);

  // Token + farmer name, looked up once per payment (neither ever changes).
  useEffect(() => {
    payments
      ?.filter((p) => !who[p.id])
      .forEach(async (p) => {
        const booking = await getBooking(p.bookingId).catch(() => null);
        const farmer = booking ? await getFarmer(booking.farmerId).catch(() => null) : null;
        setWho((prev) => ({
          ...prev,
          [p.id]: { tokenNumber: booking?.tokenNumber ?? "—", farmerName: farmer?.name ?? "—" },
        }));
      });
    // `who` is only read to skip rows already loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments]);

  // Unfinished payments first (the admin's work queue), then by promised date.
  const sorted = useMemo(
    () =>
      [...(payments ?? [])].sort(
        (a, b) =>
          Number(a.status === "credited") - Number(b.status === "credited") ||
          a.expectedPaymentDate.localeCompare(b.expectedPaymentDate)
      ),
    [payments]
  );

  const onAdvance = async (payment: PaymentWithId) => {
    setWorkingId(payment.id);
    setError(null);
    try {
      await advancePaymentStage(payment.id);
    } catch (e) {
      console.error(e);
      setError(t("saveFailed"));
    } finally {
      setWorkingId(null);
    }
  };

  const pendingNext = pending ? nextPaymentStage(pending.status) : null;

  return (
    <View style={styles.screen}>
      <OperatorHeader
        title={`💰 ${t("adminPaymentsLink")}`}
        staffName={staffName}
        actions={[
          { icon: "←", label: t("backToOverview"), onPress: () => navigation.navigate("AdminOverview") },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {error && <Text style={styles.error}>{error}</Text>}
        {!payments ? (
          <ActivityIndicator color={colors.primary} />
        ) : sorted.length === 0 ? (
          <Text style={styles.empty}>{t("emptyPayment")}</Text>
        ) : (
          sorted.map((p) => {
            const next = nextPaymentStage(p.status);
            const stageIndex = PAYMENT_STAGES.indexOf(p.status);
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.token}>{who[p.id]?.tokenNumber ?? "…"}</Text>
                  <Text style={styles.amount}>{formatRupees(p.amount)}</Text>
                </View>
                <Text style={styles.meta}>{who[p.id]?.farmerName ?? ""}</Text>
                <Text style={styles.stage}>
                  {p.status === "credited" ? "✅" : "⏳"} {stageIndex + 1}/{PAYMENT_STAGES.length} ·{" "}
                  {t(PAYMENT_STAGE_LABEL[p.status])}
                </Text>
                <Text style={styles.meta}>
                  📅 {t("procExpectedPaymentDate").replace("{date}", formatPaymentDate(p.expectedPaymentDate))}
                </Text>
                {p.transactionReference && (
                  <Text style={styles.meta}>
                    {t("payReference").replace("{ref}", p.transactionReference)}
                  </Text>
                )}
                {next && (
                  <PrimaryButton
                    label={`➡️ ${t("adminNextStageBtn").replace("{stage}", t(PAYMENT_STAGE_LABEL[next]))}`}
                    onPress={() => setPending(p)}
                    loading={workingId === p.id}
                  />
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <ConfirmDialog
        visible={pending !== null}
        title={
          pendingNext
            ? t("adminStageConfirmTitle").replace("{stage}", t(PAYMENT_STAGE_LABEL[pendingNext]))
            : ""
        }
        confirmLabel={t("adminConfirmYes")}
        cancelLabel={t("cancelConfirmNo")}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const p = pending!;
          setPending(null);
          onAdvance(p);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center", gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadow.card,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  token: { fontSize: fontSize.label, fontWeight: "800", color: colors.primary },
  amount: { fontSize: fontSize.header, fontWeight: "800", color: colors.text },
  stage: { fontSize: fontSize.label, fontWeight: "700", color: colors.text },
  meta: { fontSize: fontSize.body, color: colors.textMuted },
  empty: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center" },
  error: { color: colors.error, textAlign: "center" },
});
