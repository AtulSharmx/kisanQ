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
import { ComingSoonScreen } from "../screens/farmer/ComingSoonScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator({ initialRouteName }: { initialRouteName: "Splash" | "Home" }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
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
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
    </Stack.Navigator>
  );
}
