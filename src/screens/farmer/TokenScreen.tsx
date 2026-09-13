import React, { useEffect, useState } from "react";
import { ActivityIndicator, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CommonActions } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import {
  getBooking,
  getCentre,
  getSlot,
  type BookingWithId,
  type CentreWithId,
  type SlotWithId,
} from "../../services/firestoreService";

type Props = NativeStackScreenProps<RootStackParamList, "Token">;

interface TokenDetails {
  booking: BookingWithId;
  slot: SlotWithId | null;
  centre: CentreWithId | null;
}

/**
 * Slot Booking -> Token screen (token half) — UI/UX spec screen 8. Sharing uses the native
 * share sheet (covers WhatsApp per the "shared-phone reality" note in the spec); a pixel-image
 * download of the card would need extra libraries (react-native-view-shot + expo-sharing) —
 * left as a follow-up rather than adding more dependencies for this pass.
 */
export function TokenScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const { t } = useLanguage();
  const [details, setDetails] = useState<TokenDetails | null>(null);

  useEffect(() => {
    getBooking(bookingId).then(async (booking) => {
      if (!booking) return;
      const [slot, centre] = await Promise.all([
        getSlot(booking.slotId),
        getCentre(booking.centreId),
      ]);
      setDetails({ booking, slot, centre });
    });
  }, [bookingId]);

  const onShare = () => {
    if (!details) return;
    const { booking, slot, centre } = details;
    Share.share({
      message: `KisanQ token ${booking.tokenNumber} — ${centre?.name ?? ""}, ${slot?.date ?? ""} ${slot?.startTime ?? ""}-${slot?.endTime ?? ""}`,
    }).catch(() => {});
  };

  if (!details) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  const { booking, slot, centre } = details;

  return (
    <ScreenContainer>
      <Text style={styles.title}>{t("tokenScreenTitle")}</Text>

      <View style={styles.card}>
        <Text style={styles.token}>{booking.tokenNumber}</Text>
        <View style={styles.qrWrap}>
          <QRCode value={booking.tokenNumber} size={180} />
        </View>
        <Text style={styles.detail}>{centre?.name ?? ""}</Text>
        {slot && (
          <Text style={styles.detail}>
            {slot.date} · {slot.startTime} - {slot.endTime}
          </Text>
        )}
      </View>

      <View style={styles.spacer} />
      <PrimaryButton label={t("downloadShare")} onPress={onShare} variant="outline" />
      <View style={styles.spacerSmall} />
      <PrimaryButton
        label={t("goHome")}
        onPress={() =>
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Home" }] }))
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.lg, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  token: { fontSize: fontSize.display, fontWeight: "800", color: colors.primary, letterSpacing: 1 },
  qrWrap: { marginVertical: spacing.lg, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md },
  detail: { fontSize: fontSize.label, color: colors.text },
  spacer: { height: spacing.xl },
  spacerSmall: { height: spacing.sm },
});
