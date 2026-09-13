import React from "react";
import { Alert, Linking, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, shadow, touchTarget } from "../theme";
import { useLanguage } from "../context/LanguageContext";

/**
 * Persistent bottom-right help button — "one-tap connect to a human" (UI/UX spec principle
 * 10). Opens the phone dialer on the Kisan Call Centre number the Winning Strategy doc cites
 * as the already-trusted channel to model help access on (1800-180-1551); it does not place
 * the call itself, just opens the dialer for the farmer to confirm.
 */
export function HelpFab() {
  const { t } = useLanguage();

  const onPress = () => {
    const number = "18001801551";
    Linking.openURL(`tel:${number}`).catch(() =>
      Alert.alert(t("homeHelp"), number)
    );
  };

  return (
    <Pressable
      accessibilityLabel={t("homeHelp")}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>📞</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 20,
    right: 16,
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.fab,
  },
  icon: { fontSize: 24 },
  pressed: { opacity: 0.7 },
});
