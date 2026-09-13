import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CommonActions } from "@react-navigation/native";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, shadow, spacing, touchTarget } from "../../theme";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { submitQualityCheck } from "../../services/firestoreService";

type Props = NativeStackScreenProps<OperatorStackParamList, "QualityCheck">;

// Grade values aren't specified anywhere in the docs — a small A/B/C set is a reasonable
// stand-in for a real MSP grading scale, kept simple per "functional over pretty."
const GRADES = ["A", "B", "C"];

/**
 * Quality Check screen — UI/UX spec Operator screen 5: moisture %, grade, Accept/Reject with a
 * confirmation prompt before final submit (design principle 9 — confirm before anything
 * irreversible). Rejection: procurementStatus becomes "rejected", the farmer keeps their
 * produce with no payment obligation (Missing Details Polish sec. 8).
 */
export function QualityCheckScreen({ route, navigation }: Props) {
  const { bookingId, queueId, farmerId, procurementId, expectedQuantity, actualWeight } =
    route.params;
  const [moisturePct, setMoisturePct] = useState(12);
  const [grade, setGrade] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<"accept" | "reject" | null>(null);

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
        decision,
        rejectionReason: decision === "reject" ? rejectionReason.trim() || undefined : undefined,
      });
      goBackToQueue();
    } catch (e) {
      console.error(e);
      setError("सेव नहीं हुआ, दोबारा कोशिश करें। (Save failed, try again.)");
    } finally {
      setSubmitting(false);
    }
  };

  const askToConfirm = (decision: "accept" | "reject") => {
    if (!grade) {
      setError("ग्रेड चुनें (Select a grade)");
      return;
    }
    setError(null);
    setPendingDecision(decision);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>गुणवत्ता जांच</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Row label="अपेक्षित (Expected)" value={`${expectedQuantity} quintals`} />
          <Row label="वास्तविक वज़न (Actual)" value={`${actualWeight} quintals`} />
        </View>

        <Text style={styles.label}>नमी % (Moisture %)</Text>
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

        <Text style={styles.label}>ग्रेड (Grade)</Text>
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
                {g}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>अस्वीकृति का कारण, यदि हो (Rejection reason, if any)</Text>
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
          label="स्वीकार करें (Accept)"
          onPress={() => askToConfirm("accept")}
          loading={submitting}
        />
        <View style={styles.spacerSmall} />
        <PrimaryButton
          label="अस्वीकार करें (Reject)"
          onPress={() => askToConfirm("reject")}
          loading={submitting}
          variant="danger"
        />
      </View>

      <ConfirmDialog
        visible={pendingDecision !== null}
        title={
          pendingDecision === "accept"
            ? "क्या आप वाकई इस फसल को स्वीकार करना चाहते हैं?"
            : "क्या आप वाकई इस फसल को अस्वीकार करना चाहते हैं?"
        }
        confirmLabel={pendingDecision === "accept" ? "हाँ, स्वीकार करें" : "हाँ, अस्वीकार करें"}
        cancelLabel="नहीं"
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
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
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
  error: { color: colors.error, textAlign: "center" },
  spacer: { height: spacing.sm },
  spacerSmall: { height: spacing.xs },
  pressed: { opacity: 0.7 },
});
