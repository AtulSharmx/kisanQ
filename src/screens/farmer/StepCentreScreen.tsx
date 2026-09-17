import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CommonActions } from "@react-navigation/native";
import { Timestamp } from "firebase/firestore";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ProgressDots } from "../../components/ProgressDots";
import { PrimaryButton } from "../../components/PrimaryButton";
import {
  addCrop,
  listActiveCentres,
  registerFarmer,
  type CentreWithId,
} from "../../services/firestoreService";
import { makeReferenceToken, mockAadhaarLookup } from "../../services/mockAadhaar";

type Props = NativeStackScreenProps<RootStackParamList, "StepCentre">;

/** Additional Info, Step C: preferred centre — the final onboarding step (UI/UX spec sec. 4). */
export function StepCentreScreen({ route, navigation }: Props) {
  const { aadhaar, village, cropType, expectedQuantity } = route.params;
  const { t } = useLanguage();
  const { farmerId, setFarmer } = useFarmer();
  const [centres, setCentres] = useState<CentreWithId[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listActiveCentres()
      .then(setCentres)
      .catch(() => setError(t("noInternet")));
  }, [t]);

  const onFinish = async () => {
    if (!selected || !farmerId) return;
    setSaving(true);
    setError(null);
    try {
      // Must derive from the same aadhaar value ProfileConfirmScreen used, or the profile
      // the farmer just confirmed won't match what gets saved. The raw number only ever
      // lives in navigation params in memory and is dropped when this screen finishes — it
      // is never written to Firestore.
      const profile = mockAadhaarLookup(aadhaar);
      const farmer = {
        name: profile.name,
        mobile: profile.mobile,
        verificationStatus: "verified" as const,
        village,
        district: profile.district,
        state: profile.state,
        createdAt: Timestamp.now(),
      };
      await registerFarmer({
        farmerId,
        name: profile.name,
        mobile: profile.mobile,
        state: profile.state,
        district: profile.district,
        village,
        referenceToken: makeReferenceToken(aadhaar),
      });
      await addCrop({ farmerId, cropType, expectedQuantity, preferredCentreId: selected });
      setFarmer(farmer);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Home" }] }));
    } catch (e) {
      console.error(e);
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scroll={false} showHome={false}>
      <ProgressDots total={3} current={2} />
      <Text style={styles.title}>{t("stepCentreTitle")}</Text>

      {centres === null ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={centres}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.item,
                selected === item.id && styles.itemActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setSelected(item.id)}
            >
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDistrict}>{item.district}</Text>
              </View>
              {selected === item.id && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          )}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton
        label={t("continueBtn")}
        onPress={onFinish}
        disabled={!selected}
        loading={saving}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  item: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  itemActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  itemName: { fontSize: fontSize.label, fontWeight: "700", color: colors.text },
  itemDistrict: { fontSize: fontSize.body, color: colors.textMuted },
  checkmark: { fontSize: fontSize.header, fontWeight: "800", color: colors.primary },
  error: { color: colors.error, textAlign: "center", marginBottom: spacing.sm },
  pressed: { opacity: 0.7 },
  loader: { marginTop: spacing.xl },
});
