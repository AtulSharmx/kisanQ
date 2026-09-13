import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../theme";

interface Props {
  icon: string;
  label: string;
  tone: "success" | "warning" | "error" | "neutral";
}

/** Icon + text status — colour is never the only signal (UI/UX spec principle 4). */
export function StatusBadge({ icon, label, tone }: Props) {
  return (
    <View style={[styles.badge, toneStyles[tone]]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, tone === "error" && styles.errorLabel]}>{label}</Text>
    </View>
  );
}

const toneStyles = StyleSheet.create({
  success: { backgroundColor: "#E7F3EC", borderColor: colors.primary },
  warning: { backgroundColor: "#FBF1DC", borderColor: colors.accent },
  error: { backgroundColor: "#FBEAE8", borderColor: colors.error },
  neutral: { backgroundColor: colors.background, borderColor: colors.border },
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  icon: { fontSize: fontSize.body },
  label: { fontSize: fontSize.body, fontWeight: "700", color: colors.text },
  errorLabel: { color: colors.error },
});
