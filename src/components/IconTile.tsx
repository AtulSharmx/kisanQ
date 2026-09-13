import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSize, radius, spacing, touchTarget } from "../theme";

interface Props {
  icon: string;
  label: string;
  onPress: () => void;
}

/** Large icon + one-word label tile — Home Dashboard grid (UI/UX spec section 5). */
export function IconTile({ icon, label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: "47%",
    minHeight: touchTarget * 1.6,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  pressed: { opacity: 0.7, backgroundColor: colors.background },
  icon: { fontSize: 34 },
  label: {
    fontSize: fontSize.body,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
});
