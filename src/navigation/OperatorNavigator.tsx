import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "./operatorTypes";
import { useOperator } from "../context/OperatorContext";
import { StaffLoginScreen } from "../screens/operator/StaffLoginScreen";
import { ScanCheckInScreen } from "../screens/operator/ScanCheckInScreen";
import { LiveQueueManagementScreen } from "../screens/operator/LiveQueueManagementScreen";
import { WeighingScreen } from "../screens/operator/WeighingScreen";
import { QualityCheckScreen } from "../screens/operator/QualityCheckScreen";
import { colors } from "../theme";

const Stack = createNativeStackNavigator<OperatorStackParamList>();

export function OperatorNavigator() {
  const { session, initializing } = useOperator();

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Two separate trees (rather than one Navigator with a fixed initialRouteName) so logging
  // out actually returns to the login screen instead of just sitting on whatever screen was
  // last open.
  if (!session) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="StaffLogin" component={StaffLoginScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ScanCheckIn">
      <Stack.Screen name="ScanCheckIn" component={ScanCheckInScreen} />
      <Stack.Screen name="LiveQueueManagement" component={LiveQueueManagementScreen} />
      <Stack.Screen name="Weighing" component={WeighingScreen} />
      <Stack.Screen name="QualityCheck" component={QualityCheckScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});
