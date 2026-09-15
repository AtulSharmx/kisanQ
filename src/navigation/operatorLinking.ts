import type { LinkingOptions } from "@react-navigation/native";
import type { OperatorStackParamList } from "./operatorTypes";
import type { StaffRole } from "../types/firestore";

/**
 * URL routing for the web (Operator/Admin) build.
 *
 * Without this, React Navigation on web keeps the browser URL pinned at "/" on every screen:
 * the address bar never changes, the browser's Back/Forward buttons do nothing, a reload always
 * dumps you back on the first screen, and no screen can be bookmarked or shared. For a portal
 * that staff actually use in a browser that reads as broken, so every screen gets a real path
 * and the browser's own history stack does the work.
 *
 * Route params that aren't part of the path (bookingId, queueId, the weighed quantity, …) are
 * serialized by React Navigation into the query string automatically — which is what makes a
 * mid-procurement screen survive an accidental reload instead of losing the lot in progress.
 *
 * Why one config *per role* rather than one flat map: OperatorNavigator deliberately renders
 * three separate trees (logged out / admin / operator), so a path belonging to another tree can
 * never be navigated to. Feeding React Navigation a config naming screens the current tree
 * doesn't contain makes it build a state for a route that doesn't exist. Splitting the config
 * means an out-of-tree URL simply doesn't match, and the default getStateFromPath falls back to
 * that tree's initial route — an admin pasting an operator URL lands on the Admin Overview
 * instead of on a warning.
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

/** The screen a role lands on, as a URL path — used to clean the address bar after a login/logout. */
export function homePathForRole(role: StaffRole | null): string {
  return `/${Object.values(pathsForRole(role))[0]}`;
}

/** True if `pathname` is a screen the given role can actually reach (so a deep link is worth keeping). */
export function isPathForRole(pathname: string, role: StaffRole | null): boolean {
  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  return Object.values(pathsForRole(role)).includes(normalized);
}

export function operatorLinking(role: StaffRole | null): LinkingOptions<OperatorStackParamList> {
  return {
    // Web-only navigator, so the origin is the only prefix that can ever apply. Guarded for the
    // Jest/node case where `window` isn't defined at import time.
    prefixes: [typeof window !== "undefined" ? window.location.origin : "/"],
    config: {
      // Cast: each per-role map is a partial view of the param list (that's the whole point —
      // see the comment above), which the config type can't express on its own.
      screens: pathsForRole(role) as NonNullable<
        LinkingOptions<OperatorStackParamList>["config"]
      >["screens"],
    },
  };
}
