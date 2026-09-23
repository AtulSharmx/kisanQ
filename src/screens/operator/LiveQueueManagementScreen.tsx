import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, spacing } from "../../theme";
import { PrimaryButton } from "../../components/PrimaryButton";
import { OperatorHeader } from "../../components/OperatorHeader";
import { useLanguage } from "../../context/LanguageContext";
import { useOperator } from "../../context/OperatorContext";
import {
  callNextInQueue,
  getBooking,
  getFarmer,
  listenQueueForCentre,
  type QueueEntryWithId,
} from "../../services/firestoreService";
import type { QueueStatus } from "../../types/firestore";
import type { StringKey } from "../../i18n/strings";

type Props = NativeStackScreenProps<OperatorStackParamList, "LiveQueueManagement">;

interface Row {
  queue: QueueEntryWithId;
  tokenNumber: string;
  farmerName: string;
  farmerId: string;
}

/**
 * Live Queue Management — UI/UX spec Operator screen 3: "this screen powers the farmer's Live
 * Queue screen — most important operator screen." Real-time via onSnapshot.
 */
export function LiveQueueManagementScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { session, staffName } = useOperator();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<QueueStatus>("waiting");
  const [callingId, setCallingId] = useState<string | null>(null);
  const detailsCache = useRef(
    new Map<string, { tokenNumber: string; farmerName: string; farmerId: string }>()
  );

  const TABS: { key: QueueStatus; labelKey: StringKey }[] = [
    { key: "waiting", labelKey: "operatorTabWaiting" },
    { key: "processing", labelKey: "operatorTabProcessing" },
    { key: "completed", labelKey: "operatorTabCompleted" },
  ];

  useEffect(() => {
    if (!session?.assignedCentreId) return;
    const unsubscribe = listenQueueForCentre(session.assignedCentreId, async (entries) => {
      const withDetails = await Promise.all(
        entries.map(async (queue) => {
          const cached = detailsCache.current.get(queue.bookingId);
          if (cached) return { queue, ...cached };
          const booking = await getBooking(queue.bookingId);
          if (!booking) return { queue, tokenNumber: "?", farmerName: "?", farmerId: "" };
          const farmer = await getFarmer(booking.farmerId);
          const details = {
            tokenNumber: booking.tokenNumber,
            farmerName: farmer?.name ?? "?",
            farmerId: booking.farmerId,
          };
          detailsCache.current.set(queue.bookingId, details);
          return { queue, ...details };
        })
      );
      setRows(withDetails);
      setLoading(false);
    });
    return unsubscribe;
  }, [session?.assignedCentreId]);

  const visibleRows = useMemo(
    () =>
      rows
        .filter((r) => r.queue.status === activeTab)
        // Arrival order — the same order the farmer's own Live Queue screen counts "people ahead" in.
        .sort((a, b) => a.queue.position - b.queue.position),
    [rows, activeTab]
  );

  const onCallNext = async (queueId: string) => {
    setCallingId(queueId);
    try {
      await callNextInQueue(queueId);
    } catch (e) {
      console.error(e);
    } finally {
      setCallingId(null);
    }
  };

  return (
    <View style={styles.screen}>
      <OperatorHeader
        title={t("operatorLiveQueueTitle")}
        staffName={staffName}
        actions={[
          {
            icon: "←",
            label: t("operatorBackToCheckIn").replace("← ", ""),
            onPress: () => navigation.navigate("ScanCheckIn"),
          },
          {
            icon: "⚙️",
            label: t("adminSettingsLink"),
            onPress: () => navigation.navigate("OperatorSettings"),
          },
        ]}
      />

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              activeTab === tab.key && styles.tabActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {t(tab.labelKey)} ({rows.filter((r) => r.queue.status === tab.key).length})
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {loading && <ActivityIndicator color={colors.primary} style={styles.loader} />}
        {!loading && visibleRows.length === 0 && (
          <Text style={styles.empty}>{t("operatorNoEntries")}</Text>
        )}
        {visibleRows.map((row) => (
          <View key={row.queue.id} style={styles.row}>
            <View>
              <Text style={styles.token}>{row.tokenNumber}</Text>
              <Text style={styles.name}>{row.farmerName}</Text>
              <Text style={styles.wait}>
                {t("operatorEstWaitPrefix")}: {row.queue.estimatedWaitMinutes} {t("minutes")}
              </Text>
            </View>
            {row.queue.status === "waiting" && (
              <PrimaryButton
                label={t("operatorCallNextBtn")}
                onPress={() => onCallNext(row.queue.id)}
                loading={callingId === row.queue.id}
              />
            )}
            {row.queue.status === "processing" && (
              <PrimaryButton
                label={t("operatorWeighBtn")}
                onPress={() =>
                  navigation.navigate("Weighing", {
                    bookingId: row.queue.bookingId,
                    queueId: row.queue.id,
                    farmerId: row.farmerId,
                  })
                }
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: "row", padding: spacing.sm, gap: spacing.sm },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabLabel: { color: colors.text, fontWeight: "700", fontSize: fontSize.body },
  tabLabelActive: { color: colors.white },
  list: { padding: spacing.lg, gap: spacing.md, maxWidth: 640, width: "100%", alignSelf: "center" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  token: { fontSize: fontSize.label, fontWeight: "800", color: colors.primary },
  name: { fontSize: fontSize.body, color: colors.text },
  wait: { fontSize: fontSize.body, color: colors.textMuted },
  pressed: { opacity: 0.7 },
  loader: { marginTop: spacing.xl },
});
