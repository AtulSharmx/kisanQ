import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CommonActions } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import type { Lang } from "../../i18n/strings";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

// Full supported-language list lives only here — SplashScreen (first-ever open) deliberately
// shows just Hindi/English. Keep in sync with the Lang union + language-name keys in
// i18n/strings.ts; don't add a code here without full translations for every string there.
const LANGUAGES: {
  code: Lang;
  labelKey:
    | "langHindi"
    | "langEnglish"
    | "langPunjabi"
    | "langBengali"
    | "langMarathi"
    | "langGujarati"
    | "langTelugu"
    | "langTamil"
    | "langKannada"
    | "langMalayalam"
    | "langOdia"
    | "langUrdu";
}[] = [
  { code: "hi", labelKey: "langHindi" },
  { code: "en", labelKey: "langEnglish" },
  { code: "pa", labelKey: "langPunjabi" },
  { code: "bn", labelKey: "langBengali" },
  { code: "mr", labelKey: "langMarathi" },
  { code: "gu", labelKey: "langGujarati" },
  { code: "te", labelKey: "langTelugu" },
  { code: "ta", labelKey: "langTamil" },
  { code: "kn", labelKey: "langKannada" },
  { code: "ml", labelKey: "langMalayalam" },
  { code: "or", labelKey: "langOdia" },
  { code: "ur", labelKey: "langUrdu" },
];

/** Settings — language switcher + logout (Missing Details Polish sec. 5's "explicit logout"). */
export function SettingsScreen({ navigation }: Props) {
  const { t, lang, setLang } = useLanguage();
  const { logout } = useFarmer();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setConfirmingLogout(false);
    setLoggingOut(true);
    await logout();
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Splash" }] }));
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>{t("settingsTitle")}</Text>

      <Text style={styles.sectionLabel}>{t("changeLanguageLabel")}</Text>
      <View style={styles.langCard}>
        {LANGUAGES.map((option) => (
          <Pressable
            key={option.code}
            onPress={() => setLang(option.code)}
            style={({ pressed }) => [
              styles.langRow,
              lang === option.code && styles.langRowActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.langRowText}>
              {lang === option.code ? "✓ " : ""}
              {t(option.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.spacer} />
      <PrimaryButton
        label={t("logoutBtn")}
        onPress={() => setConfirmingLogout(true)}
        variant="danger"
        loading={loggingOut}
      />

      <ConfirmDialog
        visible={confirmingLogout}
        title={t("logoutConfirmTitle")}
        confirmLabel={t("logoutConfirmYes")}
        cancelLabel={t("cancelConfirmNo")}
        destructive
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={onLogout}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.lg },
  sectionLabel: { fontSize: fontSize.body, color: colors.textMuted, marginBottom: spacing.sm },
  langCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    overflow: "hidden",
    ...shadow.card,
  },
  langRow: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  langRowActive: { backgroundColor: colors.primaryTint },
  langRowText: { fontSize: fontSize.label, fontWeight: "700", color: colors.text },
  spacer: { height: spacing.md },
  pressed: { opacity: 0.7 },
});
