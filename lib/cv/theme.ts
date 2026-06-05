/**
 * Brand colors shared by the CV preview (web) and the PDF generator.
 *
 * Single source of truth — a rebrand changes one file instead of six.
 */

export const COLORS = {
  navy: {
    DEFAULT: "#0F172A",
    600: "#1E293B",
    400: "#475569",
    100: "#E2E8F0",
    50: "#F1F5F9",
  },
  teal: {
    DEFAULT: "#14B8A6",
    700: "#0F766E",
    400: "#2DD4BF",
    100: "#CCFBF1",
  },
  muted: "#64748B",
  success: "#10B981",
} as const;

// Convenience aliases used heavily by pdf-generator
export const NAVY = COLORS.navy.DEFAULT;
export const TEAL = COLORS.teal.DEFAULT;
export const TEAL_700 = COLORS.teal[700];
export const MUTED = COLORS.muted;
