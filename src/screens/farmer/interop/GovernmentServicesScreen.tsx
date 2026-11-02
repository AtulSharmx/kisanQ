import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { colors, fontSize, radius, shadow, spacing } from "../../../theme";
import { useLanguage } from "../../../context/LanguageContext";

type Props = NativeStackScreenProps<RootStackParamList, "GovernmentServices">;

export function GovernmentServicesScreen({ navigation }: Props) {
  const { t } = useLanguage();

  return (
    <ScreenContainer showHome={true}>
      <Text style={styles.title}>{t("govServicesTitle")}</Text>
      
      <View style={styles.banner}>
        <Text style={styles.bannerBadge}>{t("govPrototypeBadge")}</Text>
        <Text style={styles.bannerText}>{t("govPrototypeNotice")}</Text>
      </View>

      <View style={styles.quickNavRow}>
        <Pressable
          style={({ pressed }) => [styles.quickNavBtn, pressed && styles.pressed]}
          onPress={() => navigation.navigate("MyApplications")}
        >
          <Text style={styles.quickNavBtnText}>📋 {t("myApplicationsTitle")}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.quickNavBtn, pressed && styles.pressed]}
          onPress={() => navigation.navigate("MyConsents")}
        >
          <Text style={styles.quickNavBtnText}>🛡️ {t("myConsentsTitle")}</Text>
        </Pressable>
      </View>

      <View style={styles.cardList}>
        {/* Service 1: Scheme Portal */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🏛️</Text>
            <View style={styles.cardTitleCol}>
              <Text style={styles.cardTitle}>{t("govSchemePortal")}</Text>
              <Text style={styles.cardSub}>{t("govSchemePortalSub")}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>{t("govSchemePortalDesc")}</Text>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            onPress={() => navigation.navigate("SchemeSelection", { schemeId: "", schemeName: "" })}
          >
            <Text style={styles.actionBtnText}>{t("govBrowseSchemes")}</Text>
          </Pressable>
        </View>

        {/* Service 2: Farmer Registry */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>👤</Text>
            <View style={styles.cardTitleCol}>
              <Text style={styles.cardTitle}>{t("govFarmerRegistry")}</Text>
              <Text style={styles.cardSub}>{t("govFarmerRegistrySub")}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>{t("govFarmerRegistryDesc")}</Text>
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>{t("govConnectedMock")}</Text>
          </View>
        </View>

        {/* Service 3: Procurement System */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🌾</Text>
            <View style={styles.cardTitleCol}>
              <Text style={styles.cardTitle}>{t("govProcurementInterop")}</Text>
              <Text style={styles.cardSub}>{t("govProcurementInteropSub")}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>{t("govProcurementInteropDesc")}</Text>
          <Pressable
            style={({ pressed }) => [styles.actionBtnOutline, pressed && styles.pressed]}
            onPress={() => navigation.navigate("MyApplications")}
          >
            <Text style={styles.actionBtnOutlineText}>{t("govViewUnifiedStatus")}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.header,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  banner: {
    backgroundColor: colors.accentTint,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  bannerBadge: {
    fontSize: 10,
    fontWeight: "900",
    backgroundColor: colors.accent,
    color: colors.text,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  quickNavRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickNavBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    ...shadow.card,
  },
  quickNavBtnText: {
    fontSize: fontSize.body,
    fontWeight: "700",
    color: colors.primary,
  },
  cardList: {
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardTitleCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.label,
    fontWeight: "800",
    color: colors.text,
  },
  cardSub: {
    fontSize: 13,
    color: colors.textMuted,
  },
  cardDesc: {
    fontSize: fontSize.body,
    color: colors.text,
    marginVertical: spacing.xs,
    lineHeight: 20,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  actionBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: fontSize.body,
  },
  actionBtnOutline: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  actionBtnOutlineText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: fontSize.body,
  },
  statusChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.xs,
  },
  statusChipText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
