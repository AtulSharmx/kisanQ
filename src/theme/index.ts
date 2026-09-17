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
 * Raised-element shadow. Needs both the shadow* props (iOS and web) and elevation (Android) —
 * neither alone covers every surface this app runs on. Not for repeated list rows: a shadow
 * means "this one thing floats", not decoration for every row.
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
