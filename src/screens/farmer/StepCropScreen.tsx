import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, spacing, touchTarget } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ProgressDots } from "../../components/ProgressDots";
import { PrimaryButton } from "../../components/PrimaryButton";

type Props = NativeStackScreenProps<RootStackParamList, "StepCrop">;

// Scope is non-perishable MSP crops only (CLAUDE.md rule 7 / Cross-Questions Reference sec. 3).
const CROPS = [
  { key: "wheat", icon: "🌾", labelHi: "गेहूं", labelEn: "Wheat" },
  { key: "paddy", icon: "🌾", labelHi: "धान", labelEn: "Paddy" },
];

/** Additional Info, Step B: crop icon-picker + quantity stepper (UI/UX spec section 4). */
export function StepCropScreen({ route, navigation }: Props) {
  const { aadhaar, village } = route.params;
  const { t, lang } = useLanguage();
  const [cropType, setCropType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(20);

  return (
    <ScreenContainer showHome={false}>
      <ProgressDots total={3} current={1} />
      <Text style={styles.title}>{t("stepCropTitle")}</Text>

      <View style={styles.cropRow}>
        {CROPS.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => setCropType(c.key)}
            style={({ pressed }) => [
              styles.cropCard,
              cropType === c.key && styles.cropCardActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.cropIcon}>{c.icon}</Text>
            <Text style={styles.cropLabel}>
              {cropType === c.key ? "✓ " : ""}
              {lang === "hi" ? c.labelHi : c.labelEn}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>{t("cropQuantityLabel")}</Text>
      <View style={styles.stepper}>
        <Pressable
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
          onPress={() => setQuantity((q) => Math.max(1, q - 5))}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.quantityValue}>{quantity}</Text>
        <Pressable
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
          onPress={() => setQuantity((q) => q + 5)}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.spacer} />
      <PrimaryButton
        label={t("continueBtn")}
        onPress={() =>
          cropType &&
          navigation.navigate("StepCentre", {
            aadhaar,
            village,
            cropType,
            expectedQuantity: quantity,
          })
        }
        disabled={!cropType}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.lg },
  cropRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl },
  cropCard: {
    flex: 1,
    minHeight: touchTarget * 1.5,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  cropCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  cropIcon: { fontSize: 40 },
  cropLabel: { fontSize: fontSize.label, fontWeight: "700", color: colors.text },
  label: { fontSize: fontSize.body, color: colors.textMuted, marginBottom: spacing.sm },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg },
  stepBtn: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { color: colors.white, fontSize: 28, fontWeight: "700", lineHeight: 30 },
  quantityValue: { fontSize: fontSize.display, fontWeight: "800", color: colors.text, minWidth: 70, textAlign: "center" },
  spacer: { height: spacing.xl },
  pressed: { opacity: 0.7 },
});
