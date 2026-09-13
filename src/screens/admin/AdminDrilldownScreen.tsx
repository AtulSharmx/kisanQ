import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, spacing } from "../../theme";
import { useOperator } from "../../context/OperatorContext";
import {
  getAdminCentreBreakdown,
  OVERLOAD_THRESHOLD_PCT,
  type CentreBreakdown,
} from "../../services/firestoreService";

type Props = NativeStackScreenProps<OperatorStackParamList, "AdminDrilldown">;

/**
 * District -> Centre Drill-down — UI/UX spec Admin screen 2. A table grouped by district
 * (rather than a separate district-picker step) since the underlying data is small enough at
 * demo scale to just show everything at once. Overloaded threshold isn't given a specific
 * number in the docs ("above a threshold") — OVERLOAD_THRESHOLD_PCT (80%) is a documented
 * choice, not a spec value.
 */
export function AdminDrilldownScreen({ navigation }: Props) {
  const { staffName } = useOperator();
  const [rows, setRows] = useState<CentreBreakdown[] | null>(null);

  useEffect(() => {
    getAdminCentreBreakdown().then(setRows);
  }, []);

  const byDistrict = useMemo(() => {
    if (!rows) return [];
    const groups = new Map<string, CentreBreakdown[]>();
    for (const row of rows) {
      const list = groups.get(row.centre.district) ?? [];
      list.push(row);
      groups.set(row.centre.district, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>District → Centre ({staffName})</Text>
        <Pressable onPress={() => navigation.navigate("AdminOverview")}>
          <Text style={styles.headerLink}>← Overview</Text>
        </Pressable>
      </View>

      {!rows ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCell, styles.centreCol]}>Centre</Text>
            <Text style={styles.headerCell}>Bookings</Text>
            <Text style={styles.headerCell}>Completed</Text>
            <Text style={styles.headerCell}>Waiting</Text>
            <Text style={styles.headerCell}>Avg Wait</Text>
            <Text style={styles.headerCell}>Utilization</Text>
          </View>

          {byDistrict.map(([district, centres]) => (
            <View key={district} style={styles.districtGroup}>
              <Text style={styles.districtLabel}>{district}</Text>
              {centres.map((row) => (
                <View key={row.centre.id} style={styles.row}>
                  <Text style={[styles.cell, styles.centreCol, styles.centreName]}>
                    {row.centre.name}
                  </Text>
                  <Text style={styles.cell}>{row.bookings}</Text>
                  <Text style={styles.cell}>{row.completed}</Text>
                  <Text style={styles.cell}>{row.waiting}</Text>
                  <Text style={styles.cell}>{row.averageWaitMinutes}m</Text>
                  <Text style={[styles.cell, row.overloaded && styles.overloadedText]}>
                    {row.utilizationPct}% {row.overloaded ? "⚠️" : ""}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          <Text style={styles.footnote}>
            ⚠️ = utilization above {OVERLOAD_THRESHOLD_PCT}% of daily capacity
          </Text>
        </ScrollView>
      )}
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
  headerLink: { color: colors.primary, fontWeight: "700" },
  content: { padding: spacing.lg, maxWidth: 800, width: "100%", alignSelf: "center" },
  tableHeaderRow: {
    flexDirection: "row",
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  headerCell: { flex: 1, fontWeight: "800", color: colors.textMuted, fontSize: fontSize.body },
  centreCol: { flex: 2 },
  districtGroup: { marginTop: spacing.lg },
  districtLabel: {
    fontSize: fontSize.label,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cell: { flex: 1, color: colors.text, fontSize: fontSize.body },
  centreName: { fontWeight: "700" },
  overloadedText: { color: colors.error, fontWeight: "700" },
  footnote: { marginTop: spacing.lg, color: colors.textMuted, fontSize: fontSize.body },
});
