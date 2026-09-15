import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
import { commodityUnitFor, unitLabel } from "../../data/commodities";
import { useCommodities } from "../../hooks/useCommodities";
import { getCentreCropCapacity, submitQualityCheck } from "../../services/firestoreService";

type Props = NativeStackScreenProps<OperatorStackParamList, "QualityCheck">;

/**
 * Quality Check screen — UI/UX spec Operator screen 5: moisture %, grade, Accept/Reject with a
 * confirmation prompt before final submit (design principle 9 — confirm before anything
 * irreversible). Rejection: procurementStatus becomes "rejected", the farmer keeps their
 * produce with no payment obligation (Missing Details Polish sec. 8).
 *
 * The price field under Grade is the rate actually paid, in ₹ per unit of this commodity.
 * Picking a grade *pre-fills* it from whatever the admin configured for that grade at this
 * centre, but it stays fully editable — a grade letter is not a price, and the real number
 * varies by mandi and by season. Nothing here falls back to a built-in figure: with no
 * configured rate the field simply starts empty and the operator types it.
 */
export function QualityCheckScreen({ route, navigation }: Props) {
  const {
    bookingId,
    queueId,
    farmerId,
    procurementId,
    expectedQuantity,
    actualWeight,
    centreId,
    cropType,
  } = route.params;
  const { t, lang } = useLanguage();
  const { staffName } = useOperator();
  const { commodities } = useCommodities();
  const [moisturePct, setMoisturePct] = useState(12);
  const [grade, setGrade] = useState<string | null>(null);
  const [priceText, setPriceText] = useState("");
  const [priceTouched, setPriceTouched] = useState(false);
  const [gradePrices, setGradePrices] = useState<Record<string, number>>({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<"accept" | "reject" | null>(null);

  // One-shot read, not a listener: the rate that matters is the one in force when this lot is
  // weighed, and an admin editing it mid-check shouldn't silently overwrite what the operator
  // has already typed in front of the farmer.
  useEffect(() => {
    if (!centreId || !cropType) return;
    getCentreCropCapacity(centreId, cropType)
      .then((capacity) => setGradePrices(capacity?.gradePrices ?? {}))
      .catch((e) => console.error(e));
  }, [centreId, cropType]);

  const unitText = unitLabel(commodityUnitFor(cropType, commodities), lang);
  const configuredRates = GRADES.filter((g) => gradePrices[g] != null)
    .map((g) => `${g} = ₹${gradePrices[g]}`)
    .join(", ");
  // Live arithmetic under the field, so the operator sees the payable amount *before* confirming
  // rather than discovering it after the write — the same number the farmer's tracker will show.
  const payable =
    Number(priceText) > 0 ? Math.round(actualWeight * Number(priceText)) : null;

  const onPickGrade = (g: string) => {
    setGrade(g);
    // Pre-fills, never locks — and only while the operator hasn't typed their own number.
    // Overwriting a rate someone deliberately entered would be the easy way to pay the wrong
    // figure without noticing; re-filling one this screen put there itself is just keeping the
    // suggestion in step with the chosen grade.
    if (priceTouched) return;
    const configured = gradePrices[g];
    setPriceText(configured != null ? String(configured) : "");
  };

  const goBackToQueue = () =>
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "LiveQueueManagement" }] })
    );

  const submit = async (decision: "accept" | "reject") => {
    setSubmitting(true);
    setError(null);
    try {
      await submitQualityCheck({
        procurementId,
        bookingId,
        queueId,
        farmerId,
        moisturePct,
        grade: grade ?? "-",
        // On a rejection nothing is bought, so there is no rate to record — submitQualityCheck
        // stores null in that case and never reads this number.
        pricePerUnit: Number(priceText) || 0,
        decision,
        rejectionReason: decision === "reject" ? rejectionReason.trim() || undefined : undefined,
        actualWeight,
      });
      goBackToQueue();
    } catch (e) {
      console.error(e);
      setError(t("saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const askToConfirm = (decision: "accept" | "reject") => {
    if (!grade) {
      setError(t("operatorSelectGradeError"));
      return;
    }
    // Only an acceptance needs a rate — a rejection buys nothing, so demanding a price there
    // would just block the operator from recording a refusal.
    const price = Number(priceText);
    if (decision === "accept" && (!Number.isFinite(price) || price <= 0)) {
      setError(t("operatorEnterPriceError"));
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

      <View style={styles.content}>
        <View style={styles.card}>
          <Row label={t("operatorExpectedQtyLabel")} value={`${expectedQuantity} quintals`} />
          <Row label={t("operatorActualLabel")} value={`${actualWeight} quintals`} />
        </View>

        <Text style={styles.label}>{t("operatorMoistureLabel")}</Text>
        <View style={styles.stepper}>
          <Pressable
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
            onPress={() => setMoisturePct((m) => Math.max(0, m - 0.5))}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Text style={styles.stepperValue}>{moisturePct.toFixed(1)}%</Text>
          <Pressable
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
            onPress={() => setMoisturePct((m) => m + 0.5)}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>{t("operatorGradeLabel")}</Text>
        <View style={styles.gradeRow}>
          {GRADES.map((g) => (
            <Pressable
              key={g}
              onPress={() => onPickGrade(g)}
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

        <Text style={styles.label}>{t("operatorPriceLabel").replace("{unit}", unitText)}</Text>
        <TextInput
          value={priceText}
          onChangeText={(text) => {
            setPriceTouched(true);
            setPriceText(text);
          }}
          keyboardType="numeric"
          placeholder="₹"
          placeholderTextColor={colors.textMuted}
          style={styles.reasonInput}
        />
        {configuredRates !== "" && (
          <Text style={styles.hint}>
            {t("operatorConfiguredPriceHint").replace("{rates}", configuredRates)}
          </Text>
        )}
        {payable != null && (
          <Text style={styles.hint}>
            {actualWeight} × ₹{Number(priceText)} = ₹{payable}
          </Text>
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
      </View>

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
  stepperValue: { fontSize: fontSize.display, fontWeight: "800", color: colors.text, minWidth: 90, textAlign: "center" },
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
