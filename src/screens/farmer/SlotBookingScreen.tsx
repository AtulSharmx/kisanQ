import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, shadow, spacing, touchTarget } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import {
  advanceBookingDates,
  createBooking,
  getCentre,
  getExpressAvailability,
  listSlotsForCentreOnDate,
  type CentreWithId,
  type SlotWithId,
} from "../../services/firestoreService";

type Props = NativeStackScreenProps<RootStackParamList, "SlotBooking">;

const DATE_LABEL_KEYS = ["dateToday", "dateTomorrow", "dateDayAfter"] as const;

/** Slot Booking -> Token — UI/UX spec screen 8 (booking half), extended with advance booking
 * (today/tomorrow/day-after date tabs) and an optional Express (Tatkal-style) slot. */
export function SlotBookingScreen({ route, navigation }: Props) {
  const { centreId, cropId } = route.params;
  const { t } = useLanguage();
  const { farmerId } = useFarmer();
  const dates = advanceBookingDates();
  const [dateIndex, setDateIndex] = useState(0);
  const [slots, setSlots] = useState<SlotWithId[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [express, setExpress] = useState<{ available: boolean; price: number; remaining: number } | null>(
    null
  );
  const [wantsExpress, setWantsExpress] = useState(false);
  const [centre, setCentre] = useState<CentreWithId | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDate = dates[dateIndex];
  // Daily Buying Capacity feature — only gates *today*, since remainingCapacityQuintals has no
  // separate tracking for future days (advance bookings for tomorrow/day-after are unaffected).
  const isTodayCapacityFull =
    dateIndex === 0 && centre !== null && centre.remainingCapacityQuintals <= 0;

  useEffect(() => {
    // Static reference data for this centre — fetched once, not per date change.
    getCentre(centreId).then(setCentre);
  }, [centreId]);

  useEffect(() => {
    setSlots(null);
    setSelected(null);
    setWantsExpress(false);
    listSlotsForCentreOnDate(centreId, selectedDate).then(setSlots);
    getExpressAvailability(centreId, selectedDate).then((res) =>
      setExpress({
        available: res.available,
        price: res.price,
        remaining: 2 - (res.nextRank - 1), // EXPRESS_QUOTA_PER_DAY is 2 — see firestoreService.ts
      })
    );
  }, [centreId, selectedDate]);

  const onConfirm = async () => {
    if (!selected || !farmerId) return;
    setBooking(true);
    setError(null);
    try {
      const result = await createBooking({
        farmerId,
        centreId,
        slotId: selected,
        cropId,
        wantsExpress,
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
      } else if (e instanceof Error && e.message === "EXPRESS_SOLD_OUT") {
        setError(t("expressSoldOut"));
        setWantsExpress(false);
      } else {
        setError(t("saveFailed"));
      }
      // State may have just changed under us — refresh so the screen reflects reality.
      listSlotsForCentreOnDate(centreId, selectedDate).then(setSlots);
      getExpressAvailability(centreId, selectedDate).then((res) =>
        setExpress({ available: res.available, price: res.price, remaining: 2 - (res.nextRank - 1) })
      );
      getCentre(centreId).then(setCentre);
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
            onPress={() => setDateIndex(i)}
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

          {express?.available && (
            <Pressable
              onPress={() => setWantsExpress((w) => !w)}
              style={({ pressed }) => [
                styles.expressCard,
                wantsExpress && styles.expressCardActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.expressTitle}>
                {wantsExpress ? "✓ " : ""}
                {t("expressOptionTitle")}
              </Text>
              <Text style={styles.expressDesc}>
                {t("expressOptionDesc")
                  .replace("{price}", String(express.price))
                  .replace("{remaining}", String(express.remaining))}
              </Text>
            </Pressable>
          )}
          {express && !express.available && (
            <Text style={styles.expressSoldOut}>{t("expressSoldOut")}</Text>
          )}
        </>
      )}

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
  expressCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    gap: spacing.xs,
    ...shadow.card,
  },
  expressCardActive: { backgroundColor: colors.accentTint },
  expressTitle: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
  expressDesc: { fontSize: fontSize.body, color: colors.textMuted },
  expressSoldOut: {
    marginTop: spacing.md,
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  error: { color: colors.error, textAlign: "center", marginTop: spacing.md },
  spacer: { height: spacing.xl },
  pressed: { opacity: 0.7 },
});
