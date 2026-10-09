import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { colors, fontSize, radius, shadow, spacing } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "SchemeSelection">;

interface SchemeItem {
  id: string;
  name: string;
  department: string;
  benefit: string;
  requestedFields: string[];
  purpose: string;
}

const MOCK_SCHEMES: SchemeItem[] = [
  {
    id: "SCHEME-PMKISAN",
    name: "PM-KISAN Samman Nidhi",
    department: "Department of Agriculture & Farmers Welfare",
    benefit: "Financial benefit of ₹6,000 per year in 3 equal installments",
    requestedFields: ["Farmer ID", "Name", "Village", "District", "State", "Land Area", "Registered Crops"],
    purpose: "Eligibility verification for direct income support scheme",
  },
  {
    id: "SCHEME-PMFBY",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    department: "Ministry of Agriculture",
    benefit: "Crop insurance coverage against localized natural calamities",
    requestedFields: ["Farmer ID", "Name", "District", "Land Area", "Registered Crops"],
    purpose: "Verification of crop insurance coverage and land details",
  },
  {
    id: "SCHEME-FERTILIZER",
    name: "Subsidized Fertilizer Allocation Scheme",
    department: "Department of Fertilizers",
    benefit: "Direct allocation quota for urea & DAP at subsidized rates",
    requestedFields: ["Farmer ID", "Name", "District", "Land Area"],
    purpose: "Quota calculation for subsidized fertilizer distribution",
  },
];

export function SchemeSelectionScreen({ navigation }: Props) {
  const onSelectScheme = (scheme: SchemeItem) => {
    navigation.navigate("ConsentScreen", {
      schemeId: scheme.id,
      schemeName: scheme.name,
      requestedFields: scheme.requestedFields,
      purpose: scheme.purpose,
    });
  };

  return (
    <ScreenContainer showHome={true}>
      <Text style={styles.title}>Available Government Schemes</Text>
      <Text style={styles.subtitle}>
        Select a scheme to initiate application through connected services.
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {MOCK_SCHEMES.map((scheme) => (
          <View key={scheme.id} style={styles.card}>
            <Text style={styles.dept}>{scheme.department}</Text>
            <Text style={styles.schemeName}>{scheme.name}</Text>
            <Text style={styles.benefit}>🎁 {scheme.benefit}</Text>

            <Pressable
              style={({ pressed }) => [styles.applyBtn, pressed && styles.pressed]}
              onPress={() => onSelectScheme(scheme)}
            >
              <Text style={styles.applyBtnText}>Apply Now →</Text>
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
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: fontSize.body,
  },
  pressed: {
    opacity: 0.7,
  },
});
