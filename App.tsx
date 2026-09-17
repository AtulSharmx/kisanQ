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

  // A returning farmer stays logged in; only a fresh device sees registration.
  return <AppNavigator initialRouteName={farmer ? "Home" : "Splash"} />;
}

/**
 * Mounted inside OperatorProvider because the URL config depends on who is logged in.
 * The `key` remounts the container on a role change, so login/logout doesn't leave the previous
 * role's entries behind the Back button.
 */
function OperatorRoot() {
  const { session, initializing } = useOperator();
  const role = session?.role ?? null;

  // After a logout the address bar still shows the old role's screen. Rewrite it — but only if
  // the path really is unreachable, so a bookmarked /queue still opens the queue.
  useEffect(() => {
    if (initializing) return;
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    if (isPathForRole(window.location.pathname, role)) return;
    window.history.replaceState(null, "", homePathForRole(role));
  }, [initializing, role]);

  // Wait for the stored session. Mounting early means one render with role === null, which is
  // long enough to resolve /queue against the logged-out config and rewrite it to /login.
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

// The spec says operator and admin are the web build of this same codebase, so the platform is
// the switch — no mode-picker screen.
export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        {Platform.OS === "web" ? (
          <OperatorProvider>
            <OperatorRoot />
          </OperatorProvider>
        ) : (
          // No `linking` on native — no address bar, and Android's back button already works.
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
