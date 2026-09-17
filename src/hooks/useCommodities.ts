/**
 * Where every screen gets the commodity list. Subscribes to the live collection and merges it
 * over the bundled defaults, so an admin's new commodity appears without a rebuild and an empty
 * or offline Firestore still shows a full translated picker.
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
