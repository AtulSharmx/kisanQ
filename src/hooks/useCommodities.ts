/**
 * The one place any screen gets the commodity list from. Subscribes to the live `commodities`
 * collection and merges it over the bundled defaults (see src/data/commodities.ts), so:
 *   - a commodity an admin adds appears in the farmer's picker, the admin's capacity assigner
 *     and the operator's pricing without a rebuild; and
 *   - the app still shows a full, translated picker on an empty/offline Firestore, because the
 *     bundled list is the starting point rather than a fallback that only kicks in on error.
 *
 * `all` includes deactivated commodities (the Admin Settings list needs them to offer
 * reactivation); `commodities` is the sellable subset every other screen should render.
 */
import { useEffect, useState } from "react";
import {
  BUILT_IN_COMMODITIES,
  mergeCommodities,
  type CommodityOption,
} from "../data/commodities";
import { listenCommodities } from "../services/firestoreService";

export interface UseCommoditiesResult {
  /** Active commodities only — what a farmer/admin should be able to pick. */
  commodities: CommodityOption[];
  /** Every commodity, including deactivated ones. */
  all: CommodityOption[];
  /** False once the first snapshot (or the listener's failure) has landed. */
  loading: boolean;
}

export function useCommodities(): UseCommoditiesResult {
  const [all, setAll] = useState<CommodityOption[]>(BUILT_IN_COMMODITIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenCommodities((rows) => {
      setAll(mergeCommodities(rows));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { commodities: all.filter((c) => c.active), all, loading };
}
