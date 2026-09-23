import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useOperator } from "../../context/OperatorContext";
import { OperatorHeader } from "../../components/OperatorHeader";
import { listenSmsLog, type SmsLogWithId } from "../../services/firestoreService";

type Props = NativeStackScreenProps<OperatorStackParamList, "AdminSmsLog">;

function formatTime(value: unknown): string {
  const ts = value as { toDate?: () => Date } | undefined;
  return ts?.toDate ? ts.toDate().toLocaleString() : "";
}

/**
 * Admin SMS Log — every SMS the system "sent" alongside a farmer notification, newest first.
 * Clearly labelled as simulated: no gateway is integrated yet (see src/services/sms.ts, the one
 * function to change to go live). Mobile numbers are stored and shown masked. Admin-only read,
 * enforced in firestore.rules.
 */
export function AdminSmsLogScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { staffName } = useOperator();
  const [rows, setRows] = useState<SmsLogWithId[] | null>(null);

  useEffect(() => listenSmsLog(setRows), []);

  return (
    <View style={styles.screen}>
      <OperatorHeader
        title={`📩 ${t("adminSmsLogLink")}`}
        staffName={staffName}
        actions={[
          { icon: "←", label: t("backToOverview"), onPress: () => navigation.navigate("AdminOverview") },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>⚠️ {t("adminSmsSimulatedBanner")}</Text>
        </View>
        {!rows ? (
          <ActivityIndicator color={colors.primary} />
        ) : rows.length === 0 ? (
          <Text style={styles.empty}>{t("adminNoSms")}</Text>
        ) : (
          rows.map((r) => (
            <View key={r.id} style={styles.row}>
              <View style={styles.rowHead}>
                <Text style={styles.mobile}>📱 {r.mobileMasked}</Text>
                <Text style={styles.tag}>{r.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.text}>{r.text}</Text>
              <Text style={styles.meta}>{formatTime(r.createdAt)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center", gap: spacing.sm },
  banner: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
    padding: spacing.md,
  },
  bannerText: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rowHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mobile: { fontSize: fontSize.body, fontWeight: "700", color: colors.text },
  tag: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
    backgroundColor: colors.accentTint,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  text: { fontSize: fontSize.body, color: colors.text },
  meta: { fontSize: fontSize.body, color: colors.textMuted },
  empty: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center" },
});
