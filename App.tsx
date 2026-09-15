import React from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LanguageProvider } from "./src/context/LanguageContext";
import { FarmerProvider, useFarmer } from "./src/context/FarmerContext";
import { OperatorProvider } from "./src/context/OperatorContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { OperatorNavigator } from "./src/navigation/OperatorNavigator";
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

// Master Spec sec. 2: "Operator & Admin: Same Expo codebase, run as a web build" — running as
// web is exactly the signal used here to pick the Operator/Admin surface instead of the
// Farmer App, rather than adding a separate mode-switcher screen the docs never mention.
export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <NavigationContainer>
          {Platform.OS === "web" ? (
            <OperatorProvider>
              <OperatorNavigator />
            </OperatorProvider>
          ) : (
            <FarmerProvider>
              <FarmerRoot />
            </FarmerProvider>
          )}
        </NavigationContainer>
      </LanguageProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});
