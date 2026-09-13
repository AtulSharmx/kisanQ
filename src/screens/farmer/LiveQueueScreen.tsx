import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import {
  AVERAGE_PROCESSING_MINUTES,
  getActiveBookingForFarmer,
  listenBooking,
  listenQueueForCentre,
  type BookingWithId,
} from "../../services/firestoreService";
import type { QueueStatus } from "../../types/firestore";

type Props = NativeStackScreenProps<RootStackParamList, "LiveQueue">;

type Phase = "loading" | "empty" | "awaitingCheckin" | "live";

/**
 * Live Queue — UI/UX spec screen 9, wired to real-time listeners (Master Spec build order
 * step 4). "People ahead of you" is computed live from the centre's whole queue (not just the
 * position value frozen at check-in time) so it visibly drops the moment an operator processes
 * someone ahead — this is the actual "real-time visibility" the Winning Strategy doc is about.
 */
export function LiveQueueScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { farmerId } = useFarmer();
  const [phase, setPhase] = useState<Phase>("loading");
  const [booking, setBooking] = useState<BookingWithId | null>(null);
  const [myStatus, setMyStatus] = useState<QueueStatus | null>(null);
  const [peopleAhead, setPeopleAhead] = useState(0);

  // Resolve the active booking, and if it's not checked in yet, keep listening on the booking
  // doc alone so the screen flips to "live" the moment an operator scans them in.
  useEffect(() => {
    if (!farmerId) return;
    let unsubBooking: (() => void) | undefined;

    getActiveBookingForFarmer(farmerId).then((b) => {
      if (!b) {
        setPhase("empty");
        return;
      }
      setBooking(b);
      if (b.status === "booked") {
        setPhase("awaitingCheckin");
        unsubBooking = listenBooking(b.id, (updated) => {
          if (updated && updated.status !== "booked") {
            setBooking(updated);
            setPhase("live");
          }
        });
      } else {
        setPhase("live");
      }
    });

    return () => unsubBooking?.();
  }, [farmerId]);

  // Once live, listen to the whole centre's queue and derive this farmer's position within it.
  useEffect(() => {
    if (phase !== "live" || !booking) return;
    const unsubscribe = listenQueueForCentre(booking.centreId, (entries) => {
      const mine = entries.find((e) => e.bookingId === booking.id);
      if (!mine) return;
      setMyStatus(mine.status);
      const ahead = entries.filter(
        (e) => e.status !== "completed" && e.position < mine.position
      ).length;
      setPeopleAhead(ahead);
    });
    return unsubscribe;
  }, [phase, booking]);

  if (phase === "loading") {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (phase === "empty") {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.icon}>⏳</Text>
          <Text style={styles.body}>{t("emptyLiveQueue")}</Text>
          <PrimaryButton label={t("homeBookSlot")} onPress={() => navigation.navigate("AddCrop")} />
        </View>
      </ScreenContainer>
    );
  }

  if (phase === "awaitingCheckin" && booking) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.icon}>⏳</Text>
          <Text style={styles.token}>{booking.tokenNumber}</Text>
          <Text style={styles.body}>{t("liveQueueAwaitingCheckin")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  const waitMinutes = peopleAhead * AVERAGE_PROCESSING_MINUTES;

  return (
    <ScreenContainer>
      <View style={styles.center}>
        {myStatus === "processing" ? (
          <>
            <Text style={styles.icon}>📣</Text>
            <Text style={styles.aheadText}>{t("liveQueueYourTurn")}</Text>
          </>
        ) : myStatus === "completed" ? (
          <>
            <Text style={styles.icon}>✅</Text>
            <Text style={styles.aheadText}>{t("liveQueueDone")}</Text>
          </>
        ) : (
          <>
            <Text style={styles.aheadNumber}>{peopleAhead}</Text>
            <Text style={styles.aheadText}>
              {t("liveQueuePeopleAhead").replace("{n}", String(peopleAhead))}
            </Text>
            <Text style={styles.waitLabel}>
              {t("liveQueueEstWait")}: {waitMinutes} {t("minutes")}
            </Text>
          </>
        )}
        {booking && <Text style={styles.tokenSmall}>{booking.tokenNumber}</Text>}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  icon: { fontSize: 56, marginBottom: spacing.sm },
  body: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center", marginBottom: spacing.lg },
  token: { fontSize: fontSize.header, fontWeight: "800", color: colors.primary, marginBottom: spacing.sm },
  tokenSmall: { fontSize: fontSize.body, color: colors.textMuted, marginTop: spacing.lg },
  aheadNumber: { fontSize: 72, fontWeight: "800", color: colors.primary },
  aheadText: { fontSize: fontSize.header, fontWeight: "700", color: colors.text, textAlign: "center" },
  waitLabel: { fontSize: fontSize.label, color: colors.textMuted, marginTop: spacing.sm },
});
