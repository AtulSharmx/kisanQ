import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useOperator } from "../../context/OperatorContext";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import type { Lang } from "../../i18n/strings";

type Props = NativeStackScreenProps<OperatorStackParamList, "OperatorSettings">;

// Same 12-language list as Admin/Farmer Settings.
const LANGUAGES: {
  code: Lang;
  labelKey:
    | "langHindi" | "langEnglish" | "langPunjabi" | "langBengali" | "langMarathi" | "langGujarati"
    | "langTelugu" | "langTamil" | "langKannada" | "langMalayalam" | "langOdia" | "langUrdu";
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

/**
 * Operator Settings — language switcher + logout, reached from the Scan/Check-in header. Same
 * shape as AdminSettingsScreen; kept as a separate screen (rather than one parameterized screen)
 * because the two land on different "back" destinations (ScanCheckIn vs AdminOverview) and live
 * in different navigator branches.
 */
export function OperatorSettingsScreen({ navigation }: Props) {
  const { t, lang, setLang } = useLanguage();
  const { staffName, logout } = useOperator();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setConfirmingLogout(false);
    setLoggingOut(true);
    await logout();
    // OperatorNavigator swaps to the StaffLogin tree on its own once session clears.
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t("adminSettingsLink")} ({staffName})
        </Text>
        <Pressable
          onPress={() => navigation.navigate("ScanCheckIn")}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.headerLink}>{t("operatorBackToCheckIn")}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
      </ScrollView>

      <ConfirmDialog
        visible={confirmingLogout}
        title={t("logoutConfirmTitle")}
        confirmLabel={t("logoutConfirmYes")}
        cancelLabel={t("cancelConfirmNo")}
        destructive
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={onLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
  headerLink: { color: colors.primary, fontWeight: "700" },
  content: { padding: spacing.lg, maxWidth: 480, width: "100%", alignSelf: "center" },
  sectionLabel: { fontSize: fontSize.body, color: colors.textMuted, marginBottom: spacing.sm },
  langCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
  spacer: { height: spacing.xl },
  pressed: { opacity: 0.7 },
});
