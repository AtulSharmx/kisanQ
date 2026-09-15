import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { createNativeStackNavigator, type NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "./operatorTypes";
import { useOperator } from "../context/OperatorContext";
import { StaffLoginScreen } from "../screens/operator/StaffLoginScreen";
import { ScanCheckInScreen } from "../screens/operator/ScanCheckInScreen";
import { LiveQueueManagementScreen } from "../screens/operator/LiveQueueManagementScreen";
import { WeighingScreen } from "../screens/operator/WeighingScreen";
import { QualityCheckScreen } from "../screens/operator/QualityCheckScreen";
import { AdminOverviewScreen } from "../screens/admin/AdminOverviewScreen";
import { AdminDrilldownScreen } from "../screens/admin/AdminDrilldownScreen";
import { AdminSettingsScreen } from "../screens/admin/AdminSettingsScreen";
import { OperatorSettingsScreen } from "../screens/operator/OperatorSettingsScreen";
import { colors } from "../theme";

const Stack = createNativeStackNavigator<OperatorStackParamList>();

// Same off-white contentStyle as the Farmer app's navigator, so the web build's screen
// transitions don't flash the platform default white between screens either.
const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: "slide_from_right",
  contentStyle: { backgroundColor: colors.background },
};

export function OperatorNavigator() {
  const { session, initializing } = useOperator();

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Three separate trees (rather than one Navigator with a fixed initialRouteName) so logging
  // out — or logging in as a different role — actually lands on the right screen instead of
  // just sitting on whatever screen was last open.
  if (!session) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="StaffLogin" component={StaffLoginScreen} />
      </Stack.Navigator>
    );
  }

  if (session.role === "admin") {
    return (
      <Stack.Navigator screenOptions={screenOptions} initialRouteName="AdminOverview">
        <Stack.Screen name="AdminOverview" component={AdminOverviewScreen} />
        <Stack.Screen name="AdminDrilldown" component={AdminDrilldownScreen} />
        <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions} initialRouteName="ScanCheckIn">
      <Stack.Screen name="ScanCheckIn" component={ScanCheckInScreen} />
      <Stack.Screen name="LiveQueueManagement" component={LiveQueueManagementScreen} />
      <Stack.Screen name="Weighing" component={WeighingScreen} />
      <Stack.Screen name="QualityCheck" component={QualityCheckScreen} />
      <Stack.Screen name="OperatorSettings" component={OperatorSettingsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});
