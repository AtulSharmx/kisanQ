import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { colors, fontSize, radius, shadow, spacing } from "../../../theme";
import { useFarmer } from "../../../context/FarmerContext";
import { listenInteropApplicationsForFarmer } from "../../../interop/interopFirestoreService";
import type { ApplicationStatus, InteropApplication } from "../../../types/interop";
import { ProcurementConnector, type LinkedProcurementSummary } from "../../../interop/connectors/ProcurementConnector";
import { generateCorrelationId } from "../../../interop/connectors/baseConnector";

type Props = NativeStackScreenProps<RootStackParamList, "MyApplications">;

function getStatusBadgeStyle(status: ApplicationStatus) {
  switch (status) {
    case "APPROVED":
      return { bg: "#E8F5E9", text: "#2E7D32", label: "Approved" };
    case "UNDER_REVIEW":
      return { bg: "#FFF8E1", text: "#F57F17", label: "Under Review" };
    case "PENDING":
      return { bg: "#E3F2FD", text: "#1565C0", label: "Pending" };
    case "REJECTED":
      return { bg: "#FFEBEE", text: "#C62828", label: "Rejected" };
    case "DOCUMENTS_REQUIRED":
      return { bg: "#EDE7F6", text: "#512DA8", label: "Docs Required" };
    default:
      return { bg: "#ECEFF1", text: "#37474F", label: status };
  }
}

export function MyApplicationsScreen({ navigation }: Props) {
  const { farmerId } = useFarmer();
  const [apps, setApps] = useState<(InteropApplication & { id: string })[]>([]);
  const [procurementSummary, setProcurementSummary] = useState<LinkedProcurementSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!farmerId) return;

    // 1. Listen to real-time status changes from interopApplications/
    const unsub = listenInteropApplicationsForFarmer(
      farmerId,
      (list) => {
        setApps(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    // 2. Fetch linked KisanQ procurement status (read-only)
    const procConnector = new ProcurementConnector();
    procConnector
      .getLinkedProcurementStatus(farmerId, generateCorrelationId())
      .then(setProcurementSummary)
      .catch(() => setProcurementSummary(null));

    return unsub;
  }, [farmerId]);

  return (
    <ScreenContainer showHome={true}>
      <Text style={styles.title}>Unified Application Tracking</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Section 1: Connected Government Schemes */}
          <Text style={styles.sectionTitle}>🏛️ Government Scheme Applications</Text>

          {apps.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No active scheme applications found.</Text>
            </View>
          ) : (
            apps.map((app) => {
              const badge = getStatusBadgeStyle(app.status);
              return (
                <View key={app.id || app.externalApplicationId} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.serviceName}>{app.service}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>● {badge.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.schemeName}>{app.schemeName}</Text>
                  <Text style={styles.appIdText}>Application ID: {app.externalApplicationId}</Text>
                  <Text style={styles.corrText}>Correlation ID: {app.correlationId}</Text>
                </View>
              );
            })
          )}

          {/* Section 2: Linked KisanQ Mandi Procurement */}
          <Text style={[styles.sectionTitle, styles.secMargin]}>🌾 KisanQ Mandi Procurement</Text>
          {procurementSummary && procurementSummary.hasBooking ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.serviceName}>KisanQ Procurement System</Text>
                <View style={[styles.badge, { backgroundColor: "#E8F5E9" }]}>
                  <Text style={[styles.badgeText, { color: "#2E7D32" }]}>
                    ● {procurementSummary.status?.toUpperCase() || "ACTIVE"}
                  </Text>
                </View>
              </View>
              <Text style={styles.schemeName}>Mandi Slot Procurement</Text>
              <Text style={styles.appIdText}>Token Number: {procurementSummary.tokenNumber}</Text>
              <Text style={styles.corrText}>Centre: {procurementSummary.centreName}</Text>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No active procurement booking in KisanQ.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.header,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.md,
  },
  loader: {
    marginTop: spacing.xl,
  },
  list: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.label,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  secMargin: {
    marginTop: spacing.md,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.body,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  schemeName: {
    fontSize: fontSize.label,
    fontWeight: "800",
    color: colors.text,
  },
  appIdText: {
    fontSize: fontSize.body,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 2,
  },
  corrText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
