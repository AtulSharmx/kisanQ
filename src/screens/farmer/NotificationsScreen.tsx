import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import {
  listenNotifications,
  type NotificationWithId,
} from "../../services/firestoreService";
import type { NotificationType } from "../../types/firestore";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

// Real-world metaphor icons per notification type (CLAUDE.md design principle), not text alone.
const ICONS: Record<NotificationType, string> = {
  day_before_reminder: "📅",
  near_slot_reminder: "⏰",
  delay_update: "⏳",
  call_next: "📣",
  weighing_recorded: "⚖️",
  quality_checked: "✅",
  payment_processing: "💰",
  payment_completed: "💰",
};

function formatTime(notification: NotificationWithId): string {
  // createdAt is a Firestore server Timestamp once synced; briefly undefined for a notification
  // written moments ago and not yet round-tripped from the server (serverTimestamp() resolves
  // async) — fall back to blank rather than crashing on .toDate() of an unset value.
  const value = notification.createdAt as unknown as { toDate?: () => Date } | undefined;
  if (!value?.toDate) return "";
  return value.toDate().toLocaleString();
}

/**
 * Notifications — real-time listener on notifications/{farmerId}, same pattern as the Live
 * Queue screen's listenQueueForCentre(). Every weighing/quality-check/call-next write the
 * operator makes now actually reaches this screen, not just a Firestore document nobody reads
 * (the collection was previously write-only from the farmer's side).
 */
export function NotificationsScreen({}: Props) {
  const { t } = useLanguage();
  const { farmerId } = useFarmer();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationWithId[]>([]);

  useEffect(() => {
    if (!farmerId) return;
    const unsubscribe = listenNotifications(farmerId, (items) => {
      setNotifications(items);
      setLoading(false);
    });
    return unsubscribe;
  }, [farmerId]);

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (notifications.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyBody}>{t("emptyNotifications")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>{t("homeNotifications")}</Text>
      {notifications.map((n) => (
        <View
          key={n.id}
          style={[styles.card, n.status === "unread" && styles.cardUnread]}
        >
          <Text style={styles.icon}>{ICONS[n.type] ?? "🔔"}</Text>
          <View style={styles.textWrap}>
            <Text style={[styles.message, n.status === "unread" && styles.messageUnread]}>
              {n.message}
            </Text>
            <Text style={styles.time}>{formatTime(n)}</Text>
          </View>
          {n.status === "unread" && <View style={styles.unreadDot} />}
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  cardUnread: { borderColor: colors.primary },
  icon: { fontSize: 24 },
  textWrap: { flex: 1, gap: spacing.xs },
  message: { fontSize: fontSize.body, color: colors.text },
  messageUnread: { fontWeight: "700" },
  time: { fontSize: fontSize.body, color: colors.textMuted },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    marginTop: spacing.xs,
  },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyBody: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center" },
});
