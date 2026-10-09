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
      <Text style={styles.title}>{t("govServicesTitle") || "Connected Government Services"}</Text>
      
      <View style={styles.banner}>
        <Text style={styles.bannerBadge}>PROTOTYPE</Text>
        <Text style={styles.bannerText}>
          MOCK GOVERNMENT SYSTEM — PROTOTYPE ONLY
        </Text>
      </View>

      <View style={styles.quickNavRow}>
        <Pressable
          style={({ pressed }) => [styles.quickNavBtn, pressed && styles.pressed]}
          onPress={() => navigation.navigate("MyApplications")}
        >
          <Text style={styles.quickNavBtnText}>📋 {t("myApplicationsTitle") || "My Applications"}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.quickNavBtn, pressed && styles.pressed]}
          onPress={() => navigation.navigate("MyConsents")}
        >
          <Text style={styles.quickNavBtnText}>🛡️ {t("myConsentsTitle") || "My Consents"}</Text>
        </Pressable>
      </View>

      <View style={styles.cardList}>
        {/* Service 1: Scheme Portal */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🏛️</Text>
            <View style={styles.cardTitleCol}>
              <Text style={styles.cardTitle}>Scheme Portal</Text>
              <Text style={styles.cardSub}>Government Subsidies & Benefits</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Apply for agricultural schemes, income support, and crop insurance through verified data sharing.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            onPress={() => navigation.navigate("SchemeSelection", { schemeId: "", schemeName: "" })}
          >
            <Text style={styles.actionBtnText}>Browse Schemes →</Text>
          </Pressable>
        </View>

        {/* Service 2: Farmer Registry */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>👤</Text>
            <View style={styles.cardTitleCol}>
              <Text style={styles.cardTitle}>Farmer Registry</Text>
              <Text style={styles.cardSub}>Verified Identity & Land Records</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Demonstrates interoperability with state farmer databases for automated eligibility checks.
          </Text>
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>● Connected (Mock)</Text>
          </View>
        </View>

        {/* Service 3: Procurement System */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🌾</Text>
            <View style={styles.cardTitleCol}>
              <Text style={styles.cardTitle}>Procurement Interop</Text>
              <Text style={styles.cardSub}>Linked Mandi Status</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Exchanges procurement status with central department systems for unified tracking.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.actionBtnOutline, pressed && styles.pressed]}
            onPress={() => navigation.navigate("MyApplications")}
          >
            <Text style={styles.actionBtnOutlineText}>View Unified Status →</Text>
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
    backgroundColor: "#FFF8E1",
    borderColor: "#FFE082",
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
    color: "#000",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8F6B00",
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
    color: "#FFFFFF",
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
    backgroundColor: "#E8F5E9",
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
