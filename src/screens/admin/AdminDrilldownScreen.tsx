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
import {
  commodityLabelFor,
  commodityUnitFor,
  unitLabel,
  type CommodityOption,
} from "../../data/commodities";
import { GRADES } from "../../data/grades";
import { useCommodities } from "../../hooks/useCommodities";
import {
  addCentreCropCapacity,
  increaseCentreCropCapacity,
  listenAdminCentreBreakdown,
  listenCentreCropCapacities,
  setCentreCropGradePrices,
  OVERLOAD_THRESHOLD_PCT,
  type CentreBreakdown,
  type CentreCropCapacityWithId,
} from "../../services/firestoreService";
import type { Lang } from "../../i18n/strings";

type Props = NativeStackScreenProps<OperatorStackParamList, "AdminDrilldown">;

/**
 * Grouped into one table rather than a district-picker step: at demo scale everything fits on
 * screen at once. The 80% overload threshold is a chosen number — the spec only says "above a
 * threshold".
 */
export function AdminDrilldownScreen({ navigation }: Props) {
  const { t, lang } = useLanguage();
  const { staffName } = useOperator();
  const { commodities } = useCommodities();
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
                    commodities={commodities}
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
 * One row per crop this centre has a capacity configured for, plus a form to add another.
 * Per crop, not per centre: a mandi buying wheat and mustard the same day needs to know which
 * of the two is actually the constraint.
 */
function CentreCapacitySection({
  centreId,
  capacities,
  commodities,
  lang,
}: {
  centreId: string;
  capacities: CentreCropCapacityWithId[];
  commodities: CommodityOption[];
  lang: Lang;
}) {
  const { t } = useLanguage();
  return (
    <View style={styles.capacitySection}>
      {capacities.map((c) => (
        <CapacityRow key={c.id} capacity={c} commodities={commodities} lang={lang} />
      ))}
      <AddCapacityRow
        centreId={centreId}
        existingCropTypes={capacities.map((c) => c.cropType)}
        commodities={commodities}
        lang={lang}
        setCapacityLabel={t("adminSetCapacityLabel")}
        addBtnLabel={t("adminAddBtn")}
      />
    </View>
  );
}

/**
 * Shows the true remaining number, not clamped at 0 like the farmer-facing screen — an admin
 * doing oversight should see a negative. Increase is the only edit offered, per the spec.
 */
function CapacityRow({
  capacity,
  commodities,
  lang,
}: {
  capacity: CentreCropCapacityWithId;
  commodities: CommodityOption[];
  lang: Lang;
}) {
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

  const commodity = commodities.find((c) => c.key === capacity.cropType);
  const unit = commodityUnitFor(capacity.cropType, commodities);

  return (
    <View style={styles.capacityBlock}>
      <View style={styles.capacityRow}>
        <Text style={styles.capacityText}>
          {commodity?.icon ?? "🌾"} {commodityLabelFor(capacity.cropType, commodities, lang)} —{" "}
          {t("adminBuyingCapacityLabel")}: {capacity.remainingCapacityQuintals} /{" "}
          {capacity.dailyCapacityQuintals} {t("adminQtlRemaining")}
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
      <GradePriceRow
        centreId={capacity.centreId}
        cropType={capacity.cropType}
        gradePrices={capacity.gradePrices}
        unitText={unitLabel(unit, lang)}
      />
    </View>
  );
}

/**
 * One ₹ field per grade, typed rather than picked — a grade letter is not a price, so nothing
 * here maps "A" to a number. Empty means no rate published, not zero, and the operator types
 * one free-hand. Merged onto the capacity doc so it can't clobber the remaining count.
 */
function GradePriceRow({
  centreId,
  cropType,
  gradePrices,
  unitText,
}: {
  centreId: string;
  cropType: string;
  gradePrices: Record<string, number> | undefined;
  unitText: string;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The live doc is the source of truth; `draft` only holds grades the admin has actually typed
  // into this session, so another operator's concurrent capacity write doesn't wipe the edit in
  // progress and a saved price doesn't need to be echoed back into local state.
  const valueFor = (grade: string) =>
    draft[grade] ?? (gradePrices?.[grade] != null ? String(gradePrices[grade]) : "");

  const onSave = async () => {
    const merged: Record<string, number> = {};
    for (const grade of GRADES) {
      const text = valueFor(grade).trim();
      if (text === "") continue;
      const price = Number(text);
      if (!Number.isFinite(price) || price <= 0) {
        setError(t("saveFailed"));
        return;
      }
      merged[grade] = price;
    }
    setSaving(true);
    setError(null);
    try {
      await setCentreCropGradePrices(centreId, cropType, merged);
      setDraft({});
    } catch (e) {
      console.error(e);
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.gradePriceBlock}>
      <Text style={styles.addCapacityLabel}>
        {t("adminGradePriceLabel").replace("{unit}", unitText)}
      </Text>
      <View style={styles.gradePriceRow}>
        {GRADES.map((grade) => (
          <View key={grade} style={styles.gradePriceField}>
            <Text style={styles.gradePriceGrade}>{grade}</Text>
            <TextInput
              value={valueFor(grade)}
              onChangeText={(text) => setDraft((d) => ({ ...d, [grade]: text }))}
              keyboardType="numeric"
              placeholder="₹"
              placeholderTextColor={colors.textMuted}
              style={styles.gradePriceInput}
            />
          </View>
        ))}
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.capacityBtn,
            saving && styles.capacityBtnDisabled,
            pressed && !saving && styles.pressed,
          ]}
        >
          <Text style={styles.capacityBtnText}>{saving ? "..." : t("adminSavePricesBtn")}</Text>
        </Pressable>
      </View>
      {error && <Text style={styles.capacityError}>{error}</Text>}
    </View>
  );
}

/**
 * The only way a crop becomes capacity-gated. Re-picking a configured crop resets it to full,
 * which is allowed — already-configured crops carry a trailing " •" so that's a deliberate
 * choice rather than an accident.
 */
function AddCapacityRow({
  centreId,
  existingCropTypes,
  commodities,
  lang,
  setCapacityLabel,
  addBtnLabel,
}: {
  centreId: string;
  existingCropTypes: string[];
  commodities: CommodityOption[];
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
        {commodities.map((c) => (
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
              {selectedCrop === c.key ? "✓ " : ""}
              {commodityLabelFor(c.key, commodities, lang)}
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
  capacityBlock: { gap: spacing.xs },
  gradePriceBlock: { gap: spacing.xs, paddingLeft: spacing.md },
  gradePriceRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  gradePriceField: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  gradePriceGrade: { fontSize: fontSize.body, fontWeight: "800", color: colors.text },
  gradePriceInput: {
    width: 80,
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.body,
    backgroundColor: colors.surface,
    color: colors.text,
  },
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
