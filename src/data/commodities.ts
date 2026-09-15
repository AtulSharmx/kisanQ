/**
 * The commodity list the whole app picks from, as a *runtime* table rather than a compile-time
 * constant: an admin can add a new commodity from Admin Settings and it immediately becomes
 * selectable in the farmer's crop picker, assignable a per-mandi capacity, gradeable, priceable
 * and bookable — with no code change anywhere.
 *
 * Two sources, merged here:
 *   1. BUILT_IN_COMMODITIES — the ten MSP-covered non-perishables bundled in ./crops.ts, with
 *      hand-written labels in all 12 languages. These exist even on a completely empty Firestore
 *      (a fresh clone with no `npm run seed` still has a working picker), and they're what
 *      scripts/seed.ts writes into commodities/ so an admin can edit them like any other row.
 *   2. commodities/{id} — whatever is actually in Firestore right now, keyed by the same
 *      `key`/`cropType` string. A Firestore doc for a built-in key *overrides* the bundled entry
 *      (so an admin can switch sugarcane from quintals to tonnes, or deactivate a commodity the
 *      state has stopped procuring) rather than being listed twice.
 *
 * Nothing downstream branches on where a commodity came from — `key` is the only identity that
 * matters, and it's the same string used as `Crop.cropType`, `Booking.cropType`, and the second
 * half of a `{centreId}_{cropType}` capacity doc id.
 */
import type { Commodity, CommodityUnit } from "../types/firestore";
import type { Lang } from "../i18n/strings";
import { CROPS } from "./crops";

export interface CommodityOption {
  key: string;
  icon: string;
  unit: CommodityUnit;
  /** English/canonical name — the fallback whenever this commodity has no label for a language. */
  name: string;
  /** Full 12-language labels for the bundled commodities; partial or absent for admin-added ones. */
  labels: Partial<Record<Lang, string>>;
  active: boolean;
}

/**
 * Every bundled commodity is priced per quintal — that's the unit MSP is quoted in for all ten.
 * Sugarcane is the one real-world exception (state advised price is per tonne), but flipping it
 * here would contradict the per-quintal numbers the rest of the demo data uses, so it's left to
 * an admin to change on the commodity row if they want it.
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
      // A Firestore row that carries no labels of its own keeps the bundled translations rather
      // than dropping every language back to the typed English name.
      labels: row.labels && Object.keys(row.labels).length > 0 ? row.labels : builtIn?.labels ?? {},
      active: row.active,
    });
  }
  return Array.from(byKey.values());
}

export function commodityLabel(commodity: CommodityOption, lang: Lang): string {
  return commodity.labels[lang] ?? commodity.name;
}

/**
 * Label for a commodity key when the full option may not be loaded (or may have been deleted) —
 * falls back to the raw key rather than rendering an empty string, so an admin looking at an
 * orphaned capacity row can still tell which commodity it belongs to.
 */
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
