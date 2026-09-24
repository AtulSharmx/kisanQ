import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, shadow, spacing } from "../theme";

interface Props {
  icon: string;
  value: number | string;
  label: string;
  tone?: "primary" | "accent";
}

/** Dashboard stat card — icon in a colour-washed circle badge, large value, muted label. */
export function StatCard({ icon, value, label, tone = "primary" }: Props) {
  const isAccent = tone === "accent";
  return (
    <View style={styles.card}>
      <View style={[styles.badge, isAccent && styles.badgeAccent]}>
        <Text style={styles.badgeIcon}>{icon}</Text>
      </View>
      <Text style={[styles.value, isAccent && styles.valueAccent]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "31%",
    minWidth: 160,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
    ...shadow.card,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  badgeAccent: { backgroundColor: colors.accentTint },
  badgeIcon: { fontSize: 26 },
  value: { fontSize: fontSize.display, fontWeight: "800", color: colors.primary },
  valueAccent: { color: colors.accent },
  label: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center" },
});
