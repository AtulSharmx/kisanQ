import React, { useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, shadow, spacing, touchTarget } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { mockAadhaarLookup } from "../../services/mockAadhaar";

type Props = NativeStackScreenProps<RootStackParamList, "ProfileConfirm">;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/** Profile Confirmation — UI/UX spec screen 3. Auto-filled from the mocked Aadhaar lookup. */
export function ProfileConfirmScreen({ route, navigation }: Props) {
  const { aadhaar } = route.params;
  const { t } = useLanguage();
  const profile = useMemo(() => mockAadhaarLookup(aadhaar), [aadhaar]);

  return (
    <ScreenContainer showHome={false}>
      <Text style={styles.title}>{t("profileConfirmTitle")}</Text>

      <View style={styles.card}>
        <Row label={t("profileName")} value={profile.name} />
        <Row label={t("profileState")} value={profile.state} />
        <Row label={t("profileDistrict")} value={profile.district} />
        <Row label={t("profileAddress")} value={profile.address} />
        <Row label={t("profileMobile")} value={profile.mobile} />
      </View>

      <View style={styles.spacer} />
      <PrimaryButton
        label={t("profileConfirmBtn")}
        onPress={() => navigation.navigate("StepVillage", { aadhaar })}
      />
      <Pressable
        onPress={() => Alert.alert(t("wrongInfoLink"))}
        style={({ pressed }) => [styles.wrongInfo, pressed && styles.pressed]}
      >
        <Text style={styles.wrongInfoText}>✏️ {t("wrongInfoLink")}</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { fontSize: fontSize.body, color: colors.textMuted },
  rowValue: { fontSize: fontSize.body, fontWeight: "700", color: colors.text },
  spacer: { height: spacing.xl },
  wrongInfo: {
    marginTop: spacing.lg,
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  wrongInfoText: { color: colors.primary, fontSize: fontSize.body, textDecorationLine: "underline" },
  pressed: { opacity: 0.7 },
});
