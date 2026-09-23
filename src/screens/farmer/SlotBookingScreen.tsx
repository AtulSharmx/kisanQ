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
  advanceBookingDates,
  createBooking,
  getCentreCropCapacity,
  getCrop,
  listSlotsForCentreOnDate,
  type CropWithId,
  type SlotWithId,
} from "../../services/firestoreService";
import type { CentreCropCapacity } from "../../types/firestore";

type Props = NativeStackScreenProps<RootStackParamList, "SlotBooking">;

const DATE_LABEL_KEYS = ["dateToday", "dateTomorrow", "dateDayAfter"] as const;

/** Slot Booking -> Token — UI/UX spec screen 8 (booking half), extended with advance booking
 * (today/tomorrow/day-after date tabs). */
export function SlotBookingScreen({ route, navigation }: Props) {
  const { centreId, cropId } = route.params;
  const { t } = useLanguage();
  const { farmerId } = useFarmer();
  const dates = advanceBookingDates();
  const [dateIndex, setDateIndex] = useState(0);
  const [slots, setSlots] = useState<SlotWithId[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropWithId | null>(null);
  const [capacity, setCapacity] = useState<CentreCropCapacity | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDate = dates[dateIndex];
  // Daily Buying Capacity feature — only gates *today*, since remainingCapacityQuintals has no
  // separate tracking for future days (advance bookings for tomorrow/day-after are unaffected).
  // `capacity === null` covers both "not loaded yet" and "this (centre, crop) pair isn't
  // capacity-gated at all" — either way, nothing to block on.
  const isTodayCapacityFull =
    dateIndex === 0 && capacity !== null && capacity.remainingCapacityQuintals <= 0;

  useEffect(() => {
    // Static reference data for this crop — fetched once, not per date change.
    getCrop(cropId).then(setCrop);
  }, [cropId]);

  useEffect(() => {
    if (!crop) return;
    getCentreCropCapacity(centreId, crop.cropType).then(setCapacity);
  }, [centreId, crop]);

  useEffect(() => {
    listSlotsForCentreOnDate(centreId, selectedDate).then(setSlots);
  }, [centreId, selectedDate]);

  // Switching day clears the old day's slots/selection in the same event, so the grid shows a
  // loader instead of briefly offering the previous day's times.
  const onPickDate = (i: number) => {
    if (i === dateIndex) return;
    setSlots(null);
    setSelected(null);
    setDateIndex(i);
  };

  const onConfirm = async () => {
    if (!selected || !farmerId || !crop) return;
    setBooking(true);
    setError(null);
    try {
      const result = await createBooking({
        farmerId,
        centreId,
        slotId: selected,
        cropId,
        cropType: crop.cropType,
        // Lets the capacity gate reject a load that's bigger than what's left for *this*
        // commodity today, instead of only refusing once the centre hits exactly zero.
        expectedQuantity: crop.expectedQuantity,
      });
      navigation.replace("Token", { bookingId: result.bookingId });
    } catch (e) {
      console.error(e);
      // createBooking() throws stable codes (not user-facing text) for these two race
      // conditions, so they can be shown in Hindi like every other error on this screen instead
      // of leaking a raw English Error message.
      if (e instanceof Error && e.message === "SLOT_FULL") {
        setError(t("slotJustFilled"));
      } else if (e instanceof Error && e.message === "CENTRE_CAPACITY_FULL") {
        setError(t("centreCapacityFull"));
      } else if (e instanceof Error && e.message.startsWith("CENTRE_CAPACITY_INSUFFICIENT:")) {
        // The code carries the remaining quintals after the colon — telling the farmer the real
        // number is the difference between "try something else" and "bring 40 instead of 60."
        const remaining = e.message.split(":")[1];
        setError(t("centreCapacityInsufficient").replace("{n}", remaining));
      } else {
        setError(t("saveFailed"));
      }
      // State may have just changed under us — refresh so the screen reflects reality.
      listSlotsForCentreOnDate(centreId, selectedDate).then(setSlots);
      if (crop) getCentreCropCapacity(centreId, crop.cropType).then(setCapacity);
      setSelected(null);
    } finally {
      setBooking(false);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <Text style={styles.title}>{t("slotBookingTitle")}</Text>

      <View style={styles.dateTabs}>
        {dates.map((date, i) => (
          <Pressable
            key={date}
            onPress={() => onPickDate(i)}
            style={({ pressed }) => [
              styles.dateTab,
              dateIndex === i && styles.dateTabActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.dateTabText, dateIndex === i && styles.dateTabTextActive]}>
              {t(DATE_LABEL_KEYS[i])}
            </Text>
          </Pressable>
        ))}
      </View>

      {!slots ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <>
          {isTodayCapacityFull && (
            <Text style={styles.capacityFullBanner}>{t("centreCapacityFull")}</Text>
          )}
          <View style={styles.grid}>
            {slots.map((slot) => {
              // Today's buying capacity being exhausted blocks *new* bookings the same way a
              // fully-booked slot does — same visual treatment, reusing `full` below, rather
              // than a separate disabled state.
              const full = slot.bookedCount >= slot.capacity || isTodayCapacityFull;
              return (
                <Pressable
                  key={slot.id}
                  disabled={full}
                  onPress={() => setSelected(slot.id)}
                  style={({ pressed }) => [
                    styles.slot,
                    full && styles.slotFull,
                    selected === slot.id && styles.slotActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.slotText, full && styles.slotTextFull]}>
                    {selected === slot.id ? "✓ " : ""}
                    {slot.startTime} - {slot.endTime}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.spacer} />
      <PrimaryButton
        label={t("confirmBookingBtn")}
        onPress={onConfirm}
        disabled={!selected || !crop}
        loading={booking}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  dateTabs: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  dateTab: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  dateTabActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  dateTabText: { fontSize: fontSize.body, fontWeight: "700", color: colors.text },
  dateTabTextActive: { color: colors.white },
  loader: { marginTop: spacing.xl },
  capacityFullBanner: {
    fontSize: fontSize.body,
    fontWeight: "700",
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.md,
  },
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
  slotActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  slotFull: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  slotText: { fontSize: fontSize.label, fontWeight: "700", color: colors.text },
  slotTextFull: { color: colors.textMuted, textDecorationLine: "line-through" },
  error: { color: colors.error, textAlign: "center", marginTop: spacing.md },
  spacer: { height: spacing.xl },
  pressed: { opacity: 0.7 },
});
