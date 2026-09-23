import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fontSize, radius, shadow, spacing, touchTarget } from "../theme";
import { useLanguage } from "../context/LanguageContext";
import { PrimaryButton } from "./PrimaryButton";
import {
  listenObjectionsForBooking,
  raiseObjection,
  type BookingWithId,
  type ObjectionWithId,
  type ProcurementWithId,
} from "../services/firestoreService";
import type { ObjectionReason, ObjectionStage } from "../types/firestore";
import type { StringKey } from "../i18n/strings";

const REASONS: { key: ObjectionReason; labelKey: StringKey; icon: string }[] = [
  { key: "weight", labelKey: "objectionReasonWeight", icon: "⚖️" },
  { key: "quality", labelKey: "objectionReasonQuality", icon: "💧" },
  { key: "other", labelKey: "objectionReasonOther", icon: "📝" },
];

const STAGE_LABEL: Record<ObjectionStage, StringKey> = {
  weighing: "objectionStageWeighing",
  quality: "objectionStageQuality",
};

/**
 * "आपत्ति दर्ज करें" — lets the farmer dispute a recorded weight or quality/moisture result
 * right from the tracker, the moment it's recorded. Shown once the lot is weighed: before
 * quality check the objection is against the weighing, afterwards against the quality check
 * (one objection per stage). The objection's status (open/resolved) is shown live, so the farmer
 * can see the complaint went somewhere — an admin sees it with the operator's name attached.
 */
export function ObjectionPanel({
  booking,
  procurement,
}: {
  booking: BookingWithId;
  procurement: ProcurementWithId;
}) {
  const { t } = useLanguage();
  const [objections, setObjections] = useState<Partial<Record<ObjectionStage, ObjectionWithId>>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [reason, setReason] = useState<ObjectionReason | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => listenObjectionsForBooking(booking.id, setObjections), [booking.id]);

  const stage: ObjectionStage = procurement.qualityStatus === "pending" ? "weighing" : "quality";
  const canRaise = !objections[stage];

  const onSubmit = async () => {
    if (!reason) {
      setError(t("objectionSelectReason"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await raiseObjection({ booking, procurement, stage, reason, note });
      setFormOpen(false);
      setReason(null);
      setNote("");
    } catch (e) {
      console.error(e);
      setError(t("saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {(["weighing", "quality"] as ObjectionStage[]).map((s) => {
        const o = objections[s];
        if (!o) return null;
        return (
          <View key={s} style={[styles.status, o.status === "resolved" && styles.statusResolved]}>
            <Text style={styles.statusStage}>{t(STAGE_LABEL[s])}</Text>
            <Text style={styles.statusText}>
              {o.status === "resolved" ? t("objectionStatusResolved") : t("objectionStatusOpen")}
            </Text>
          </View>
        );
      })}

      {canRaise && !formOpen && (
        <PrimaryButton
          label={`✋ ${t("objectionBtn")}`}
          variant="outline"
          onPress={() => setFormOpen(true)}
        />
      )}

      {canRaise && formOpen && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{t("objectionTitle")}</Text>
          {REASONS.map((r) => (
            <Pressable
              key={r.key}
              onPress={() => setReason(r.key)}
              style={({ pressed }) => [
                styles.reason,
                reason === r.key && styles.reasonActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.reasonText, reason === r.key && styles.reasonTextActive]}>
                {reason === r.key ? "✓ " : ""}
                {r.icon} {t(r.labelKey)}
              </Text>
            </Pressable>
          ))}
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t("objectionNotePlaceholder")}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            style={styles.note}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <PrimaryButton label={t("objectionSubmit")} onPress={onSubmit} loading={submitting} />
          <PrimaryButton
            label={t("cancelConfirmNo")}
            variant="outline"
            onPress={() => {
              setFormOpen(false);
              setError(null);
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginTop: spacing.lg },
  status: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statusResolved: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  statusStage: { fontSize: fontSize.body, color: colors.textMuted },
  statusText: { fontSize: fontSize.label, fontWeight: "700", color: colors.text },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  formTitle: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
  reason: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  reasonActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  reasonText: { fontSize: fontSize.label, color: colors.text },
  reasonTextActive: { color: colors.primary, fontWeight: "700" },
  note: {
    minHeight: touchTarget * 1.5,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.body,
    color: colors.text,
    textAlignVertical: "top",
  },
  error: { color: colors.error, textAlign: "center" },
  pressed: { opacity: 0.7 },
});
