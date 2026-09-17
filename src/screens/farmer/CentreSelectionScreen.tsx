import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, shadow, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import {
  addCrop,
  getCentreCropCapacity,
  getCentreEstimatedWaitMinutes,
  hasAvailableSlotToday,
  listActiveCentres,
  listenCropCapacityAcrossCentres,
  type CentreWithId,
} from "../../services/firestoreService";
import { pseudoDistanceKm } from "../../utils/pseudoDistance";

type Props = NativeStackScreenProps<RootStackParamList, "CentreSelection">;

interface Ranked {
  centre: CentreWithId;
  distanceKm: number;
  waitMinutes: number;
  hasSlots: boolean;
  /** null = this centre hasn't been configured with a capacity limit for this crop at all —
   * shown as "no limit tracked", not "0 available". */
  remainingCapacityQuintals: number | null;
  /** What this centre pays per grade for this crop; empty = it hasn't published rates. */
  gradePrices: Record<string, number>;
}

/**
 * "₹75–₹100" for a centre that pays different rates by grade, "₹100" when every grade pays the
 * same, and null when the centre has published nothing — in which case the row simply omits the
 * rate line rather than showing a zero the farmer might plan around.
 */
function priceRange(gradePrices: Record<string, number>): string | null {
  const values = Object.values(gradePrices).filter((p) => Number.isFinite(p) && p > 0);
  if (values.length === 0) return null;
  const low = Math.min(...values);
  const high = Math.max(...values);
  return low === high ? `₹${low}` : `₹${low}–₹${high}`;
}

/** Centre Selection — UI/UX spec screen 7. Ranked list, not map-first. */
export function CentreSelectionScreen({ route, navigation }: Props) {
  const { cropType, expectedQuantity } = route.params;
  const { t } = useLanguage();
  const { farmerId } = useFarmer();
  const [ranked, setRanked] = useState<Ranked[] | null>(null);
  const [booking, setBooking] = useState(false);

  const onSelectCentre = async (centreId: string) => {
    if (!farmerId || booking) return;
    setBooking(true);
    try {
      // The crop doc is created here, not on the previous screen, since its
      // preferredCentreId field needs the centre the farmer is about to pick.
      const cropId = await addCrop({
        farmerId,
        cropType,
        expectedQuantity,
        preferredCentreId: centreId,
      });
      navigation.navigate("SlotBooking", { centreId, cropId });
    } finally {
      setBooking(false);
    }
  };

  useEffect(() => {
    if (!farmerId) return;
    listActiveCentres().then(async (centres) => {
      const withStats = await Promise.all(
        centres.map(async (centre) => {
          const capacity = await getCentreCropCapacity(centre.id, cropType);
          return {
            centre,
            distanceKm: pseudoDistanceKm(farmerId, centre.id),
            waitMinutes: await getCentreEstimatedWaitMinutes(centre.id),
            hasSlots: await hasAvailableSlotToday(centre.id),
            remainingCapacityQuintals: capacity?.remainingCapacityQuintals ?? null,
            gradePrices: capacity?.gradePrices ?? {},
          };
        })
      );
      withStats.sort((a, b) => a.waitMinutes - b.waitMinutes || a.distanceKm - b.distanceKm);
      setRanked(withStats);
    });
  }, [farmerId, cropType]);

  // Capacity and rates are the parts worth watching live — an Accept elsewhere or an admin
  // edit lands here within the second. Merged into the ranked list rather than recomputing
  // distance and wait, which don't change live.
  useEffect(() => {
    const unsubscribe = listenCropCapacityAcrossCentres(cropType, (byCentreId) => {
      setRanked((prev) =>
        prev
          ? prev.map((r) => {
              const capacity = byCentreId[r.centre.id];
              return capacity
                ? {
                    ...r,
                    remainingCapacityQuintals: capacity.remainingCapacityQuintals,
                    gradePrices: capacity.gradePrices ?? {},
                  }
                : r;
            })
          : prev
      );
    });
    return unsubscribe;
  }, [cropType]);

  if (!ranked) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false}>
      <Text style={styles.title}>{t("centreSelectionTitle")}</Text>
      <FlatList
        data={ranked}
        keyExtractor={(r) => r.centre.id}
        renderItem={({ item, index }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            disabled={booking}
            onPress={() => onSelectCentre(item.centre.id)}
          >
            {index === 0 && (
              <View style={styles.starBadge}>
                <Text style={styles.starText}>⭐ {t("shortestWait")}</Text>
              </View>
            )}
            <Text style={styles.centreName}>{item.centre.name}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                🚶 {item.distanceKm.toFixed(1)} {t("kmAway")}
              </Text>
              <Text style={styles.meta}>
                🕒 {t("estWait")}: {item.waitMinutes} {t("minutes")}
              </Text>
            </View>
            <Text style={item.hasSlots ? styles.slotsOk : styles.slotsFull}>
              {item.hasSlots ? t("slotsAvailable") : t("slotsFull")}
            </Text>
            {item.remainingCapacityQuintals !== null && (
              <Text style={styles.capacity}>
                {t("remainingCapacityLabel").replace(
                  "{n}",
                  String(Math.max(0, item.remainingCapacityQuintals))
                )}
              </Text>
            )}
            {priceRange(item.gradePrices) !== null && (
              <Text style={styles.priceRange}>
                💰 {t("centrePriceRangeLabel").replace("{range}", priceRange(item.gradePrices)!)}
              </Text>
            )}
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
    ...shadow.card,
  },
  starBadge: { marginBottom: spacing.xs },
  starText: { color: colors.accent, fontWeight: "700", fontSize: fontSize.body },
  centreName: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
  metaRow: { flexDirection: "row", gap: spacing.lg },
  meta: { fontSize: fontSize.body, color: colors.textMuted },
  slotsOk: { color: colors.primary, fontWeight: "700" },
  slotsFull: { color: colors.error, fontWeight: "700" },
  capacity: { fontSize: fontSize.body, color: colors.textMuted },
  priceRange: { fontSize: fontSize.body, color: colors.text, fontWeight: "700" },
  pressed: { opacity: 0.7 },
});
