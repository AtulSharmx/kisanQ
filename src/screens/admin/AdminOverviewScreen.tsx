import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useOperator } from "../../context/OperatorContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { OperatorHeader } from "../../components/OperatorHeader";
import { StatCard } from "../../components/StatCard";
import { listenAdminOverview, type AdminOverview } from "../../services/firestoreService";
import type { StringKey } from "../../i18n/strings";

type Props = NativeStackScreenProps<OperatorStackParamList, "AdminOverview">;

interface Card {
  icon: string;
  labelKey: StringKey;
  value: number;
  accent?: boolean;
}

const CHART_HEIGHT = 28;

/**
 * Admin Overview — UI/UX spec Admin screen 1. Real-time top counters as StatCards, plus a Live
 * Queue Health bar visualising how today's bookings split across completed / in-progress /
 * waiting — the same three numbers as the counters above, just given a shape a glance can read.
 * Header/nav actions moved to the shared OperatorHeader (was previously duplicated inline here).
 */
export function AdminOverviewScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { staffName, logout } = useOperator();
  // Logout asks first (design principle 9 — confirm before anything irreversible), same as the
  // Settings screen's logout. ConfirmDialog, not Alert.alert, which is a no-op on web.
  const [confirmingLogout, setConfirmingLogout] = useState(false);
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

  const inProgress = Math.max(
    0,
    overview.totalBookings - overview.completedBookings - overview.currentlyWaiting
  );
  const chartTotal = Math.max(1, overview.totalBookings);
  const completedPct = overview.completedBookings / chartTotal;
  const inProgressPct = inProgress / chartTotal;
  const waitingPct = overview.currentlyWaiting / chartTotal;

  return (
    <View style={styles.screen}>
      <OperatorHeader
        title={t("adminOverviewTitle")}
        staffName={staffName}
        actions={[
          { icon: "🗺️", label: t("adminDrilldownLink"), onPress: () => navigation.navigate("AdminDrilldown") },
          { icon: "💰", label: t("adminPaymentsLink"), onPress: () => navigation.navigate("AdminPayments") },
          { icon: "✋", label: t("adminObjectionsLink"), onPress: () => navigation.navigate("AdminObjections") },
          { icon: "📩", label: t("adminSmsLogLink"), onPress: () => navigation.navigate("AdminSmsLog") },
          { icon: "⚙️", label: t("adminSettingsLink"), onPress: () => navigation.navigate("AdminSettings") },
          { icon: "🚪", label: t("logoutBtn"), onPress: () => setConfirmingLogout(true), danger: true },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {cards.map((card) => (
            <StatCard
              key={card.labelKey}
              icon={card.icon}
              value={card.value}
              label={t(card.labelKey)}
              tone={card.accent ? "accent" : "primary"}
            />
          ))}
        </View>

        <View style={styles.chartCard}>
          <Svg width="100%" height={CHART_HEIGHT} viewBox="0 0 100 10">
            <Rect x={0} y={0} width={100} height={10} rx={5} fill={colors.border} />
            {overview.totalBookings > 0 && (
              <>
                <Rect x={0} y={0} width={completedPct * 100} height={10} rx={5} fill={colors.primary} />
                <Rect
                  x={completedPct * 100}
                  y={0}
                  width={inProgressPct * 100}
                  height={10}
                  fill={colors.disabled}
                />
                <Rect
                  x={(completedPct + inProgressPct) * 100}
                  y={0}
                  width={waitingPct * 100}
                  height={10}
                  rx={5}
                  fill={colors.accent}
                />
              </>
            )}
          </Svg>
          <View style={styles.legendRow}>
            <LegendItem swatch={colors.primary} label={t("statCompleted")} value={overview.completedBookings} />
            <LegendItem swatch={colors.disabled} label={t("operatorTabProcessing")} value={inProgress} />
            <LegendItem swatch={colors.accent} label={t("statCurrentlyWaiting")} value={overview.currentlyWaiting} />
          </View>
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={confirmingLogout}
        title={t("logoutConfirmTitle")}
        confirmLabel={t("logoutConfirmYes")}
        cancelLabel={t("cancelConfirmNo")}
        destructive
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={() => {
          setConfirmingLogout(false);
          logout();
        }}
      />
    </View>
  );
}

function LegendItem({ swatch, label, value }: { swatch: string; label: string; value: number }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: swatch }]} />
      <Text style={styles.legendText}>
        {label} · {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  content: { padding: spacing.lg, maxWidth: 760, width: "100%", alignSelf: "center", gap: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: fontSize.body, color: colors.textMuted, fontWeight: "600" },
});
