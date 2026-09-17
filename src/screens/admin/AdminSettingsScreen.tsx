import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, shadow, spacing, touchTarget } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useOperator } from "../../context/OperatorContext";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { commodityLabel, unitLabel } from "../../data/commodities";
import { useCommodities } from "../../hooks/useCommodities";
import { setCommodityActive, upsertCommodity } from "../../services/firestoreService";
import type { CommodityUnit } from "../../types/firestore";
import type { Lang } from "../../i18n/strings";

type Props = NativeStackScreenProps<OperatorStackParamList, "AdminSettings">;

// Same 12-language list as the Farmer app's SettingsScreen — Admin staff deserve the same
// language choice a farmer gets, not just English/Hindi-mixed screens with no way to switch.
const LANGUAGES: {
  code: Lang;
  labelKey:
    | "langHindi" | "langEnglish" | "langPunjabi" | "langBengali" | "langMarathi" | "langGujarati"
    | "langTelugu" | "langTamil" | "langKannada" | "langMalayalam" | "langOdia" | "langUrdu";
}[] = [
  { code: "hi", labelKey: "langHindi" },
  { code: "en", labelKey: "langEnglish" },
  { code: "pa", labelKey: "langPunjabi" },
  { code: "bn", labelKey: "langBengali" },
  { code: "mr", labelKey: "langMarathi" },
  { code: "gu", labelKey: "langGujarati" },
  { code: "te", labelKey: "langTelugu" },
  { code: "ta", labelKey: "langTamil" },
  { code: "kn", labelKey: "langKannada" },
  { code: "ml", labelKey: "langMalayalam" },
  { code: "or", labelKey: "langOdia" },
  { code: "ur", labelKey: "langUrdu" },
];

/**
 * Language switcher and logout. Only the three Admin screens are wired through i18n so far —
 * the operator's scan/weigh/quality flow is still inline bilingual Hindi+English, so switching
 * here doesn't change it.
 */
export function AdminSettingsScreen({ navigation }: Props) {
  const { t, lang, setLang } = useLanguage();
  const { staffName, logout } = useOperator();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setConfirmingLogout(false);
    setLoggingOut(true);
    await logout();
    // OperatorNavigator swaps to the StaffLogin tree on its own once session clears.
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t("adminSettingsLink")} ({staffName})
        </Text>
        <Pressable
          onPress={() => navigation.navigate("AdminOverview")}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.headerLink}>{t("backToOverview")}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>{t("changeLanguageLabel")}</Text>
        <View style={styles.langCard}>
          {LANGUAGES.map((option) => (
            <Pressable
              key={option.code}
              onPress={() => setLang(option.code)}
              style={({ pressed }) => [
                styles.langRow,
                lang === option.code && styles.langRowActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.langRowText}>
                {lang === option.code ? "✓ " : ""}
                {t(option.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.spacer} />
        <CommoditiesSection />

        <View style={styles.spacer} />
        <PrimaryButton
          label={t("logoutBtn")}
          onPress={() => setConfirmingLogout(true)}
          variant="danger"
          loading={loggingOut}
        />
      </ScrollView>

      <ConfirmDialog
        visible={confirmingLogout}
        title={t("logoutConfirmTitle")}
        confirmLabel={t("logoutConfirmYes")}
        cancelLabel={t("cancelConfirmNo")}
        destructive
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={onLogout}
      />
    </View>
  );
}

const UNITS: CommodityUnit[] = ["quintal", "ton"];

/**
 * The commodity master. A commodity added here is immediately capacity-assignable, pickable,
 * gradeable and bookable, because the doc id an admin creates is the cropType string every
 * other collection keys on.
 *
 * Deactivating is the only removal offered: a commodity with bookings and procurement records
 * against it can't be made never to have existed, and deleting would leave those pointing at
 * nothing. Deactivated rows leave the pickers but stay readable where already referenced.
 */
function CommoditiesSection() {
  const { t, lang } = useLanguage();
  const { all } = useCommodities();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [unit, setUnit] = useState<CommodityUnit>("quintal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAdd = async () => {
    if (name.trim() === "") {
      setError(t("saveFailed"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertCommodity({ key: name, name, icon: icon.trim() || "🌾", unit });
      setName("");
      setIcon("");
    } catch (e) {
      console.error(e);
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Text style={styles.sectionLabel}>{t("adminCommoditiesTitle")}</Text>
      <View style={styles.langCard}>
        {all.map((c) => (
          <View key={c.key} style={styles.commodityRow}>
            <Text style={styles.commodityName}>
              {c.icon} {commodityLabel(c, lang)} · {unitLabel(c.unit, lang)}
              {c.active ? "" : ` · ${t("adminInactiveTag")}`}
            </Text>
            <Pressable
              onPress={() => setCommodityActive(c.key, !c.active).catch((e) => console.error(e))}
              style={({ pressed }) => [styles.commodityToggle, pressed && styles.pressed]}
            >
              <Text style={styles.commodityToggleText}>
                {c.active ? t("adminDeactivateBtn") : t("adminActivateBtn")}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={styles.addLabel}>{t("adminAddCommodityLabel")}</Text>
      <View style={styles.addRow}>
        <TextInput
          value={icon}
          onChangeText={setIcon}
          placeholder={t("adminCommodityIconPlaceholder")}
          placeholderTextColor={colors.textMuted}
          style={[styles.textInput, styles.iconInput]}
        />
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t("adminCommodityNamePlaceholder")}
          placeholderTextColor={colors.textMuted}
          style={[styles.textInput, styles.nameInput]}
        />
      </View>
      <View style={styles.addRow}>
        <Text style={styles.unitLabel}>{t("adminUnitLabel")}:</Text>
        {UNITS.map((u) => (
          <Pressable
            key={u}
            onPress={() => setUnit(u)}
            style={({ pressed }) => [
              styles.unitChip,
              unit === u && styles.unitChipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
              {unit === u ? "✓ " : ""}
              {unitLabel(u, lang)}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={onAdd}
          disabled={saving}
          style={({ pressed }) => [
            styles.addBtn,
            saving && styles.pressed,
            pressed && !saving && styles.pressed,
          ]}
        >
          <Text style={styles.addBtnText}>{saving ? "..." : t("adminAddBtn")}</Text>
        </Pressable>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: fontSize.label, fontWeight: "800", color: colors.text },
  headerLink: { color: colors.primary, fontWeight: "700" },
  content: { padding: spacing.lg, maxWidth: 480, width: "100%", alignSelf: "center" },
  sectionLabel: { fontSize: fontSize.body, color: colors.textMuted, marginBottom: spacing.sm },
  langCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.card,
  },
  langRow: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  langRowActive: { backgroundColor: colors.primaryTint },
  langRowText: { fontSize: fontSize.label, fontWeight: "700", color: colors.text },
  spacer: { height: spacing.xl },
  commodityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commodityName: { flex: 1, fontSize: fontSize.body, color: colors.text, fontWeight: "700" },
  commodityToggle: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  commodityToggleText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.body },
  addLabel: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  addRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  textInput: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.body,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  iconInput: { width: 70, textAlign: "center" },
  nameInput: { flex: 1, minWidth: 140 },
  unitLabel: { fontSize: fontSize.body, color: colors.textMuted },
  unitChip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  unitChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  unitChipText: { fontSize: fontSize.body, color: colors.text },
  unitChipTextActive: { color: colors.primary, fontWeight: "700" },
  addBtn: {
    minHeight: 40,
    minWidth: touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.body },
  error: { color: colors.error, fontSize: fontSize.body },
  pressed: { opacity: 0.7 },
});
