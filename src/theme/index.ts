/**
 * Visual style tokens — docs/KisanQ_UIUX_Spec.md "Visual Style" section.
 * Deep green + warm yellow/mustard primary, off-white background, red reserved only for
 * rejected/error states (never decorative). Large text, big touch targets.
 */
export const colors = {
  primary: "#1B5E3A", // deep green
  primaryDark: "#124026",
  accent: "#E4A628", // warm mustard yellow
  background: "#FBF9F4", // off-white
  surface: "#FFFFFF",
  text: "#1A1A1A",
  textMuted: "#5C5C5C",
  border: "#E1DDD2",
  success: "#1B5E3A",
  error: "#C23B2E", // reserved for rejected/error states only
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
