import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, shadow, spacing } from "../theme";

export interface OperatorHeaderAction {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

interface Props {
  title: string;
  staffName: string | null;
  actions: OperatorHeaderAction[];
}

/**
 * Shared Operator/Admin screen header — brand mark + app name/staff name on the left, icon
 * chip actions on the right. A single shared component so refining the header's look (shadow,
 * brand mark, chip styling) updates every Operator and Admin screen at once instead of each
 * screen rolling its own copy.
 */
export function OperatorHeader({ title, staffName, actions }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>🌾</Text>
        </View>
        <View>
          <Text style={styles.headerAppName}>KisanQ</Text>
          <Text style={styles.headerTitle}>{title}</Text>
          {staffName && <Text style={styles.headerStaffName}>{staffName}</Text>}
        </View>
      </View>
      <View style={styles.headerActions}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.headerChip,
              action.danger && styles.headerChipDanger,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.headerChipText, action.danger && styles.headerChipDangerText]}>
              {action.icon} {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    zIndex: 1,
    ...shadow.card,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: { fontSize: 20 },
  headerAppName: { fontSize: 12, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  headerTitle: { fontSize: fontSize.header, fontWeight: "800", color: colors.primary },
  headerStaffName: { fontSize: fontSize.body, color: colors.textMuted, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  headerChip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerChipDanger: { borderColor: colors.errorTint, backgroundColor: colors.errorTint },
  headerChipText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.body },
  headerChipDangerText: { color: colors.error },
  pressed: { opacity: 0.7 },
});
