import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ProgressDots } from "../../components/ProgressDots";
import { mockAadhaarLookup } from "../../services/mockAadhaar";

type Props = NativeStackScreenProps<RootStackParamList, "StepVillage">;

// Real villages/blocks within the three districts mockAadhaarLookup() can return (Karnal,
// Panipat, Sonipat, Haryana — matching the seeded centres) — picked by the farmer's own
// Aadhaar-derived district instead of one flat list shown to everyone regardless of district.
const VILLAGES_BY_DISTRICT: Record<string, string[]> = {
  Karnal: ["Nissing", "Assandh", "Gharaunda", "Indri", "Nilokheri", "Taraori", "Uchana", "Kunjpura"],
  Panipat: ["Samalkha", "Israna", "Bapoli", "Naultha", "Sanauli", "Madlauda", "Ugra Kheri"],
  Sonipat: ["Gohana", "Rai", "Kharkhoda", "Ganaur", "Julana", "Kathura", "Barota"],
};
const DEFAULT_VILLAGES = VILLAGES_BY_DISTRICT.Karnal;

/** Additional Info, Step A: village — searchable list, not free text (UI/UX spec section 4). */
export function StepVillageScreen({ route, navigation }: Props) {
  const { aadhaar } = route.params;
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  const villages = useMemo(() => {
    const { district } = mockAadhaarLookup(aadhaar);
    return VILLAGES_BY_DISTRICT[district] ?? DEFAULT_VILLAGES;
  }, [aadhaar]);

  const filtered = villages.filter((v) => v.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScreenContainer scroll={false} showHome={false}>
      <ProgressDots total={3} current={0} />
      <Text style={styles.title}>{t("stepVillageTitle")}</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t("villagePlaceholder")}
        placeholderTextColor={colors.textMuted}
        style={styles.search}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            onPress={() => navigation.navigate("StepCrop", { aadhaar, village: item })}
          >
            <Text style={styles.itemText}>{item}</Text>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  search: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
    backgroundColor: colors.surface,
    color: colors.text,
    marginBottom: spacing.md,
  },
  item: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemText: { fontSize: fontSize.label, color: colors.text },
  pressed: { opacity: 0.7 },
});
