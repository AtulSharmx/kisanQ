import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../theme";

interface Props {
  visible: boolean;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A custom confirm dialog, not React Native's `Alert.alert` — react-native-web's Alert.alert
 * is a total no-op stub (see node_modules/react-native-web/src/exports/Alert/index.js), so
 * anything relying on it silently does nothing on the Operator's web build. This is used for
 * every "confirm before anything irreversible" moment (UI/UX spec principle 9) that needs to
 * work on both platforms.
 */
export function ConfirmDialog({
  visible,
  title,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.buttons}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, destructive ? styles.destructiveButton : styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: { fontSize: fontSize.label, fontWeight: "700", color: colors.text, textAlign: "center" },
  buttons: { flexDirection: "row", gap: spacing.md },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.text, fontWeight: "700" },
  confirmButton: { backgroundColor: colors.primary },
  destructiveButton: { backgroundColor: colors.error },
  confirmText: { color: colors.white, fontWeight: "700" },
});
