import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useOperator } from "../../context/OperatorContext";
import { OperatorHeader } from "../../components/OperatorHeader";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import {
  getBooking,
  getFarmer,
  getStaffName,
  listenAllObjections,
  resolveObjection,
  type ObjectionWithId,
} from "../../services/firestoreService";
import type { ObjectionReason, ObjectionStage } from "../../types/firestore";
import type { StringKey } from "../../i18n/strings";

type Props = NativeStackScreenProps<OperatorStackParamList, "AdminObjections">;

const REASON_LABEL: Record<ObjectionReason, StringKey> = {
  weight: "objectionReasonWeight",
  quality: "objectionReasonQuality",
  other: "objectionReasonOther",
};

const STAGE_LABEL: Record<ObjectionStage, StringKey> = {
  weighing: "objectionStageWeighing",
  quality: "objectionStageQuality",
};

interface Details {
  tokenNumber: string;
  farmerName: string;
  operatorName: string | null;
}

function formatTime(value: unknown): string {
  const ts = value as { toDate?: () => Date } | undefined;
  return ts?.toDate ? ts.toDate().toLocaleString() : "";
}

/**
 * Admin Objections — every farmer objection, newest first, with the operator who did the
 * weighing/quality check it's about. Showing the operator is the point: a pattern of objections
 * against one operator is exactly the under-weighing / quality-cut signal the transparency pitch
 * promises to surface. Only an admin can mark one resolved (enforced in firestore.rules), and
 * the farmer sees the new status live on their tracker.
 */
export function AdminObjectionsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { staffName, session } = useOperator();
  const [rows, setRows] = useState<ObjectionWithId[] | null>(null);
  const [details, setDetails] = useState<Record<string, Details>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => listenAllObjections(setRows), []);

  useEffect(() => {
    rows
      ?.filter((o) => !details[o.id])
      .forEach(async (o) => {
        const [booking, farmer, operatorName] = await Promise.all([
          getBooking(o.bookingId).catch(() => null),
          getFarmer(o.farmerId).catch(() => null),
          o.operatorStaffId ? getStaffName(o.operatorStaffId).catch(() => null) : null,
        ]);
        setDetails((prev) => ({
          ...prev,
          [o.id]: {
            tokenNumber: booking?.tokenNumber ?? "—",
            farmerName: farmer?.name ?? "—",
            operatorName,
          },
        }));
      });
    // `details` is only read to skip rows already loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const onResolve = async (id: string) => {
    if (!session) return;
    setWorkingId(id);
    setError(null);
    try {
      await resolveObjection(id, session.staffId);
    } catch (e) {
      console.error(e);
      setError(t("saveFailed"));
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <View style={styles.screen}>
      <OperatorHeader
        title={`✋ ${t("adminObjectionsLink")}`}
        staffName={staffName}
        actions={[
          { icon: "←", label: t("backToOverview"), onPress: () => navigation.navigate("AdminOverview") },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {error && <Text style={styles.error}>{error}</Text>}
        {!rows ? (
          <ActivityIndicator color={colors.primary} />
        ) : rows.length === 0 ? (
          <Text style={styles.empty}>{t("adminNoObjections")}</Text>
        ) : (
          rows.map((o) => {
            const d = details[o.id];
            const open = o.status === "open";
            return (
              <View key={o.id} style={[styles.card, open && styles.cardOpen]}>
                <View style={styles.rowBetween}>
                  <Text style={styles.token}>{d?.tokenNumber ?? "…"}</Text>
                  <Text style={styles.status}>
                    {open ? t("objectionOpenShort") : t("objectionResolvedShort")}
                  </Text>
                </View>
                <Text style={styles.meta}>
                  {d?.farmerName ?? ""} · {t(STAGE_LABEL[o.stage])}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.lineLabel}>{t("adminReasonLabel")}: </Text>
                  {t(REASON_LABEL[o.reason])}
                </Text>
                {o.note !== "" && (
                  <Text style={styles.line}>
                    <Text style={styles.lineLabel}>{t("adminNoteLabel")}: </Text>
                    {o.note}
                  </Text>
                )}
                <Text style={styles.line}>
                  <Text style={styles.lineLabel}>👷 {t("adminOperatorLabel")}: </Text>
                  {o.operatorStaffId
                    ? `${d?.operatorName ?? "…"} (${o.operatorStaffId})`
                    : "—"}
                </Text>
                <Text style={styles.meta}>{formatTime(o.createdAt)}</Text>
                {open && (
                  <PrimaryButton
                    label={`✅ ${t("adminMarkResolved")}`}
                    onPress={() => setPendingId(o.id)}
                    loading={workingId === o.id}
                  />
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <ConfirmDialog
        visible={pendingId !== null}
        title={t("adminResolveConfirmTitle")}
        confirmLabel={t("adminConfirmYes")}
        cancelLabel={t("cancelConfirmNo")}
        onCancel={() => setPendingId(null)}
        onConfirm={() => {
          const id = pendingId!;
          setPendingId(null);
          onResolve(id);
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
  cardOpen: { borderColor: colors.accent, borderWidth: 2 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  token: { fontSize: fontSize.label, fontWeight: "800", color: colors.primary },
  status: { fontSize: fontSize.body, fontWeight: "700", color: colors.text },
  line: { fontSize: fontSize.body, color: colors.text },
  lineLabel: { fontWeight: "700" },
  meta: { fontSize: fontSize.body, color: colors.textMuted },
  empty: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center" },
  error: { color: colors.error, textAlign: "center" },
});
