import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CommonActions } from "@react-navigation/native";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, shadow, spacing, touchTarget } from "../../theme";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { OperatorHeader } from "../../components/OperatorHeader";
import { useLanguage } from "../../context/LanguageContext";
import { useOperator } from "../../context/OperatorContext";
import { GRADES } from "../../data/grades";
import { unitLabel } from "../../data/commodities";
import { computeBreakdown, formatRupees, mspFor } from "../../config/msp";
import { PaymentBreakdown } from "../../components/PaymentBreakdown";
import { submitQualityCheck } from "../../services/firestoreService";

type Props = NativeStackScreenProps<OperatorStackParamList, "QualityCheck">;

/**
 * Quality Check screen — UI/UX spec Operator screen 5: moisture %, grade, Accept/Reject with a
 * confirmation prompt before final submit (design principle 9 — confirm before anything
 * irreversible). Rejection: procurementStatus becomes "rejected", the farmer keeps their
 * produce with no payment obligation (Missing Details Polish sec. 8).
 *
 * The operator never types a price. The rate is the crop's official MSP from
 * src/config/msp.ts, and the screen shows the full payment breakdown live as moisture changes —
 * weight × MSP, moisture vs the crop's limit, the deduction and its rule, the final amount — the
 * exact numbers the farmer will see on their phone the instant Accept is confirmed. A crop with
 * no verified MSP can't be accepted (it can still be rejected).
 */
export function QualityCheckScreen({ route, navigation }: Props) {
  const {
    bookingId,
    queueId,
    farmerId,
    procurementId,
    expectedQuantity,
    actualWeight,
    cropType,
  } = route.params;
  const { t, lang } = useLanguage();
  const { staffName, session } = useOperator();
  const [moisturePct, setMoisturePct] = useState(12);
  const [moistureText, setMoistureText] = useState("12.0");
  const [grade, setGrade] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<"accept" | "reject" | null>(null);

  const quintal = unitLabel("quintal", lang);
  const msp = mspFor(cropType);
  const breakdown = computeBreakdown(cropType, actualWeight, moisturePct);

  // Stepper and typed value stay in sync: the stepper rewrites the text, a valid typed value
  // moves the stepper. Clamped to a physically meaningful 0–40% range.
  const setMoisture = (value: number) => {
    const clamped = Math.min(40, Math.max(0, Math.round(value * 10) / 10));
    setMoisturePct(clamped);
    setMoistureText(clamped.toFixed(1));
  };
  const onMoistureTyped = (text: string) => {
    setMoistureText(text);
    const n = Number(text.replace(",", "."));
    if (text.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 40) setMoisturePct(n);
  };

  const goBackToQueue = () =>
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "LiveQueueManagement" }] })
    );

  const submit = async (decision: "accept" | "reject") => {
    setSubmitting(true);
    setError(null);
    try {
      if (!session) throw new Error("No staff session");
      await submitQualityCheck({
        procurementId,
        bookingId,
        queueId,
        farmerId,
        moisturePct,
        grade: grade ?? "-",
        decision,
        rejectionReason: decision === "reject" ? rejectionReason.trim() || undefined : undefined,
        actualWeight,
        staffId: session.staffId,
      });
      goBackToQueue();
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error && e.message === "MSP_NOT_CONFIGURED"
          ? t("operatorMspMissing")
          : t("saveFailed")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const askToConfirm = (decision: "accept" | "reject") => {
    if (!grade) {
      setError(t("operatorSelectGradeError"));
      return;
    }
    const typed = Number(moistureText.replace(",", "."));
    if (moistureText.trim() === "" || !Number.isFinite(typed) || typed < 0 || typed > 40) {
      setError(t("operatorMoistureLabel"));
      return;
    }
    // Only an acceptance needs a price — a crop with no verified MSP can still be rejected.
    if (decision === "accept" && msp == null) {
      setError(t("operatorMspMissing"));
      return;
    }
    setError(null);
    setPendingDecision(decision);
  };

  return (
    <View style={styles.screen}>
      <OperatorHeader
        title={`✅ ${t("operatorQualityCheckTitle")}`}
        staffName={staffName}
        actions={[
          {
            icon: "←",
            label: t("operatorBackToQueue"),
            // Safe to leave: the lot is already weighed and recorded, and the quality decision
            // isn't written until Accept/Reject, so backing out just re-opens it from the queue.
            onPress: goBackToQueue,
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Row label={t("operatorExpectedQtyLabel")} value={`${expectedQuantity} ${quintal}`} />
          <Row label={t("operatorActualLabel")} value={`${actualWeight} ${quintal}`} />
        </View>

        <Text style={styles.label}>{t("operatorMoistureLabel")}</Text>
        <View style={styles.stepper}>
          <Pressable
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
            onPress={() => setMoisture(moisturePct - 0.5)}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <View style={styles.moistureField}>
            <TextInput
              value={moistureText}
              onChangeText={onMoistureTyped}
              onBlur={() => setMoisture(moisturePct)}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={styles.stepperValue}
            />
            <Text style={styles.percent}>%</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
            onPress={() => setMoisture(moisturePct + 0.5)}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>{t("operatorGradeLabel")}</Text>
        <View style={styles.gradeRow}>
          {GRADES.map((g) => (
            <Pressable
              key={g}
              onPress={() => setGrade(g)}
              style={({ pressed }) => [
                styles.gradeChip,
                grade === g && styles.gradeChipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.gradeChipText, grade === g && styles.gradeChipTextActive]}>
                {grade === g ? "✓ " : ""}
                {g}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>
          {t("operatorMspLabel").replace("{unit}", quintal)}:{" "}
          <Text style={styles.mspValue}>{msp != null ? formatRupees(msp) : "—"}</Text>
        </Text>
        {breakdown ? (
          <PaymentBreakdown breakdown={breakdown} />
        ) : (
          <Text style={styles.error}>{t("operatorMspMissing")}</Text>
        )}

        <Text style={styles.label}>{t("operatorRejectionReasonLabel")}</Text>
        <TextInput
          value={rejectionReason}
          onChangeText={setRejectionReason}
          placeholder="e.g. moisture too high"
          placeholderTextColor={colors.textMuted}
          style={styles.reasonInput}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.spacer} />
        <PrimaryButton
          label={`✅ ${t("operatorAcceptBtn")}`}
          onPress={() => askToConfirm("accept")}
          loading={submitting}
        />
        <View style={styles.spacerSmall} />
        <PrimaryButton
          label={`❌ ${t("operatorRejectBtn")}`}
          onPress={() => askToConfirm("reject")}
          loading={submitting}
          variant="danger"
        />
      </ScrollView>

      <ConfirmDialog
        visible={pendingDecision !== null}
        title={
          pendingDecision === "accept"
            ? t("operatorAcceptConfirmTitle")
            : t("operatorRejectConfirmTitle")
        }
        confirmLabel={
          pendingDecision === "accept" ? t("operatorAcceptConfirmYes") : t("operatorRejectConfirmYes")
        }
        cancelLabel={t("cancelConfirmNo")}
        destructive={pendingDecision === "reject"}
        onCancel={() => setPendingDecision(null)}
        onConfirm={() => {
          const decision = pendingDecision!;
          setPendingDecision(null);
          submit(decision);
        }}
      />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, maxWidth: 480, width: "100%", alignSelf: "center", gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: colors.textMuted },
  rowValue: { fontWeight: "700", color: colors.text },
  label: { fontSize: fontSize.body, color: colors.textMuted },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg },
  stepBtn: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { color: colors.white, fontSize: 28, fontWeight: "700", lineHeight: 30 },
  moistureField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    minHeight: touchTarget,
  },
  stepperValue: {
    fontSize: fontSize.display,
    fontWeight: "800",
    color: colors.text,
    width: 90,
    textAlign: "center",
  },
  percent: { fontSize: fontSize.display, fontWeight: "800", color: colors.text },
  mspValue: { fontWeight: "800", color: colors.primary },
  gradeRow: { flexDirection: "row", gap: spacing.md },
  gradeChip: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  gradeChipText: { fontSize: fontSize.header, fontWeight: "700", color: colors.text },
  gradeChipTextActive: { color: colors.primary },
  reasonInput: {
    minHeight: touchTarget,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  hint: { fontSize: fontSize.body, color: colors.textMuted },
  error: { color: colors.error, textAlign: "center" },
  spacer: { height: spacing.sm },
  spacerSmall: { height: spacing.xs },
  pressed: { opacity: 0.7 },
});
