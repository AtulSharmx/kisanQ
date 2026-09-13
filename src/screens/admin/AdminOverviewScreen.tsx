import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, spacing } from "../../theme";
import { useOperator } from "../../context/OperatorContext";
import { getAdminOverview, type AdminOverview } from "../../services/firestoreService";

type Props = NativeStackScreenProps<OperatorStackParamList, "AdminOverview">;

interface Card {
  label: string;
  value: number;
}

/** Admin Overview — UI/UX spec Admin screen 1. Top counters as cards. Mock/simplified data is fine. */
export function AdminOverviewScreen({ navigation }: Props) {
  const { staffName, logout } = useOperator();
  const [overview, setOverview] = useState<AdminOverview | null>(null);

  useEffect(() => {
    getAdminOverview().then(setOverview);
  }, []);

  if (!overview) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      </View>
    );
  }

  const cards: Card[] = [
    { label: "Total Centres", value: overview.totalCentres },
    { label: "Total Farmers", value: overview.totalFarmers },
    { label: "Total Bookings", value: overview.totalBookings },
    { label: "Completed", value: overview.completedBookings },
    { label: "Currently Waiting", value: overview.currentlyWaiting },
    { label: "Avg Wait (min)", value: overview.averageWaitMinutes },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Overview ({staffName})</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate("AdminDrilldown")}>
            <Text style={styles.headerLink}>District → Centre →</Text>
          </Pressable>
          <Pressable onPress={logout}>
            <Text style={styles.headerLink}>Log out</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {cards.map((card) => (
          <View key={card.label} style={styles.card}>
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardLabel}>{card.label}</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
  headerActions: { flexDirection: "row", gap: spacing.lg },
  headerLink: { color: colors.primary, fontWeight: "700" },
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
    gap: spacing.xs,
  },
  cardValue: { fontSize: fontSize.display, fontWeight: "800", color: colors.primary },
  cardLabel: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center" },
});
