import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { colors, radius, touchTarget } from "../theme";

/** Persistent top-left home icon — always returns to the dashboard (UI/UX spec). */
export function HomeFab() {
  const navigation = useNavigation();

  return (
    <Pressable
      accessibilityLabel="Home"
      onPress={() =>
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Home" }] }))
      }
      style={styles.fab}
    >
      <Text style={styles.icon}>🏠</Text>
    </Pressable>
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
    elevation: 2,
  },
  icon: { fontSize: 22 },
});
