import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useOperator } from "../../context/OperatorContext";
import { listenAdminOverview, type AdminOverview } from "../../services/firestoreService";
import type { StringKey } from "../../i18n/strings";

type Props = NativeStackScreenProps<OperatorStackParamList, "AdminOverview">;

interface Card {
  icon: string;
  labelKey: StringKey;
  value: number;
  accent?: boolean;
}

/**
 * Admin Overview — UI/UX spec Admin screen 1. Real-time top counters as icon cards, with a
 * proper header (Settings + District→Centre + Logout as distinct tappable chips, not bare text
 * links) matching the same visual language (icons, shadow.card, press feedback) the Farmer app
 * already has — this screen previously had none of that, which read as noticeably more basic
 * than the rest of the app.
 */
export function AdminOverviewScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { staffName, logout } = useOperator();
  const [overview, setOverview] = useState<AdminOverview | null>(null);

  useEffect(() => {
    const unsubscribe = listenAdminOverview(setOverview);
    return unsubscribe;
  }, []);

  if (!overview) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      </View>
    );
  }

  const cards: Card[] = [
    { icon: "📍", labelKey: "statTotalCentres", value: overview.totalCentres },
    { icon: "👨‍🌾", labelKey: "statTotalFarmers", value: overview.totalFarmers },
    { icon: "🎫", labelKey: "statTotalBookings", value: overview.totalBookings },
    { icon: "✅", labelKey: "statCompleted", value: overview.completedBookings },
    { icon: "⏳", labelKey: "statCurrentlyWaiting", value: overview.currentlyWaiting },
    { icon: "⏱️", labelKey: "statAvgWait", value: overview.averageWaitMinutes, accent: true },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerAppName}>KisanQ — {t("adminOverviewTitle")}</Text>
          <Text style={styles.headerStaffName}>{staffName}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate("AdminDrilldown")}
            style={({ pressed }) => [styles.headerChip, pressed && styles.pressed]}
          >
            <Text style={styles.headerChipText}>🗺️ {t("adminDrilldownLink")}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("AdminPayments")}
            style={({ pressed }) => [styles.headerChip, pressed && styles.pressed]}
          >
            <Text style={styles.headerChipText}>💰 {t("adminPaymentsLink")}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("AdminObjections")}
            style={({ pressed }) => [styles.headerChip, pressed && styles.pressed]}
          >
            <Text style={styles.headerChipText}>✋ {t("adminObjectionsLink")}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("AdminSmsLog")}
            style={({ pressed }) => [styles.headerChip, pressed && styles.pressed]}
          >
            <Text style={styles.headerChipText}>📩 {t("adminSmsLogLink")}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("AdminSettings")}
            style={({ pressed }) => [styles.headerChip, pressed && styles.pressed]}
          >
            <Text style={styles.headerChipText}>⚙️ {t("adminSettingsLink")}</Text>
          </Pressable>
          <Pressable
            onPress={logout}
            style={({ pressed }) => [styles.headerChip, styles.headerChipDanger, pressed && styles.pressed]}
          >
            <Text style={[styles.headerChipText, styles.headerChipDangerText]}>
              🚪 {t("logoutBtn")}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {cards.map((card) => (
          <View key={card.labelKey} style={[styles.card, card.accent && styles.cardAccent]}>
            <Text style={styles.cardIcon}>{card.icon}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardLabel}>{t(card.labelKey)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerAppName: { fontSize: fontSize.label, fontWeight: "800", color: colors.primary },
  headerStaffName: { fontSize: fontSize.body, color: colors.textMuted, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  headerChip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerChipDanger: { borderColor: colors.errorTint, backgroundColor: colors.errorTint },
  headerChipText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.body },
  headerChipDangerText: { color: colors.error },
  grid: {
    padding: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  card: {
    flexBasis: "31%",
    minWidth: 160,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    ...shadow.card,
    gap: spacing.xs,
  },
  cardAccent: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  cardIcon: { fontSize: 28 },
  cardValue: { fontSize: fontSize.display, fontWeight: "800", color: colors.primary },
  cardLabel: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center" },
  pressed: { opacity: 0.7 },
});
