import React from "react";
import { Alert, Linking, StyleSheet, Text } from "react-native";
import { AnimatedPressable } from "./AnimatedPressable";
import { colors, radius, shadow, touchTarget } from "../theme";
import { useLanguage } from "../context/LanguageContext";

/**
 * One-tap connection to a human. Opens the dialer on the Kisan Call Centre number
 * (1800-180-1551) rather than placing the call, so the farmer confirms it.
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
    // On Android elevation doubles as stacking order, so a raised card can paint over the
    // FAB even though the FAB comes later in the JSX. Pin both above whatever a screen draws.
    elevation: 8,
    zIndex: 10,
  },
  icon: { fontSize: 24 },
  pressed: { opacity: 0.7 },
});
