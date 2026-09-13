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
  getActiveBookingForFarmer,
  listCropsForFarmer,
  type BookingWithId,
  type CropWithId,
} from "../../services/firestoreService";

type Props = NativeStackScreenProps<RootStackParamList, "ComingSoon">;

/**
 * Screens that live past the registration -> token flow (build order step 3+: operator
 * check-in/live-queue, weighing, quality-check, payments). Those aren't built yet, so this
 * shows each one's documented empty state (Missing Details Polish sec. 2) honestly rather than
 * faking data — except My Produce, which already has real crop data from registration.
 */
export function ComingSoonScreen({ route, navigation }: Props) {
  const { titleKey } = route.params;
  const { t } = useLanguage();
  const { farmerId } = useFarmer();
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState<CropWithId[]>([]);
  const [booking, setBooking] = useState<BookingWithId | null>(null);

  useEffect(() => {
    if (!farmerId) return;
    setLoading(true);
    Promise.all([
      titleKey === "homeMyProduce" ? listCropsForFarmer(farmerId) : Promise.resolve([]),
      getActiveBookingForFarmer(farmerId),
    ])
      .then(([cropList, activeBooking]) => {
        setCrops(cropList);
        setBooking(activeBooking);
      })
      .finally(() => setLoading(false));
  }, [farmerId, titleKey]);

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (titleKey === "homeMyProduce" && crops.length > 0) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>{t("homeMyProduce")}</Text>
        {crops.map((c) => (
          <View key={c.id} style={styles.cropRow}>
            <Text style={styles.cropIcon}>🌾</Text>
            <View>
              <Text style={styles.cropType}>{c.cropType}</Text>
              <Text style={styles.cropQty}>{c.expectedQuantity} quintals (expected)</Text>
            </View>
          </View>
        ))}
      </ScreenContainer>
    );
  }

  if (
    (titleKey === "homeLiveQueue" || titleKey === "homeProcurementStatus") &&
    booking
  ) {
    return (
      <ScreenContainer>
        <Text style={styles.icon}>⏳</Text>
        <Text style={styles.title}>{booking.tokenNumber}</Text>
        <Text style={styles.body}>
          चेक-इन का इंतज़ार है — केंद्र पर पहुंचकर QR स्कैन करवाएं। (Waiting for check-in — scan
          your QR at the centre to see live status.)
        </Text>
      </ScreenContainer>
    );
  }

  const empty = emptyStateFor(titleKey);
  return (
    <ScreenContainer>
      <View style={styles.emptyWrap}>
        <Text style={styles.icon}>{empty.icon}</Text>
        <Text style={styles.body}>{t(empty.textKey)}</Text>
        {empty.cta && (
          <PrimaryButton
            label={t(empty.cta.labelKey)}
            onPress={() => navigation.navigate(empty.cta!.screen as never)}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

function emptyStateFor(titleKey: Props["route"]["params"]["titleKey"]) {
  switch (titleKey) {
    case "homeMyProduce":
      return {
        icon: "🌾",
        textKey: "emptyMyProduce" as const,
        cta: { labelKey: "homeBookSlot" as const, screen: "AddCrop" },
      };
    case "homeLiveQueue":
    case "homeProcurementStatus":
      return {
        icon: "⏳",
        textKey: "emptyLiveQueue" as const,
        cta: { labelKey: "homeBookSlot" as const, screen: "AddCrop" },
      };
    case "homePayment":
      return { icon: "💰", textKey: "emptyPayment" as const, cta: null };
    case "homeNotifications":
    default:
      return { icon: "🔔", textKey: "emptyNotifications" as const, cta: null };
  }
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  icon: { fontSize: 56, textAlign: "center", marginBottom: spacing.md },
  body: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center", marginBottom: spacing.lg },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  cropRow: { flexDirection: "row", gap: spacing.md, alignItems: "center", marginBottom: spacing.md },
  cropIcon: { fontSize: 32 },
  cropType: { fontSize: fontSize.label, fontWeight: "700", color: colors.text, textTransform: "capitalize" },
  cropQty: { fontSize: fontSize.body, color: colors.textMuted },
});
