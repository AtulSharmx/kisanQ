import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../theme";

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
 * Shared Operator/Admin screen header — icon-labelled chip actions on the right, app name +
 * staff name on the left, matching AdminOverviewScreen/AdminDrilldownScreen's header exactly so
 * the whole staff-facing side of the app (not just Admin) has one consistent, non-basic-looking
 * chrome instead of every screen rolling its own plain-text-link header.
 */
export function OperatorHeader({ title, staffName, actions }: Props) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerAppName}>KisanQ — {title}</Text>
        {staffName && <Text style={styles.headerStaffName}>{staffName}</Text>}
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
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerAppName: { fontSize: fontSize.label, fontWeight: "800", color: colors.primary },
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
