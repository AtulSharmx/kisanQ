import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperatorStackParamList } from "../../navigation/operatorTypes";
import { colors, fontSize, radius, shadow, spacing, touchTarget } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useOperator } from "../../context/OperatorContext";
import { CROPS } from "../../data/crops";
import {
  addCentreCropCapacity,
  increaseCentreCropCapacity,
  listenAdminCentreBreakdown,
  listenCentreCropCapacities,
  OVERLOAD_THRESHOLD_PCT,
  type CentreBreakdown,
  type CentreCropCapacityWithId,
} from "../../services/firestoreService";
import type { Lang } from "../../i18n/strings";

type Props = NativeStackScreenProps<OperatorStackParamList, "AdminDrilldown">;

/**
 * District -> Centre Drill-down — UI/UX spec Admin screen 2. A table grouped by district
 * (rather than a separate district-picker step) since the underlying data is small enough at
 * demo scale to just show everything at once. Overloaded threshold isn't given a specific
 * number in the docs ("above a threshold") — OVERLOAD_THRESHOLD_PCT (80%) is a documented
 * choice, not a spec value.
 */
export function AdminDrilldownScreen({ navigation }: Props) {
  const { t, lang } = useLanguage();
  const { staffName } = useOperator();
  const [rows, setRows] = useState<CentreBreakdown[] | null>(null);
  const [capacityRows, setCapacityRows] = useState<CentreCropCapacityWithId[]>([]);

  useEffect(() => {
    const unsubscribe = listenAdminCentreBreakdown(setRows);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = listenCentreCropCapacities(setCapacityRows);
    return unsubscribe;
  }, []);

  const byDistrict = useMemo(() => {
    if (!rows) return [];
    const groups = new Map<string, CentreBreakdown[]>();
    for (const row of rows) {
      const list = groups.get(row.centre.district) ?? [];
      list.push(row);
      groups.set(row.centre.district, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerAppName}>KisanQ — {t("adminDrilldownTitle")}</Text>
          <Text style={styles.headerStaffName}>{staffName}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate("AdminOverview")}
            style={({ pressed }) => [styles.headerChip, pressed && styles.pressed]}
          >
            <Text style={styles.headerChipText}>{t("backToOverview")}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("AdminSettings")}
            style={({ pressed }) => [styles.headerChip, pressed && styles.pressed]}
          >
            <Text style={styles.headerChipText}>⚙️ {t("adminSettingsLink")}</Text>
          </Pressable>
        </View>
      </View>

      {!rows ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCell, styles.centreCol]}>{t("colCentre")}</Text>
            <Text style={styles.headerCell}>{t("colBookings")}</Text>
            <Text style={styles.headerCell}>{t("statCompleted")}</Text>
            <Text style={styles.headerCell}>{t("colWaiting")}</Text>
            <Text style={styles.headerCell}>{t("colAvgWait")}</Text>
            <Text style={styles.headerCell}>{t("colUtilization")}</Text>
          </View>

          {byDistrict.map(([district, centres]) => (
            <View key={district} style={styles.districtGroup}>
              <Text style={styles.districtLabel}>📍 {district}</Text>
              {centres.map((row) => (
                <View key={row.centre.id} style={styles.centreBlock}>
                  <View style={styles.row}>
                    <Text style={[styles.cell, styles.centreCol, styles.centreName]}>
                      {row.centre.name}
                    </Text>
                    <Text style={styles.cell}>{row.bookings}</Text>
                    <Text style={styles.cell}>{row.completed}</Text>
                    <Text style={styles.cell}>{row.waiting}</Text>
                    <Text style={styles.cell}>{row.averageWaitMinutes}m</Text>
                    <Text style={[styles.cell, row.overloaded && styles.overloadedText]}>
                      {row.utilizationPct}% {row.overloaded ? "⚠️" : ""}
                    </Text>
                  </View>
                  <CentreCapacitySection
                    centreId={row.centre.id}
                    capacities={capacityRows.filter((c) => c.centreId === row.centre.id)}
                    lang={lang}
                  />
                </View>
              ))}
            </View>
          ))}

          <Text style={styles.footnote}>
            {t("overloadedFootnote").replace("{pct}", String(OVERLOAD_THRESHOLD_PCT))}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

/**
 * Daily Buying Capacity — one row per crop this centre has been configured with a capacity for
 * (a centre buying more than one crop on the same day, e.g. wheat and mustard together in Rabi
 * season, needs a separate number per crop — a single centre-wide ceiling can't tell you which
 * crop's capacity is actually the constraint), plus a form to configure a new crop.
 */
function CentreCapacitySection({
  centreId,
  capacities,
  lang,
}: {
  centreId: string;
  capacities: CentreCropCapacityWithId[];
  lang: Lang;
}) {
  const { t } = useLanguage();
  return (
    <View style={styles.capacitySection}>
      {capacities.map((c) => (
        <CapacityRow key={c.id} capacity={c} lang={lang} />
      ))}
      <AddCapacityRow
        centreId={centreId}
        existingCropTypes={capacities.map((c) => c.cropType)}
        lang={lang}
        setCapacityLabel={t("adminSetCapacityLabel")}
        addBtnLabel={t("adminAddBtn")}
      />
    </View>
  );
}

function cropLabel(cropType: string, lang: Lang): string {
  return CROPS.find((c) => c.key === cropType)?.labels[lang] ?? cropType;
}

/**
 * View + manual increase for one already-configured (centre, crop) pair. View-only for the
 * current number (an admin should see the true, possibly-negative value for real oversight —
 * unlike the farmer-facing Centre Selection screen, this is deliberately not clamped to 0); the
 * increase itself is the only change this row can make — an admin can't decrease it directly
 * here, matching the "manual increase only" spec.
 */
function CapacityRow({ capacity, lang }: { capacity: CentreCropCapacityWithId; lang: Lang }) {
  const { t } = useLanguage();
  const [amountText, setAmountText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onIncrease = async () => {
    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t("saveFailed"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await increaseCentreCropCapacity(capacity.centreId, capacity.cropType, amount);
      setAmountText("");
    } catch (e) {
      console.error(e);
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.capacityRow}>
      <Text style={styles.capacityText}>
        🌾 {cropLabel(capacity.cropType, lang)} — {t("adminBuyingCapacityLabel")}:{" "}
        {capacity.remainingCapacityQuintals} / {capacity.dailyCapacityQuintals}{" "}
        {t("adminQtlRemaining")}
      </Text>
      <View style={styles.capacityControls}>
        <TextInput
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="numeric"
          placeholder="+ qtl"
          placeholderTextColor={colors.textMuted}
          style={styles.capacityInput}
        />
        <Pressable
          onPress={onIncrease}
          disabled={saving}
          style={({ pressed }) => [
            styles.capacityBtn,
            saving && styles.capacityBtnDisabled,
            pressed && !saving && styles.pressed,
          ]}
        >
          <Text style={styles.capacityBtnText}>{saving ? "..." : t("adminUpdateBtn")}</Text>
        </Pressable>
      </View>
      {error && <Text style={styles.capacityError}>{error}</Text>}
    </View>
  );
}

/**
 * Configures a new (centre, crop) pair's daily capacity for the first time — the only way a
 * crop becomes capacity-gated at all (see the opt-in note on CentreCropCapacity in
 * types/firestore.ts). Re-picking an already-configured crop is allowed (addCentreCropCapacity
 * treats it as a deliberate reset back to full, not an error) — crops with an existing row are
 * marked with a trailing " •" here so that's a visible, deliberate choice, not an accident.
 */
function AddCapacityRow({
  centreId,
  existingCropTypes,
  lang,
  setCapacityLabel,
  addBtnLabel,
}: {
  centreId: string;
  existingCropTypes: string[];
  lang: Lang;
  setCapacityLabel: string;
  addBtnLabel: string;
}) {
  const { t } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [amountText, setAmountText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAdd = async () => {
    const amount = Number(amountText);
    if (!selectedCrop || !Number.isFinite(amount) || amount <= 0) {
      setError(t("saveFailed"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addCentreCropCapacity(centreId, selectedCrop, amount);
      setSelectedCrop(null);
      setAmountText("");
    } catch (e) {
      console.error(e);
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.addCapacityBlock}>
      <Text style={styles.addCapacityLabel}>{setCapacityLabel}</Text>
      <View style={styles.cropChipRow}>
        {CROPS.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => setSelectedCrop(c.key)}
            style={({ pressed }) => [
              styles.cropChip,
              selectedCrop === c.key && styles.cropChipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.cropChipText, selectedCrop === c.key && styles.cropChipTextActive]}>
              {c.labels[lang]}
              {existingCropTypes.includes(c.key) ? " •" : ""}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.capacityControls}>
        <TextInput
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="numeric"
          placeholder="daily qtl"
          placeholderTextColor={colors.textMuted}
          style={styles.capacityInput}
        />
        <Pressable
          onPress={onAdd}
          disabled={saving}
          style={({ pressed }) => [
            styles.capacityBtn,
            saving && styles.capacityBtnDisabled,
            pressed && !saving && styles.pressed,
          ]}
        >
          <Text style={styles.capacityBtnText}>{saving ? "..." : addBtnLabel}</Text>
        </Pressable>
      </View>
      {error && <Text style={styles.capacityError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerAppName: { fontSize: fontSize.label, fontWeight: "800", color: colors.primary },
  headerStaffName: { fontSize: fontSize.body, color: colors.textMuted, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  headerChip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerChipText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.body },
  content: { padding: spacing.lg, maxWidth: 800, width: "100%", alignSelf: "center" },
  tableHeaderRow: {
    flexDirection: "row",
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  headerCell: { flex: 1, fontWeight: "800", color: colors.textMuted, fontSize: fontSize.body },
  centreCol: { flex: 2 },
  districtGroup: { marginTop: spacing.lg },
  districtLabel: {
    fontSize: fontSize.label,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cell: { flex: 1, color: colors.text, fontSize: fontSize.body },
  centreName: { fontWeight: "700" },
  overloadedText: { color: colors.error, fontWeight: "700" },
  footnote: { marginTop: spacing.lg, color: colors.textMuted, fontSize: fontSize.body },
  centreBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  capacitySection: { gap: spacing.sm },
  capacityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  capacityText: { flex: 1, minWidth: 200, color: colors.textMuted, fontSize: fontSize.body },
  capacityControls: { flexDirection: "row", gap: spacing.sm },
  capacityInput: {
    width: 90,
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.body,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  capacityBtn: {
    minHeight: 40,
    minWidth: touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  capacityBtnDisabled: { opacity: 0.5 },
  capacityBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.body },
  capacityError: { width: "100%", color: colors.error, fontSize: fontSize.body },
  addCapacityBlock: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addCapacityLabel: { fontSize: fontSize.body, color: colors.textMuted },
  cropChipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  cropChip: {
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cropChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  cropChipText: { fontSize: fontSize.body, color: colors.text },
  cropChipTextActive: { color: colors.primary, fontWeight: "700" },
  pressed: { opacity: 0.7 },
});
