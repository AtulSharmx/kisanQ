/**
 * Visual style tokens — docs/KisanQ_UIUX_Spec.md "Visual Style" section.
 * Deep green + warm yellow/mustard primary, off-white background, red reserved only for
 * rejected/error states (never decorative). Large text, big touch targets.
 */
export const colors = {
  primary: "#1B5E3A", // deep green
  primaryDark: "#124026",
  primaryTint: "#E7F3EC", // light wash of primary — selected/active card backgrounds
  accent: "#E4A628", // warm mustard yellow
  accentTint: "#FBF1DC", // light wash of accent — warning-style badge backgrounds
  background: "#FBF9F4", // off-white
  surface: "#FFFFFF",
  text: "#1A1A1A",
  textMuted: "#5C5C5C",
  border: "#E1DDD2",
  success: "#1B5E3A",
  error: "#C23B2E", // reserved for rejected/error states only
  errorTint: "#FBEAE8", // light wash of error — error-style badge backgrounds
  disabled: "#C9C5B9",
  white: "#FFFFFF",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

/** Minimum touch target size per the UI/UX spec (~50dp). */
export const touchTarget = 52;

export const fontSize = {
  body: 16,
  label: 18,
  header: 22,
  display: 28,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

/**
 * Cross-platform shadow for elements meant to feel "raised" (info cards, the confirm dialog,
 * floating action buttons) — needs both the shadow* properties (iOS, and web via
 * react-native-web's CSS box-shadow mapping) and elevation (Android), since neither alone
 * covers every surface this app runs on. Don't apply this to repeated list/selection rows
 * (crop pickers, slot grids, queue rows) — a shadow reads as "this one thing floats above the
 * page," not as decoration for every row in a list.
 */
export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  fab: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
};
