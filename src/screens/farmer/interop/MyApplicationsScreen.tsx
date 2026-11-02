import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { colors, fontSize, radius, shadow, spacing } from "../../../theme";
import { useFarmer } from "../../../context/FarmerContext";
import { useLanguage } from "../../../context/LanguageContext";
import type { StringKey } from "../../../i18n/strings";
import { listenInteropApplicationsForFarmer } from "../../../interop/interopFirestoreService";
import type { ApplicationStatus, InteropApplication } from "../../../types/interop";
import { ProcurementConnector, type LinkedProcurementSummary } from "../../../interop/connectors/ProcurementConnector";
import { generateCorrelationId } from "../../../interop/connectors/baseConnector";

type Props = NativeStackScreenProps<RootStackParamList, "MyApplications">;

/**
 * Status chip colours come from the theme (green = settled, mustard = in progress, red =
 * refused, neutral = waiting) and every chip carries a word as well, never colour alone —
 * design principle 4.
 */
const STATUS_STYLE: Record<ApplicationStatus, { bg: string; text: string; labelKey: StringKey }> = {
  APPROVED: { bg: colors.primaryTint, text: colors.primary, labelKey: "appStatusApproved" },
  UNDER_REVIEW: { bg: colors.accentTint, text: colors.accent, labelKey: "appStatusUnderReview" },
  PENDING: { bg: colors.background, text: colors.textMuted, labelKey: "appStatusPending" },
  REJECTED: { bg: colors.errorTint, text: colors.error, labelKey: "appStatusRejected" },
  DOCUMENTS_REQUIRED: { bg: colors.accentTint, text: colors.accent, labelKey: "appStatusDocsRequired" },
};

export function MyApplicationsScreen({ navigation }: Props) {
  const { farmerId } = useFarmer();
  const { t } = useLanguage();
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
      <Text style={styles.title}>{t("myApplicationsTitle")}</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Section 1: Connected Government Schemes */}
          <Text style={styles.sectionTitle}>🏛️ {t("appsSchemeSection")}</Text>

          {apps.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{t("appsNoApps")}</Text>
            </View>
          ) : (
            apps.map((app) => {
              const badge = STATUS_STYLE[app.status] ?? STATUS_STYLE.PENDING;
              return (
                <View key={app.id || app.externalApplicationId} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.serviceName}>{app.service}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>
                        ● {t(badge.labelKey)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.schemeName}>{app.schemeName}</Text>
                  <Text style={styles.appIdText}>
                    {t("appsApplicationNumber")}: {app.externalApplicationId}
                  </Text>
                </View>
              );
            })
          )}

          {/* Section 2: Linked KisanQ Mandi Procurement */}
          <Text style={[styles.sectionTitle, styles.secMargin]}>🌾 {t("appsProcurementSection")}</Text>
          {procurementSummary && procurementSummary.hasBooking ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.serviceName}>{t("appsProcurementSection")}</Text>
                <View style={[styles.badge, { backgroundColor: colors.primaryTint }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    ● {t("consentStatusActive")}
                  </Text>
                </View>
              </View>
              <Text style={styles.schemeName}>{t("appsMandiSlot")}</Text>
              <Text style={styles.appIdText}>
                {t("operatorTokenLabel")}: {procurementSummary.tokenNumber}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{t("appsNoProcurement")}</Text>
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
