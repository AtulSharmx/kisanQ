import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useLanguage } from "../../context/LanguageContext";
import { useOperator } from "../../context/OperatorContext";
import {
  getBooking,
  getCrop,
  getFarmer,
  recordWeighing,
  type BookingWithId,
} from "../../services/firestoreService";
import type { Crop, Farmer } from "../../types/firestore";

type Props = NativeStackScreenProps<OperatorStackParamList, "Weighing">;

/** Weighing screen — UI/UX spec Operator screen 4: expected vs actual, numeric input. */
export function WeighingScreen({ route, navigation }: Props) {
  const { bookingId, queueId, farmerId } = route.params;
  const { t } = useLanguage();
  const { staffName } = useOperator();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingWithId | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [actualWeight, setActualWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBooking(bookingId).then(async (b) => {
      setBooking(b);
      if (b) {
        const [c, f] = await Promise.all([getCrop(b.cropId), getFarmer(b.farmerId)]);
        setCrop(c);
        setFarmer(f);
      }
      setLoading(false);
    });
  }, [bookingId]);

  const onConfirm = async () => {
    const weight = Number(actualWeight);
    if (!weight || weight <= 0) {
      setError(t("operatorEnterValidWeight"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { procurementId } = await recordWeighing({ bookingId, farmerId, actualWeight: weight });
      navigation.navigate("QualityCheck", {
        bookingId,
        queueId,
        farmerId,
        procurementId,
        expectedQuantity: crop?.expectedQuantity ?? 0,
        actualWeight: weight,
      });
    } catch (e) {
      console.error(e);
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          ⚖️ {t("operatorWeighingTitle")} ({staffName})
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Row label={t("operatorFarmerLabel")} value={farmer?.name ?? "-"} />
          <Row label={t("operatorTokenLabel")} value={booking?.tokenNumber ?? "-"} />
          <Row label={t("operatorCropLabel")} value={crop?.cropType ?? "-"} />
          <Row
            label={t("operatorExpectedQtyLabel")}
            value={crop ? `${crop.expectedQuantity} quintals` : "-"}
          />
        </View>

        <Text style={styles.label}>{t("operatorActualLabel")} (quintals)</Text>
        <TextInput
          value={actualWeight}
          onChangeText={setActualWeight}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        {error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.spacer} />
        <PrimaryButton
          label={t("operatorConfirmWeightBtn")}
          onPress={onConfirm}
          loading={saving}
          disabled={!actualWeight}
        />
      </View>
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
  loader: { marginTop: spacing.xl },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: fontSize.label, fontWeight: "800", color: colors.primary },
  content: { padding: spacing.lg, maxWidth: 480, width: "100%", alignSelf: "center", gap: spacing.md },
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
  label: { fontSize: fontSize.body, color: colors.textMuted },
  input: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.header,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  error: { color: colors.error, textAlign: "center" },
  spacer: { height: spacing.sm },
});
