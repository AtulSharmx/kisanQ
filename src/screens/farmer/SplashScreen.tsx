import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, spacing, touchTarget } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

/** Splash + Language Select — UI/UX spec screen 0. No text entry, just tap to choose. */
export function SplashScreen({ navigation }: Props) {
  const { setLang, t } = useLanguage();

  const choose = (lang: "hi" | "en") => {
    setLang(lang);
    navigation.replace("Aadhaar");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🌾</Text>
      <Text style={styles.appName}>{t("appName")}</Text>
      <Text style={styles.title}>{t("langSelectTitle")}</Text>
      <View style={styles.buttons}>
        <Pressable style={styles.langBtn} onPress={() => choose("hi")}>
          <Text style={styles.langLabel}>हिंदी</Text>
        </Pressable>
        <Pressable style={styles.langBtn} onPress={() => choose("en")}>
          <Text style={styles.langLabel}>English</Text>
        </Pressable>
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
});
