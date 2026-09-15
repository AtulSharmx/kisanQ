import React from "react";
import { StyleSheet, Text } from "react-native";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { AnimatedPressable } from "./AnimatedPressable";
import { colors, radius, shadow, touchTarget } from "../theme";

/** Persistent top-left home icon — always returns to the dashboard (UI/UX spec). */
export function HomeFab() {
  const navigation = useNavigation();

  return (
    <AnimatedPressable
      accessibilityLabel="Home"
      onPress={() =>
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Home" }] }))
      }
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>🏠</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    top: 12,
    left: 12,
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.fab,
    // See the note in HelpFab.tsx — elevation is Android's stacking order, not just a shadow.
    elevation: 8,
    zIndex: 10,
  },
  icon: { fontSize: 24 },
  pressed: { opacity: 0.7 },
});
