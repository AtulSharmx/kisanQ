import type { LinkingOptions } from "@react-navigation/native";
import type { OperatorStackParamList } from "./operatorTypes";
import type { StaffRole } from "../types/firestore";

/**
 * URL routing for the web build. Without it React Navigation pins the browser URL at "/" — Back
 * and Forward do nothing, a reload dumps you on the first screen and nothing can be bookmarked.
 * Params not in the path (bookingId, queueId, the weighed quantity) go to the query string
 * automatically, which is what lets a mid-procurement screen survive a reload.
 *
 * One config per role, not one flat map: OperatorNavigator renders three separate trees, and
 * naming a screen the current tree doesn't contain makes React Navigation build state for a
 * route that doesn't exist. Split, an out-of-tree URL just doesn't match and falls back to that
 * tree's initial route — an admin pasting an operator URL lands on Admin Overview.
 */
const LOGGED_OUT_PATHS = {
  StaffLogin: "login",
} as const;

const ADMIN_PATHS = {
  AdminOverview: "admin",
  AdminDrilldown: "admin/centres",
  AdminSettings: "admin/settings",
} as const;

const OPERATOR_PATHS = {
  ScanCheckIn: "checkin",
  LiveQueueManagement: "queue",
  Weighing: "weighing",
  QualityCheck: "quality-check",
  OperatorSettings: "settings",
} as const;

function pathsForRole(role: StaffRole | null): Record<string, string> {
  if (!role) return LOGGED_OUT_PATHS;
  return role === "admin" ? ADMIN_PATHS : OPERATOR_PATHS;
}

/** Where a role lands, as a path — used to clean the address bar after login/logout. */
export function homePathForRole(role: StaffRole | null): string {
  return `/${Object.values(pathsForRole(role))[0]}`;
}

/** Whether this role can actually reach `pathname`, i.e. whether the deep link is worth keeping. */
export function isPathForRole(pathname: string, role: StaffRole | null): boolean {
  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  return Object.values(pathsForRole(role)).includes(normalized);
}

export function operatorLinking(role: StaffRole | null): LinkingOptions<OperatorStackParamList> {
  return {
    // Web-only navigator, so the origin is the only prefix. Guarded for import under node.
    prefixes: [typeof window !== "undefined" ? window.location.origin : "/"],
    config: {
      // Cast: each map is a partial view of the param list, which the config type can't express.
      screens: pathsForRole(role) as NonNullable<
        LinkingOptions<OperatorStackParamList>["config"]
      >["screens"],
    },
  };
}
