import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { isValidAadhaar } from "../../services/mockAadhaar";

type Props = NativeStackScreenProps<RootStackParamList, "Aadhaar">;

/** Aadhaar entry — UI/UX spec screen 1. Mocked verification (CLAUDE.md rule: never real UIDAI). */
export function AadhaarEntryScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [aadhaar, setAadhaar] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onContinue = () => {
    if (!isValidAadhaar(aadhaar)) {
      setError(t("invalidAadhaar"));
      return;
    }
    setError(null);
    navigation.navigate("Otp", { aadhaar });
  };

  return (
    <ScreenContainer showHome={false}>
      <Text style={styles.title}>{t("aadhaarTitle")}</Text>
      <Text style={styles.hint}>{t("aadhaarHint")}</Text>

      <TextInput
        value={aadhaar}
        onChangeText={(v) => setAadhaar(v.replace(/[^0-9]/g, "").slice(0, 12))}
        placeholder={t("aadhaarPlaceholder")}
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={12}
        style={styles.input}
      />
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.spacer} />
      <PrimaryButton label={t("continueBtn")} onPress={onContinue} />
      <Text style={styles.mockNotice}>{t("mockNotice")}</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  hint: { fontSize: fontSize.body, color: colors.textMuted, marginBottom: spacing.lg },
  input: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.header,
    letterSpacing: 2,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  error: { color: colors.error, marginTop: spacing.sm, fontSize: fontSize.body },
  spacer: { height: spacing.xl },
  mockNotice: {
    marginTop: spacing.lg,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fontSize.body,
  },
});
