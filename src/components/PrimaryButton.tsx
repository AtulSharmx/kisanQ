import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSize, radius, spacing, touchTarget } from "../theme";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "danger" | "outline";
}

export function PrimaryButton({ label, onPress, disabled, loading, variant = "primary" }: Props) {
  const isOutline = variant === "outline";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "danger" && styles.danger,
        isOutline && styles.outline,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.label, isOutline && styles.outlineLabel]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.error },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  label: {
    color: colors.white,
    fontSize: fontSize.label,
    fontWeight: "700",
  },
  outlineLabel: { color: colors.primary },
});
