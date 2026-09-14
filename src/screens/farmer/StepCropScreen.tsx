import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, radius, spacing, touchTarget } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ProgressDots } from "../../components/ProgressDots";
import { PrimaryButton } from "../../components/PrimaryButton";
import { CROPS } from "../../data/crops";

type Props = NativeStackScreenProps<RootStackParamList, "StepCrop">;

/** Additional Info, Step B: crop icon-picker + quantity stepper (UI/UX spec section 4). */
export function StepCropScreen({ route, navigation }: Props) {
  const { aadhaar, village } = route.params;
  const { t, lang } = useLanguage();
  const [cropType, setCropType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(20);
  const [quantityText, setQuantityText] = useState("20");

  const applyQuantityText = (text: string) => {
    setQuantityText(text);
    const parsed = parseInt(text, 10);
    if (!Number.isNaN(parsed) && parsed > 0) setQuantity(parsed);
  };

  const bumpQuantity = (delta: number) => {
    setQuantity((q) => {
      const next = Math.max(1, q + delta);
      setQuantityText(String(next));
      return next;
    });
  };

  return (
    <ScreenContainer showHome={false}>
      <ProgressDots total={3} current={1} />
      <Text style={styles.title}>{t("stepCropTitle")}</Text>

      <View style={styles.cropGrid}>
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
              {c.labels[lang]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>{t("cropQuantityLabel")}</Text>
      <View style={styles.stepper}>
        <Pressable
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
          onPress={() => bumpQuantity(-1)}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.quantityValue}>{quantity}</Text>
        <Pressable
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
          onPress={() => bumpQuantity(1)}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.manualHint}>{t("cropQuantityManualHint")}</Text>
      <TextInput
        value={quantityText}
        onChangeText={applyQuantityText}
        keyboardType="number-pad"
        style={styles.quantityInput}
      />

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
  cropGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  cropCard: {
    flexBasis: "47%",
    minHeight: touchTarget * 1.3,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  cropCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  cropIcon: { fontSize: 32 },
  cropLabel: { fontSize: fontSize.body, fontWeight: "700", color: colors.text },
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
  manualHint: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.md },
  quantityInput: {
    minHeight: touchTarget,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    fontSize: fontSize.label,
    fontWeight: "700",
    textAlign: "center",
    backgroundColor: colors.surface,
    color: colors.text,
  },
  spacer: { height: spacing.xl },
  pressed: { opacity: 0.7 },
});
