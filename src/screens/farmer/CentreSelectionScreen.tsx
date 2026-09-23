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
import { formatIndianNumber, mspFor } from "../../config/msp";
import { unitLabel } from "../../data/commodities";

type Props = NativeStackScreenProps<RootStackParamList, "CentreSelection">;

interface Ranked {
  centre: CentreWithId;
  distanceKm: number;
  waitMinutes: number;
  hasSlots: boolean;
  /** null = this centre hasn't been configured with a capacity limit for this crop at all —
   * shown as "no limit tracked", not "0 available". */
  remainingCapacityQuintals: number | null;
}

/** Centre Selection — UI/UX spec screen 7. Ranked list, not map-first. */
export function CentreSelectionScreen({ route, navigation }: Props) {
  const { cropType, expectedQuantity } = route.params;
  const { t, lang } = useLanguage();
  const { farmerId } = useFarmer();
  // MSP is one fixed government price for the crop — the same at every centre — so it's looked
  // up once from src/config/msp.ts, never per centre. null = no verified MSP configured for this
  // crop yet (see the TODO there), in which case no MSP line is shown rather than a guess.
  const msp = mspFor(cropType);
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
          };
        })
      );
      withStats.sort((a, b) => a.waitMinutes - b.waitMinutes || a.distanceKm - b.distanceKm);
      setRanked(withStats);
    });
  }, [farmerId, cropType]);

  // Live remaining capacity for the one crop this farmer is bringing — the piece of this
  // screen's data a farmer benefits from seeing update without reloading (an Accept elsewhere or
  // an admin's manual increase lands here within the same second). Merged into the already-ranked list
  // rather than recomputing distance/wait/hasSlots, which don't change live.
  useEffect(() => {
    const unsubscribe = listenCropCapacityAcrossCentres(cropType, (byCentreId) => {
      setRanked((prev) =>
        prev
          ? prev.map((r) => {
              const capacity = byCentreId[r.centre.id];
              return capacity
                ? { ...r, remainingCapacityQuintals: capacity.remainingCapacityQuintals }
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
            {msp !== null && (
              <Text style={styles.msp}>
                💰{" "}
                {t("centreMspLabel")
                  .replace("{msp}", formatIndianNumber(msp))
                  .replace("{unit}", unitLabel("quintal", lang))}
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
  msp: { fontSize: fontSize.body, color: colors.text, fontWeight: "700" },
  pressed: { opacity: 0.7 },
});
