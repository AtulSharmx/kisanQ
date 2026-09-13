import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LanguageProvider } from "./src/context/LanguageContext";
import { FarmerProvider, useFarmer } from "./src/context/FarmerContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { colors } from "./src/theme";

function Root() {
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

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <FarmerProvider>
          <NavigationContainer>
            <Root />
          </NavigationContainer>
        </FarmerProvider>
      </LanguageProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});
