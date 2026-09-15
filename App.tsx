import React, { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LanguageProvider } from "./src/context/LanguageContext";
import { FarmerProvider, useFarmer } from "./src/context/FarmerContext";
import { OperatorProvider, useOperator } from "./src/context/OperatorContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { OperatorNavigator } from "./src/navigation/OperatorNavigator";
import {
  homePathForRole,
  isPathForRole,
  operatorLinking,
} from "./src/navigation/operatorLinking";
import { colors } from "./src/theme";

function FarmerRoot() {
  const { initializing, farmer } = useFarmer();

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Missing Details Polish sec. 5: a returning farmer stays logged in and skips straight to
  // the dashboard; only a fresh device goes through Aadhaar+OTP registration.
  return <AppNavigator initialRouteName={farmer ? "Home" : "Splash"} />;
}

/**
 * The web portal's NavigationContainer, mounted *inside* OperatorProvider so the URL routing
 * config can depend on who is logged in (see src/navigation/operatorLinking.ts for why it has to).
 * `key` remounts the container when the role changes, so logging in or out rebuilds the history
 * stack cleanly instead of leaving the previous role's entries behind the Back button.
 */
function OperatorRoot() {
  const { session, initializing } = useOperator();
  const role = session?.role ?? null;

  // A role change leaves the address bar showing the *old* role's screen (/queue after a logout,
  // say), which no longer matches anything rendered. Rewrite it to this role's home — but only
  // when the current path really isn't reachable, so an operator opening a bookmarked /queue
  // still lands on the queue rather than being bounced to check-in.
  useEffect(() => {
    if (initializing) return;
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    if (isPathForRole(window.location.pathname, role)) return;
    window.history.replaceState(null, "", homePathForRole(role));
  }, [initializing, role]);

  // Nothing is mounted until the stored session has been read back. Rendering the container
  // early would mount it once with role === null — long enough to resolve the URL against the
  // logged-out config and rewrite a perfectly good deep link (/queue) to /login before the real
  // role ever arrives.
  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer key={role ?? "anon"} linking={operatorLinking(role)}>
      <OperatorNavigator />
    </NavigationContainer>
  );
}

// Master Spec sec. 2: "Operator & Admin: Same Expo codebase, run as a web build" — running as
// web is exactly the signal used here to pick the Operator/Admin surface instead of the
// Farmer App, rather than adding a separate mode-switcher screen the docs never mention.
export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        {Platform.OS === "web" ? (
          <OperatorProvider>
            <OperatorRoot />
          </OperatorProvider>
        ) : (
          // No `linking` on native: the Farmer App has no address bar, and Android's hardware
          // back button already works off the same stack without one.
          <NavigationContainer>
            <FarmerProvider>
              <FarmerRoot />
            </FarmerProvider>
          </NavigationContainer>
        )}
      </LanguageProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});
