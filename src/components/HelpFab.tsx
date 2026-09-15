import React from "react";
import { Alert, Linking, StyleSheet, Text } from "react-native";
import { AnimatedPressable } from "./AnimatedPressable";
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
    <AnimatedPressable
      accessibilityLabel={t("homeHelp")}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>📞</Text>
    </AnimatedPressable>
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
    // shadow.fab's elevation (4) is a *depth* cue, and on Android it doubles as the stacking
    // order — a raised card further down the tree can end up painted over the FAB even though
    // the FAB comes later in the JSX. Pin both FABs above anything a screen renders so "visible
    // on every screen" holds however a screen is built.
    elevation: 8,
    zIndex: 10,
  },
  icon: { fontSize: 24 },
  pressed: { opacity: 0.7 },
});
