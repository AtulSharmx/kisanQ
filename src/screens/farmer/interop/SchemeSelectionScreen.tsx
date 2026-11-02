import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { colors, fontSize, radius, shadow, spacing } from "../../../theme";
import { useLanguage } from "../../../context/LanguageContext";
import type { StringKey } from "../../../i18n/strings";

type Props = NativeStackScreenProps<RootStackParamList, "SchemeSelection">;

/**
 * Everything a farmer reads here is a translation key, not a literal string. Scheme and
 * department names stay as they are — they're proper nouns a farmer recognises from the posters
 * and forms already around them, and "translating" PM-KISAN would make it harder to recognise,
 * not easier.
 */
interface SchemeItem {
  id: string;
  /** Proper noun — deliberately not translated. */
  name: string;
  /** Proper noun — deliberately not translated. */
  department: string;
  benefitKey: StringKey;
  requestedFields: StringKey[];
  purposeKey: StringKey;
}

const MOCK_SCHEMES: SchemeItem[] = [
  {
    id: "SCHEME-PMKISAN",
    name: "PM-KISAN Samman Nidhi",
    department: "Department of Agriculture & Farmers Welfare",
    benefitKey: "schemeBenefitPmKisan",
    requestedFields: [
      "fieldFarmerId", "fieldName", "fieldVillage", "fieldDistrict",
      "fieldState", "fieldLandArea", "fieldCrops",
    ],
    purposeKey: "schemePurposePmKisan",
  },
  {
    id: "SCHEME-PMFBY",
    name: "Pradhan Mantri Fasal Bima Yojana",
    department: "Ministry of Agriculture",
    benefitKey: "schemeBenefitPmfby",
    requestedFields: ["fieldFarmerId", "fieldName", "fieldDistrict", "fieldLandArea", "fieldCrops"],
    purposeKey: "schemePurposePmfby",
  },
  {
    id: "SCHEME-FERTILIZER",
    name: "Subsidized Fertilizer Allocation Scheme",
    department: "Department of Fertilizers",
    benefitKey: "schemeBenefitFertilizer",
    requestedFields: ["fieldFarmerId", "fieldName", "fieldDistrict", "fieldLandArea"],
    purposeKey: "schemePurposeFertilizer",
  },
];

export function SchemeSelectionScreen({ navigation }: Props) {
  const { t } = useLanguage();

  const onSelectScheme = (scheme: SchemeItem) => {
    navigation.navigate("ConsentScreen", {
      schemeId: scheme.id,
      schemeName: scheme.name,
      requestedFields: scheme.requestedFields,
      purposeKey: scheme.purposeKey,
    });
  };

  return (
    <ScreenContainer showHome={true}>
      <Text style={styles.title}>{t("schemeListTitle")}</Text>
      <Text style={styles.subtitle}>{t("schemeListSubtitle")}</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {MOCK_SCHEMES.map((scheme) => (
          <View key={scheme.id} style={styles.card}>
            <Text style={styles.dept}>{scheme.department}</Text>
            <Text style={styles.schemeName}>{scheme.name}</Text>
            <Text style={styles.benefit}>🎁 {t(scheme.benefitKey)}</Text>

            <Pressable
              style={({ pressed }) => [styles.applyBtn, pressed && styles.pressed]}
              onPress={() => onSelectScheme(scheme)}
            >
              <Text style={styles.applyBtnText}>{t("schemeApplyNow")}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.header,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  dept: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  schemeName: {
    fontSize: fontSize.label,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  benefit: {
    fontSize: fontSize.body,
    color: colors.text,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  applyBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: fontSize.body,
  },
  pressed: {
    opacity: 0.7,
  },
});
