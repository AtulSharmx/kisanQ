import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, shadow, spacing, touchTarget } from "../../theme";
import { PrimaryButton } from "../../components/PrimaryButton";
import { OperatorHeader } from "../../components/OperatorHeader";
import { useLanguage } from "../../context/LanguageContext";
import { useOperator } from "../../context/OperatorContext";
import {
  checkInBooking,
  findCheckInCandidate,
  getCrop,
  getFarmer,
  getSlot,
  type BookingWithId,
} from "../../services/firestoreService";
import type { Crop, Farmer, Slot } from "../../types/firestore";
import { unitLabel } from "../../data/commodities";

type Props = NativeStackScreenProps<OperatorStackParamList, "ScanCheckIn">;

interface Candidate {
  booking: BookingWithId;
  farmer: Farmer;
  crop: Crop;
  slot: Slot | null;
}

/**
 * Scan / Check-in — UI/UX spec Operator screen 2. The manual token-number field is always
 * visible next to the scan button (Missing Details Polish sec. 3 — never hidden behind a
 * "can't scan?" link).
 */
export function ScanCheckInScreen({ navigation }: Props) {
  const { t, lang } = useLanguage();
  const { session, staffName, logout } = useOperator();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [lastCheckedIn, setLastCheckedIn] = useState<string | null>(null);

  const lookup = async (tokenNumber: string) => {
    if (!tokenNumber.trim() || looking || !session?.assignedCentreId) return;
    setLooking(true);
    setLookupError(null);
    setCandidate(null);
    setScanning(false);
    try {
      const booking = await findCheckInCandidate(tokenNumber, session.assignedCentreId);
      if (!booking) {
        setLookupError(t("operatorTokenNotFound"));
        return;
      }
      const [farmer, crop, slot] = await Promise.all([
        getFarmer(booking.farmerId),
        getCrop(booking.cropId),
        getSlot(booking.slotId),
      ]);
      if (!farmer || !crop) {
        setLookupError(t("operatorDataLoadFailed"));
        return;
      }
      setCandidate({ booking, farmer, crop, slot });
    } catch (e) {
      console.error(e);
      setLookupError(t("noInternet"));
    } finally {
      setLooking(false);
    }
  };

  const onCheckIn = async () => {
    if (!candidate || !session) return;
    setCheckingIn(true);
    setCheckInError(null);
    try {
      await checkInBooking({ bookingId: candidate.booking.id, staffId: session.staffId });
      setLastCheckedIn(candidate.booking.tokenNumber);
      setCandidate(null);
      setManualToken("");
    } catch (e) {
      console.error(e);
      setCheckInError(e instanceof Error ? e.message : t("saveFailed"));
    } finally {
      setCheckingIn(false);
    }
  };

  const toggleScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setScanning((s) => !s);
  };

  return (
    <View style={styles.screen}>
      <OperatorHeader
        title={t("operatorCheckInTitle")}
        staffName={staffName}
        actions={[
          {
            icon: "⏳",
            label: t("operatorLiveQueueLink"),
            onPress: () => navigation.navigate("LiveQueueManagement"),
          },
          {
            icon: "⚙️",
            label: t("adminSettingsLink"),
            onPress: () => navigation.navigate("OperatorSettings"),
          },
          { icon: "🚪", label: t("logoutBtn"), onPress: logout, danger: true },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <PrimaryButton
          label={scanning ? t("operatorStopScanBtn") : t("operatorScanBtn")}
          onPress={toggleScan}
          variant={scanning ? "outline" : "primary"}
        />

        {scanning && (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={(result) => lookup(result.data)}
            />
          </View>
        )}

        <Text style={styles.orLabel}>{t("operatorOrEnterToken")}</Text>
        <TextInput
          value={manualToken}
          onChangeText={setManualToken}
          onSubmitEditing={() => lookup(manualToken)}
          placeholder="e.g. KSN-1048"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          style={styles.manualInput}
        />
        <PrimaryButton
          label={t("operatorFindBtn")}
          onPress={() => lookup(manualToken)}
          disabled={!manualToken.trim()}
          loading={looking}
        />

        {lookupError && <Text style={styles.error}>{lookupError}</Text>}
        {lastCheckedIn && (
          <Text style={styles.success}>
            {t("operatorCheckedInSuccess").replace("{token}", lastCheckedIn)}
          </Text>
        )}

        {looking && <ActivityIndicator color={colors.primary} style={styles.loader} />}

        {candidate && (
          <View style={styles.card}>
            <Row label={t("profileName")} value={candidate.farmer.name} />
            <Row label={t("operatorTokenLabel")} value={candidate.booking.tokenNumber} />
            <Row label={t("operatorCropLabel")} value={candidate.crop.cropType} />
            <Row
              label={t("operatorExpectedQtyLabel")}
              value={`${candidate.crop.expectedQuantity} ${unitLabel("quintal", lang)}`}
            />
            {candidate.slot && (
              <Row
                label={t("operatorSlotLabel")}
                value={`${candidate.slot.startTime} - ${candidate.slot.endTime}`}
              />
            )}
            {checkInError && <Text style={styles.error}>{checkInError}</Text>}
            <View style={styles.spacer} />
            <PrimaryButton label={t("operatorCheckInBtn")} onPress={onCheckIn} loading={checkingIn} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, maxWidth: 560, width: "100%", alignSelf: "center", gap: spacing.md },
  cameraWrap: {
    height: 280,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  camera: { flex: 1 },
  orLabel: { textAlign: "center", color: colors.textMuted, marginTop: spacing.sm },
  manualInput: {
    minHeight: touchTarget,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.label,
    backgroundColor: colors.surface,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  error: { color: colors.error, textAlign: "center" },
  success: { color: colors.primary, fontWeight: "700", textAlign: "center" },
  loader: { marginTop: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: colors.textMuted },
  rowValue: { fontWeight: "700", color: colors.text, textTransform: "capitalize" },
  spacer: { height: spacing.sm },
});
