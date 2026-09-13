import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, spacing, touchTarget } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import {
  createBooking,
  listSlotsForCentreToday,
  type SlotWithId,
} from "../../services/firestoreService";

type Props = NativeStackScreenProps<RootStackParamList, "SlotBooking">;

/** Slot Booking -> Token — UI/UX spec screen 8 (booking half). */
export function SlotBookingScreen({ route, navigation }: Props) {
  const { centreId, cropId } = route.params;
  const { t } = useLanguage();
  const { farmerId } = useFarmer();
  const [slots, setSlots] = useState<SlotWithId[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSlotsForCentreToday(centreId).then(setSlots);
  }, [centreId]);

  const onConfirm = async () => {
    if (!selected || !farmerId) return;
    setBooking(true);
    setError(null);
    try {
      const result = await createBooking({ farmerId, centreId, slotId: selected, cropId });
      navigation.replace("Token", { bookingId: result.bookingId });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : t("saveFailed"));
      // Slot may have just filled up under us — refresh the list so it reflects reality.
      listSlotsForCentreToday(centreId).then(setSlots);
      setSelected(null);
    } finally {
      setBooking(false);
    }
  };

  if (!slots) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false}>
      <Text style={styles.title}>{t("slotBookingTitle")}</Text>
      <View style={styles.grid}>
        {slots.map((slot) => {
          const full = slot.bookedCount >= slot.capacity;
          return (
            <Pressable
              key={slot.id}
              disabled={full}
              onPress={() => setSelected(slot.id)}
              style={[
                styles.slot,
                full && styles.slotFull,
                selected === slot.id && styles.slotActive,
              ]}
            >
              <Text style={[styles.slotText, full && styles.slotTextFull]}>
                {slot.startTime} - {slot.endTime}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.spacer} />
      <PrimaryButton
        label={t("confirmBookingBtn")}
        onPress={onConfirm}
        disabled={!selected}
        loading={booking}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  slot: {
    minWidth: "47%",
    minHeight: touchTarget,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  slotActive: { borderColor: colors.primary, backgroundColor: "#E7F3EC" },
  slotFull: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  slotText: { fontSize: fontSize.label, fontWeight: "700", color: colors.text },
  slotTextFull: { color: colors.textMuted, textDecorationLine: "line-through" },
  error: { color: colors.error, textAlign: "center", marginTop: spacing.md },
  spacer: { height: spacing.xl },
});
