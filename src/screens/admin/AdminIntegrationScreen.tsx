import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { useOperator } from "../../context/OperatorContext";
import { useLanguage } from "../../context/LanguageContext";
import { OperatorHeader } from "../../components/OperatorHeader";
import type { StringKey } from "../../i18n/strings";
import {
  advanceMockGovApplicationStatus,
  listenAuditLogs,
  listenMockGovApplications,
} from "../../interop/interopFirestoreService";
import type { AuditLog, MockGovSchemeApplication } from "../../types/interop";

type Props = NativeStackScreenProps<OperatorStackParamList, "AdminIntegration">;

type Health = "HEALTHY" | "DEGRADED" | "DOWN";

interface DerivedSystemStats {
  serviceName: string;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  health: Health;
}

const HEALTH_LABEL: Record<Health, StringKey> = {
  HEALTHY: "adminHealthHealthy",
  DEGRADED: "adminHealthDegraded",
  DOWN: "adminHealthDown",
};

/** Theme tones, and always paired with a word — never colour alone (design principle 4). */
const HEALTH_TONE: Record<Health, { bg: string; text: string }> = {
  HEALTHY: { bg: colors.primaryTint, text: colors.primary },
  DEGRADED: { bg: colors.accentTint, text: colors.accent },
  DOWN: { bg: colors.errorTint, text: colors.error },
};

export function AdminIntegrationScreen({ navigation }: Props) {
  const { staffName } = useOperator();
  const { t } = useLanguage();
  const [logs, setLogs] = useState<(AuditLog & { id: string })[]>([]);
  const [mockApps, setMockApps] = useState<(MockGovSchemeApplication & { id: string })[]>([]);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubLogs = listenAuditLogs(setLogs);
    const unsubApps = listenMockGovApplications(setMockApps);
    return () => {
      unsubLogs();
      unsubApps();
    };
  }, []);

  // Derive system statistics client-side from audit logs (no counter conflicts!)
  const deriveSystemStats = (): DerivedSystemStats[] => {
    const services = ["Farmer Registry", "Scheme Portal", "Procurement System"];
    return services.map((serviceName) => {
      const serviceLogs = logs.filter((l) => l.requestingService === serviceName);
      // One "request" is an attempt: the first API_REQUEST plus any RETRY. Successes and
      // failures are counted over the *same* set of events, not over every log line for the
      // service — mixing the two denominators let a failure ratio exceed 1 as soon as a
      // consent event (which is not an attempt) landed in the log.
      const attempts = serviceLogs.filter(
        (l) => l.eventType === "API_REQUEST" || l.eventType === "RETRY" ||
               l.eventType === "API_RESPONSE" || l.eventType === "API_FAILURE"
      );
      const totalRequests = attempts.filter(
        (l) => l.eventType === "API_REQUEST" || l.eventType === "RETRY"
      ).length;
      const successCount = attempts.filter((l) => l.result === "SUCCESS").length;
      const failureCount = attempts.filter((l) => l.result === "FAILURE").length;

      let health: Health = "HEALTHY";
      if (totalRequests > 0) {
        const failureRatio = failureCount / totalRequests;
        if (failureRatio >= 0.3) health = "DOWN";
        else if (failureRatio >= 0.1) health = "DEGRADED";
      }

      return { serviceName, totalRequests, successCount, failureCount, health };
    });
  };

  const systemStats = deriveSystemStats();

  const onAdvanceStatus = async (app: MockGovSchemeApplication & { id: string }) => {
    setAdvancingId(app.id);
    try {
      await advanceMockGovApplicationStatus(
        app.id,
        app.externalApplicationId,
        app.farmerId,
        app.schemeName,
        app.status
      );
    } catch (err) {
      console.error("Failed to advance status:", err);
    } finally {
      setAdvancingId(null);
    }
  };

  return (
    <View style={styles.screen}>
      <OperatorHeader
        title={t("adminIntegrationTitle")}
        staffName={staffName}
        actions={[
          {
            icon: "←",
            label: t("backToOverview"),
            onPress: () => navigation.navigate("AdminOverview"),
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner */}
        <View style={styles.protoBanner}>
          <Text style={styles.protoBannerTitle}>{t("govPrototypeNotice")}</Text>
          <Text style={styles.protoBannerDesc}>{t("adminIntegrationBannerDesc")}</Text>
        </View>

        {/* Section 1: Connected Systems Health */}
        <Text style={styles.sectionTitle}>🔗 {t("adminConnectedSystems")}</Text>
        <View style={styles.systemsGrid}>
          {systemStats.map((sys) => (
            <View key={sys.serviceName} style={styles.sysCard}>
              <View style={styles.sysCardHeader}>
                <Text style={styles.sysName}>{sys.serviceName}</Text>
                <View
                  style={[styles.healthChip, { backgroundColor: HEALTH_TONE[sys.health].bg }]}
                >
                  <Text style={[styles.healthChipText, { color: HEALTH_TONE[sys.health].text }]}>
                    ● {t(HEALTH_LABEL[sys.health])}
                  </Text>
                </View>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t("adminTotalRequests")}</Text>
                <Text style={styles.statVal}>{sys.totalRequests}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t("adminSuccessful")}</Text>
                <Text style={[styles.statVal, { color: colors.primary }]}>{sys.successCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t("adminFailed")}</Text>
                <Text style={[styles.statVal, { color: colors.error }]}>{sys.failureCount}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section 2: Active Demo Applications (Cross-runtime Synchronization) */}
        <Text style={[styles.sectionTitle, styles.secMargin]}>⚡ {t("adminDemoControl")}</Text>
        <Text style={styles.subHint}>{t("adminDemoControlHint")}</Text>

        {mockApps.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t("adminNoGovApps")}</Text>
          </View>
        ) : (
          <View style={styles.appsList}>
            {mockApps.map((app) => (
              <View key={app.id} style={styles.appCard}>
                <View style={styles.appHeader}>
                  <View>
                    <Text style={styles.appFarmer}>{app.farmerName || "Farmer"} ({app.farmerDistrict})</Text>
                    <Text style={styles.appScheme}>{app.schemeName}</Text>
                    <Text style={styles.appId}>ID: {app.externalApplicationId}</Text>
                  </View>

                  <View style={styles.appStatusBox}>
                    <Text style={styles.statusCurrent}>{app.status}</Text>
                    {app.status !== "APPROVED" && (
                      <Pressable
                        style={({ pressed }) => [styles.advanceBtn, pressed && styles.pressed]}
                        onPress={() => onAdvanceStatus(app)}
                        disabled={advancingId === app.id}
                      >
                        {advancingId === app.id ? (
                          <ActivityIndicator color={colors.white} size="small" />
                        ) : (
                          <Text style={styles.advanceBtnText}>{t("adminAdvanceStatusBtn")}</Text>
                        )}
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Section 3: Interoperability Audit Log */}
        <Text style={[styles.sectionTitle, styles.secMargin]}>📜 {t("adminAuditLog")}</Text>
        <View style={styles.logTable}>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>{t("adminNoAuditEntries")}</Text>
          ) : (
            logs.slice(0, 20).map((log) => (
              <View key={log.id} style={styles.logRow}>
                <Text style={styles.logCorr}>{log.correlationId}</Text>
                <Text style={styles.logEvent}>{log.eventType}</Text>
                <Text style={styles.logService}>{log.requestingService}</Text>
                <View
                  style={[
                    styles.logResChip,
                    {
                      backgroundColor:
                        log.result === "SUCCESS" ? colors.primaryTint : colors.errorTint,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.logResText,
                      { color: log.result === "SUCCESS" ? colors.primary : colors.error },
                    ]}
                  >
                    {log.result}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
    gap: spacing.md,
  },
  protoBanner: {
    backgroundColor: colors.accentTint,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  protoBannerTitle: { fontSize: fontSize.label, fontWeight: "800", color: colors.text, marginBottom: 2 },
  protoBannerDesc: { fontSize: 13, color: colors.textMuted },
  sectionTitle: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
  secMargin: { marginTop: spacing.md },
  subHint: { fontSize: 13, color: colors.textMuted, marginTop: -spacing.xs, marginBottom: spacing.xs },
  systemsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  sysCard: {
    flexBasis: "31%",
    minWidth: 240,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
    gap: 4,
  },
  sysCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  sysName: { fontSize: fontSize.body, fontWeight: "800", color: colors.text },
  healthChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  healthChipText: { fontSize: 11, fontWeight: "800" },
  statRow: { flexDirection: "row", justifyContent: "space-between" },
  statLabel: { fontSize: 13, color: colors.textMuted },
  statVal: { fontSize: 13, fontWeight: "700", color: colors.text },
  emptyCard: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  emptyText: { color: colors.textMuted, fontSize: fontSize.body },
  appsList: { gap: spacing.sm },
  appCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  appHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  appFarmer: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
  appScheme: { fontSize: fontSize.body, fontWeight: "700", color: colors.primary },
  appId: { fontSize: 12, color: colors.textMuted },
  appStatusBox: { alignItems: "flex-end", gap: 6 },
  statusCurrent: { fontSize: 13, fontWeight: "700", color: colors.text },
  advanceBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  advanceBtnText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  logTable: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, gap: 4 },
  logRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.background },
  logCorr: { fontSize: 12, fontWeight: "700", color: colors.textMuted, width: 140 },
  logEvent: { fontSize: 12, fontWeight: "700", color: colors.primary, width: 160 },
  logService: { fontSize: 12, color: colors.text, flex: 1 },
  logResChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  logResText: { fontSize: 11, fontWeight: "800" },
  pressed: { opacity: 0.7 },
});
