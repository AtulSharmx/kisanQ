import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import {
  listenNotifications,
  markNotificationsRead,
  type NotificationWithId,
} from "../../services/firestoreService";
import type { NotificationType } from "../../types/firestore";

// Real-world metaphor icons per notification type (CLAUDE.md design principle), not text alone.
const ICONS: Record<NotificationType, string> = {
  day_before_reminder: "📅",
  near_slot_reminder: "⏰",
  delay_update: "⏳",
  call_next: "📣",
  weighing_recorded: "⚖️",
  quality_checked: "✅",
  payment_processing: "💰",
  payment_jform_generated: "📄",
  payment_sent: "🏦",
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
export function NotificationsScreen() {
  const { t, lang } = useLanguage();
  const { farmerId } = useFarmer();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationWithId[]>([]);
  // Which notifications were still unread when this screen was opened. They keep their
  // highlight for the whole visit even after being marked read in Firestore — otherwise
  // "what's new" would vanish from under the farmer the instant the write landed, which is
  // exactly the information they came to this screen for. Next visit they're plain.
  // State, not a ref, because it's read while rendering; the ref beside it is only a latch,
  // written and read inside the listener callback, so the capture happens on the first
  // snapshot only and later snapshots don't re-mark anything.
  const [unreadOnOpen, setUnreadOnOpen] = useState<Set<string>>(() => new Set());
  const captured = useRef(false);

  useEffect(() => {
    if (!farmerId) return;
    captured.current = false;
    const unsubscribe = listenNotifications(farmerId, (items) => {
      if (!captured.current) {
        captured.current = true;
        const unreadIds = items.filter((n) => n.status === "unread").map((n) => n.id);
        setUnreadOnOpen(new Set(unreadIds));
        // Fire-and-forget; markNotificationsRead swallows its own failures, and the listener
        // reports the new status whenever it lands.
        void markNotificationsRead(unreadIds);
      }
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
      {notifications.map((n) => {
        const unread = unreadOnOpen.has(n.id);
        return (
          <View key={n.id} style={[styles.card, unread && styles.cardUnread]}>
            <Text style={styles.icon}>{ICONS[n.type] ?? "🔔"}</Text>
            <View style={styles.textWrap}>
              <Text style={[styles.message, unread && styles.messageUnread]}>
                {/* Hindi `message` is the default (and the SMS text); English UI shows messageEn when the
                    notification has one. Other languages fall back to Hindi. */}
                {lang === "en" && n.messageEn ? n.messageEn : n.message}
              </Text>
              <Text style={styles.time}>{formatTime(n)}</Text>
            </View>
            {unread && <View style={styles.unreadDot} />}
          </View>
        );
      })}
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
