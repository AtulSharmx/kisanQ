import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, spacing, touchTarget } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { HelpFab } from "../../components/HelpFab";
import type { Lang } from "../../i18n/strings";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

/**
 * Splash + Language Select — UI/UX spec screen 0. No text entry, just tap to choose.
 * Deliberately only Hindi/English here (a farmer's very first tap on the app) — every other
 * supported language is one tap away in Settings once they're past registration. See
 * i18n/strings.ts's top-of-file comment for the full language list and why.
 *
 * This is the one farmer screen that doesn't use ScreenContainer — it's centred on the logo and
 * has no Home FAB to return to — so the Help button it would otherwise inherit is mounted by
 * hand. "A visible Help/Call option on every screen" has no exception for the first one; a farmer
 * who can't get past language select is exactly the one who needs the call centre.
 */
export function SplashScreen({ navigation }: Props) {
  const { setLang, t } = useLanguage();

  const choose = (lang: Lang) => {
    setLang(lang);
    navigation.replace("Aadhaar");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Text style={styles.logo}>🌾</Text>
        <Text style={styles.appName}>{t("appName")}</Text>
        <Text style={styles.title}>{t("langSelectTitle")}</Text>
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [styles.langBtn, pressed && styles.pressed]}
            onPress={() => choose("hi")}
          >
            <Text style={styles.langLabel}>{t("langHindi")}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.langBtn, pressed && styles.pressed]}
            onPress={() => choose("en")}
          >
            <Text style={styles.langLabel}>{t("langEnglish")}</Text>
          </Pressable>
        </View>
      </View>
      <HelpFab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  logo: { fontSize: 72, marginBottom: spacing.sm },
  appName: { fontSize: fontSize.display, fontWeight: "800", color: colors.primary },
  title: { fontSize: fontSize.header, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.lg },
  buttons: { width: "100%", gap: spacing.md },
  langBtn: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  langLabel: { color: colors.white, fontSize: fontSize.header, fontWeight: "700" },
  pressed: { opacity: 0.7 },
});
