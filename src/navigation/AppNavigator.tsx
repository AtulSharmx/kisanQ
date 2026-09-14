import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { SplashScreen } from "../screens/farmer/SplashScreen";
import { AadhaarEntryScreen } from "../screens/farmer/AadhaarEntryScreen";
import { OtpScreen } from "../screens/farmer/OtpScreen";
import { ProfileConfirmScreen } from "../screens/farmer/ProfileConfirmScreen";
import { StepVillageScreen } from "../screens/farmer/StepVillageScreen";
import { StepCropScreen } from "../screens/farmer/StepCropScreen";
import { StepCentreScreen } from "../screens/farmer/StepCentreScreen";
import { HomeScreen } from "../screens/farmer/HomeScreen";
import { AddCropScreen } from "../screens/farmer/AddCropScreen";
import { CentreSelectionScreen } from "../screens/farmer/CentreSelectionScreen";
import { SlotBookingScreen } from "../screens/farmer/SlotBookingScreen";
import { TokenScreen } from "../screens/farmer/TokenScreen";
import { LiveQueueScreen } from "../screens/farmer/LiveQueueScreen";
import { ProcurementStatusScreen } from "../screens/farmer/ProcurementStatusScreen";
import { NotificationsScreen } from "../screens/farmer/NotificationsScreen";
import { SettingsScreen } from "../screens/farmer/SettingsScreen";
import { ComingSoonScreen } from "../screens/farmer/ComingSoonScreen";
import { colors } from "../theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

// contentStyle matches the app's off-white background (not the platform's default white) so the
// native slide transition never flashes white for a frame between the old and new screen.
export function AppNavigator({ initialRouteName }: { initialRouteName: "Splash" | "Home" }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
      }}
      initialRouteName={initialRouteName}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Aadhaar" component={AadhaarEntryScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="ProfileConfirm" component={ProfileConfirmScreen} />
      <Stack.Screen name="StepVillage" component={StepVillageScreen} />
      <Stack.Screen name="StepCrop" component={StepCropScreen} />
      <Stack.Screen name="StepCentre" component={StepCentreScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AddCrop" component={AddCropScreen} />
      <Stack.Screen name="CentreSelection" component={CentreSelectionScreen} />
      <Stack.Screen name="SlotBooking" component={SlotBookingScreen} />
      <Stack.Screen name="Token" component={TokenScreen} />
      <Stack.Screen name="LiveQueue" component={LiveQueueScreen} />
      <Stack.Screen name="ProcurementStatus" component={ProcurementStatusScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
    </Stack.Navigator>
  );
}
