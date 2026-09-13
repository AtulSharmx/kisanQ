import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ProgressDots } from "../../components/ProgressDots";

type Props = NativeStackScreenProps<RootStackParamList, "StepVillage">;

// Demo village list for the seeded Karnal/Panipat/Sonipat centres. A real build would source
// this from a village master dataset — out of scope for this prototype.
const VILLAGES = [
  "Demo Village",
  "Nissing",
  "Assandh",
  "Gharaunda",
  "Indri",
  "Samalkha",
  "Israna",
  "Gohana",
  "Rai",
];

/** Additional Info, Step A: village — searchable list, not free text (UI/UX spec section 4). */
export function StepVillageScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const filtered = VILLAGES.filter((v) => v.toLowerCase().includes(search.toLowerCase()));

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
            style={styles.item}
            onPress={() => navigation.navigate("StepCrop", { village: item })}
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
});
