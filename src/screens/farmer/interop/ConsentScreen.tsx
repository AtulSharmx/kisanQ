import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { colors, fontSize, radius, shadow, spacing } from "../../../theme";
import { useFarmer } from "../../../context/FarmerContext";
import { createConsent } from "../../../interop/interopFirestoreService";
import { logInteropEvent } from "../../../interop/auditService";
import { generateCorrelationId } from "../../../interop/connectors/baseConnector";
import { FarmerRegistryConnector } from "../../../interop/connectors/FarmerRegistryConnector";
import { SchemeConnector } from "../../../interop/connectors/SchemeConnector";

type Props = NativeStackScreenProps<RootStackParamList, "ConsentScreen">;

const NOT_REQUESTED_FIELDS = ["Bank Account Details", "Aadhaar Full Number", "Biometric Data"];

export function ConsentScreen({ route, navigation }: Props) {
  const { schemeId, schemeName, requestedFields, purpose } = route.params;
  const { farmer, farmerId } = useFarmer();
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");

  const onDeny = async () => {
    if (!farmerId) return;
    const correlationId = generateCorrelationId();
    await logInteropEvent({
      eventType: "CONSENT_DENIED",
      farmerId,
      requestingService: "Scheme Portal",
      dataFields: requestedFields,
      correlationId,
      result: "FAILURE",
      errorMessage: "Farmer denied data sharing request",
    });
    Alert.alert("Consent Denied", "You denied permission. The application was not submitted.");
    navigation.goBack();
  };

  const onAllow = async () => {
    if (!farmerId) {
      Alert.alert("Error", "Authentication identity missing. Please re-open the app.");
      return;
    }

    setSubmitting(true);
    const correlationId = generateCorrelationId();

    try {
      // 1. Create Consent Record in Firestore
      setStatusText("Recording consent...");
      const consentId = await createConsent({
        farmerId,
        requestingService: "Scheme Portal",
        requestedDataFields: requestedFields,
        purpose,
      });

      await logInteropEvent({
        eventType: "CONSENT_GRANTED",
        farmerId,
        requestingService: "Scheme Portal",
        dataFields: requestedFields,
        consentId,
        correlationId,
        result: "SUCCESS",
      });

      // 2. Call Farmer Registry Connector (uses authenticated farmer's existing profile)
      setStatusText("Verifying identity with Farmer Registry...");
      const registryConnector = new FarmerRegistryConnector();
      const commonFarmerData = await registryConnector.verifyAndFetchFarmer(
        farmerId,
        farmer, // existing farmer profile passed in read-only
        correlationId,
        consentId
      );

      // 3. Call Scheme Connector to create government application
      setStatusText("Submitting scheme application...");
      const schemeConnector = new SchemeConnector();
      const result = await schemeConnector.submitApplication({
        farmerData: commonFarmerData,
        schemeId,
        schemeName,
        consentId,
        correlationId,
      });

      setSubmitting(false);
      Alert.alert(
        "Application Submitted!",
        `Your application for ${schemeName} has been created successfully.\nApplication ID: ${result.externalAppId}`
      );
      navigation.navigate("MyApplications");
    } catch (err) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : "Failed to complete operation";
      Alert.alert("Application Error", msg);
    }
  };

  return (
    <ScreenContainer showHome={true}>
      <Text style={styles.title}>Data Sharing Consent</Text>

      <View style={styles.card}>
        <Text style={styles.requestingHeadline}>
          🏛️ <Text style={styles.bold}>Scheme Portal</Text> is requesting access to your information:
        </Text>

        <Text style={styles.schemeLabel}>Scheme: {schemeName}</Text>
        <Text style={styles.purposeBox}>Target Purpose: {purpose}</Text>

        <Text style={styles.sectionHeader}>Requested Information:</Text>
        <View style={styles.fieldList}>
          {requestedFields.map((field) => (
            <View key={field} style={styles.fieldRow}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.fieldText}>{field}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionHeader, styles.notReqHeader]}>NOT Requested or Shared:</Text>
        <View style={styles.fieldList}>
          {NOT_REQUESTED_FIELDS.map((field) => (
            <View key={field} style={styles.fieldRow}>
              <Text style={styles.crossIcon}>✗</Text>
              <Text style={styles.fieldNotReqText}>{field}</Text>
            </View>
          ))}
        </View>

        {submitting ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loaderText}>{statusText}</Text>
          </View>
        ) : (
          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [styles.denyBtn, pressed && styles.pressed]}
              onPress={onDeny}
            >
              <Text style={styles.denyBtnText}>DENY</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.allowBtn, pressed && styles.pressed]}
              onPress={onAllow}
            >
              <Text style={styles.allowBtnText}>ALLOW</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.header,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  requestingHeadline: {
    fontSize: fontSize.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bold: {
    fontWeight: "800",
  },
  schemeLabel: {
    fontSize: fontSize.body,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  purposeBox: {
    fontSize: 13,
    color: "#5D4037",
    backgroundColor: "#EFEBE9",
    padding: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  notReqHeader: {
    marginTop: spacing.md,
  },
  fieldList: {
    gap: 4,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkIcon: {
    color: "#2E7D32",
    fontWeight: "900",
    fontSize: 16,
  },
  fieldText: {
    fontSize: fontSize.body,
    color: colors.text,
    fontWeight: "600",
  },
  crossIcon: {
    color: colors.error,
    fontWeight: "900",
    fontSize: 16,
  },
  fieldNotReqText: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  btnRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  denyBtn: {
    flex: 1,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  denyBtnText: {
    color: colors.error,
    fontWeight: "800",
    fontSize: fontSize.body,
  },
  allowBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  allowBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: fontSize.body,
  },
  loaderBox: {
    alignItems: "center",
    marginTop: spacing.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  loaderText: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});
