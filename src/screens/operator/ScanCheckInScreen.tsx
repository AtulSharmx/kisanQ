import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, spacing, touchTarget } from "../../theme";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useOperator } from "../../context/OperatorContext";
import {
  checkInBooking,
  findCheckInCandidate,
  getCentre,
  getCrop,
  getFarmer,
  getSlot,
  type BookingWithId,
} from "../../services/firestoreService";
import type { Crop, Farmer, Slot } from "../../types/firestore";

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
        setLookupError("टोकन नहीं मिला या पहले ही चेक-इन हो चुका है। (Token not found or already checked in.)");
        return;
      }
      const [farmer, crop, slot] = await Promise.all([
        getFarmer(booking.farmerId),
        getCrop(booking.cropId),
        getSlot(booking.slotId),
      ]);
      if (!farmer || !crop) {
        setLookupError("डेटा लोड नहीं हो सका। (Could not load booking details.)");
        return;
      }
      setCandidate({ booking, farmer, crop, slot });
    } catch (e) {
      console.error(e);
      setLookupError("इंटरनेट कनेक्शन जांचें। (Check your internet connection.)");
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
      setCheckInError(e instanceof Error ? e.message : "सेव नहीं हुआ, दोबारा कोशिश करें।");
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>चेक-इन ({staffName})</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate("LiveQueueManagement")}>
            <Text style={styles.headerLink}>लाइव कतार →</Text>
          </Pressable>
          <Pressable onPress={logout}>
            <Text style={styles.headerLink}>लॉग आउट</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <PrimaryButton
          label={scanning ? "स्कैन बंद करें" : "स्कैन करें (Scan)"}
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

        <Text style={styles.orLabel}>या टोकन नंबर डालें (or enter token number)</Text>
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
          label="खोजें (Find)"
          onPress={() => lookup(manualToken)}
          disabled={!manualToken.trim()}
          loading={looking}
        />

        {lookupError && <Text style={styles.error}>{lookupError}</Text>}
        {lastCheckedIn && (
          <Text style={styles.success}>✅ {lastCheckedIn} चेक-इन हो गया।</Text>
        )}

        {looking && <ActivityIndicator color={colors.primary} style={styles.loader} />}

        {candidate && (
          <View style={styles.card}>
            <Row label="नाम (Name)" value={candidate.farmer.name} />
            <Row label="टोकन (Token)" value={candidate.booking.tokenNumber} />
            <Row label="फसल (Crop)" value={candidate.crop.cropType} />
            <Row
              label="अनुमानित मात्रा (Expected Qty)"
              value={`${candidate.crop.expectedQuantity} quintals`}
            />
            {candidate.slot && (
              <Row label="स्लॉट (Slot)" value={`${candidate.slot.startTime} - ${candidate.slot.endTime}`} />
            )}
            {checkInError && <Text style={styles.error}>{checkInError}</Text>}
            <View style={styles.spacer} />
            <PrimaryButton label="चेक-इन करें (Check-In)" onPress={onCheckIn} loading={checkingIn} />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
  headerActions: { flexDirection: "row", gap: spacing.lg },
  headerLink: { color: colors.primary, fontWeight: "700" },
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
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: colors.textMuted },
  rowValue: { fontWeight: "700", color: colors.text, textTransform: "capitalize" },
  spacer: { height: spacing.sm },
});
