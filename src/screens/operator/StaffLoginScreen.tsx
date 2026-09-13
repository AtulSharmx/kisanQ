import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fontSize, radius, shadow, spacing, touchTarget } from "../../theme";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useOperator } from "../../context/OperatorContext";

/** Staff Login — UI/UX spec Operator screen 1. Staff ID + PIN, not Aadhaar-based. */
export function StaffLoginScreen() {
  const { login, loggingIn, loginError } = useOperator();
  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>KisanQ — Operator</Text>

        <Text style={styles.label}>Staff ID</Text>
        <TextInput
          value={staffId}
          onChangeText={setStaffId}
          placeholder="staff-op-1"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>PIN</Text>
        <TextInput
          value={pin}
          onChangeText={(v) => setPin(v.replace(/[^0-9]/g, "").slice(0, 6))}
          placeholder="••••"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          secureTextEntry
          style={styles.input}
        />

        {loginError && <Text style={styles.error}>{loginError}</Text>}

        <View style={styles.spacer} />
        <PrimaryButton
          label="लॉग इन करें (Log In)"
          onPress={() => login(staffId, pin)}
          disabled={!staffId || !pin}
          loading={loggingIn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadow.card,
  },
  title: {
    fontSize: fontSize.header,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  label: { fontSize: fontSize.body, color: colors.textMuted, marginBottom: spacing.xs },
  input: {
    minHeight: touchTarget,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.label,
    backgroundColor: colors.background,
    color: colors.text,
    marginBottom: spacing.md,
  },
  error: { color: colors.error, marginBottom: spacing.sm },
  spacer: { height: spacing.md },
});
