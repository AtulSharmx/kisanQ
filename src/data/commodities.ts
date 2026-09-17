/**
 * The commodity list every picker in the app reads, merged from two sources:
 *   1. the ten bundled MSP crops in ./crops.ts, with hand-written labels in all 12 languages,
 *      so a fresh clone with no seed still has a working picker;
 *   2. commodities/{id} in Firestore, which overrides a bundled entry with the same key rather
 *      than being listed twice — that's how an admin changes a unit or deactivates a crop.
 *
 * Nothing downstream cares which source a commodity came from. `key` is the only identity, and
 * it's the same string used as Crop.cropType and in a capacity doc id.
 */
import type { Commodity, CommodityUnit } from "../types/firestore";
import type { Lang } from "../i18n/strings";
import { CROPS } from "./crops";

export interface CommodityOption {
  key: string;
  icon: string;
  unit: CommodityUnit;
  /** Canonical name, used whenever there's no label for the current language. */
  name: string;
  /** Full 12-language labels for the bundled commodities; partial or absent for admin-added ones. */
  labels: Partial<Record<Lang, string>>;
  active: boolean;
}

/**
 * All ten are per quintal, the unit MSP is quoted in. Sugarcane is really quoted per tonne, but
 * changing it here would contradict the rest of the demo data — an admin can flip it on the row.
 */
export const BUILT_IN_COMMODITIES: CommodityOption[] = CROPS.map((c) => ({
  key: c.key,
  icon: c.icon,
  unit: "quintal" as const,
  name: c.labels.en,
  labels: c.labels,
  active: true,
}));

/** Firestore rows win over the bundled defaults for the same key; unknown keys are appended. */
export function mergeCommodities(
  fromFirestore: (Commodity & { id: string })[]
): CommodityOption[] {
  const byKey = new Map<string, CommodityOption>(
    BUILT_IN_COMMODITIES.map((c) => [c.key, c])
  );
  for (const row of fromFirestore) {
    const builtIn = byKey.get(row.id);
    byKey.set(row.id, {
      key: row.id,
      icon: row.icon || builtIn?.icon || "🌾",
      unit: row.unit,
      name: row.name,
      // Keep the bundled translations if the row has none, rather than dropping every language
      // back to the typed English name.
      labels: row.labels && Object.keys(row.labels).length > 0 ? row.labels : builtIn?.labels ?? {},
      active: row.active,
    });
  }
  return Array.from(byKey.values());
}

export function commodityLabel(commodity: CommodityOption, lang: Lang): string {
  return commodity.labels[lang] ?? commodity.name;
}

/** Falls back to the raw key, so an orphaned capacity row is still identifiable. */
export function commodityLabelFor(
  key: string,
  commodities: CommodityOption[],
  lang: Lang
): string {
  const found = commodities.find((c) => c.key === key);
  return found ? commodityLabel(found, lang) : key;
}

export function commodityUnitFor(key: string, commodities: CommodityOption[]): CommodityUnit {
  return commodities.find((c) => c.key === key)?.unit ?? "quintal";
}

const UNIT_LABELS: Record<CommodityUnit, Record<Lang, string>> = {
  quintal: {
    hi: "क्विंटल", en: "quintal", pa: "ਕੁਇੰਟਲ", bn: "কুইন্টাল", mr: "क्विंटल", gu: "ક્વિન્ટલ",
    te: "క్వింటాల్", ta: "குவிண்டல்", kn: "ಕ್ವಿಂಟಲ್", ml: "ക്വിന്റൽ", or: "କ୍ୱିଣ୍ଟାଲ", ur: "کوئنٹل",
  },
  ton: {
    hi: "टन", en: "ton", pa: "ਟਨ", bn: "টন", mr: "टन", gu: "ટન", te: "టన్ను", ta: "டன்",
    kn: "ಟನ್", ml: "ടൺ", or: "ଟନ", ur: "ٹن",
  },
};

export function unitLabel(unit: CommodityUnit, lang: Lang): string {
  return UNIT_LABELS[unit][lang];
}
