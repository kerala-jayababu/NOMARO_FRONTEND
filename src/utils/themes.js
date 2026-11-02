/**
 * UI colour themes.
 * The theme comes from SystemParameters "ColorTheme" (ParameterValue):
 *   - one of the names below (case-insensitive), e.g. GREEN, PURPLE, MAROON
 *   - or any hex colour, e.g. #7B1FA2 (all shades are worked out from it)
 * Unknown values fall back to BLUE (the default look in App.css).
 * Every primary colour below has at least 4.5:1 contrast with white text.
 */
export const THEMES = {
  BLUE: { label: "Blue (default)", primary: "#0d384d" },
  GREEN: {
    label: "Green",
    primary: "#0b5c1e",
    // Kept exactly as the original green theme
    hover: "#094a18",
    hoverBg: "rgba(76, 175, 80, 0.2)",
    textPrimary: "#2d5a3d",
    textSecondary: "#3d6b4f",
    textMuted: "#5a7a66",
    navbarText: "#e0f5e6",
  },
  NAVY: { label: "Navy", primary: "#1e3a8a" },
  ROYALBLUE: { label: "Royal Blue", primary: "#1d4ed8" },
  SKYBLUE: { label: "Sky Blue", primary: "#0369a1" },
  TEAL: { label: "Teal", primary: "#0f766e" },
  INDIGO: { label: "Indigo", primary: "#3730a3" },
  PURPLE: { label: "Purple", primary: "#6b21a8" },
  VIOLET: { label: "Violet", primary: "#7c3aed" },
  MAGENTA: { label: "Magenta", primary: "#a21caf" },
  PINK: { label: "Pink", primary: "#be185d" },
  RED: { label: "Red", primary: "#b91c1c" },
  MAROON: { label: "Maroon", primary: "#7f1d1d" },
  ORANGE: { label: "Orange", primary: "#c2410c" },
  BROWN: { label: "Brown", primary: "#78350f" },
  OLIVE: { label: "Olive", primary: "#4d5d1f" },
  GRAY: { label: "Gray", primary: "#4b5563" },
  SLATE: { label: "Slate", primary: "#334155" },
  BLACK: { label: "Black", primary: "#1f2937" },
};

export const DEFAULT_THEME = "BLUE";

// CSS variables set for every theme other than BLUE (BLUE uses the values in App.css)
const THEME_VARIABLES = [
  "--primary-color", "--primary-light", "--primary-hover", "--primary-hover-bg",
  "--text-primary", "--text-secondary", "--text-muted",
  "--link-color", "--link-hover-color", "--heading-color",
  "--navbar-bg", "--navbar-text", "--navbar-text-hover", "--navbar-title-color",
  "--pagination-active-bg", "--pagination-active-border", "--pagination-active-shadow",
  "--bs-table-hover-bg", "--switch-focus-image",
];

// ── colour helpers ──
const toRgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
};
const toHex = (rgb) => "#" + rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, "0")).join("");
// weight = share of `b` in the mix (0..1)
const mix = (a, b, weight) => {
  const x = toRgb(a);
  const y = toRgb(b);
  return toHex(x.map((c, i) => c * (1 - weight) + y[i] * weight));
};
const rgba = (hex, alpha) => `rgba(${toRgb(hex).join(", ")}, ${alpha})`;

/** Theme for a ColorTheme value: { key, primary, ... }. Unknown values give BLUE. */
export const resolveTheme = (value) => {
  const raw = (value || "").toString().trim();
  const key = raw.toUpperCase().replace(/[\s_-]/g, "");
  if (THEMES[key]) return { key, ...THEMES[key] };
  if (/^#?[0-9a-f]{6}$/i.test(raw)) {
    const hex = "#" + raw.replace("#", "").toLowerCase();
    return { key: "CUSTOM", label: hex, primary: hex };
  }
  return { key: DEFAULT_THEME, ...THEMES[DEFAULT_THEME] };
};

/** All CSS variable values for a theme (shades derived from the primary colour unless given). */
const buildVariables = (theme) => {
  const p = theme.primary;
  const hover = theme.hover || mix(p, "#000000", 0.2);
  return {
    "--primary-color": p,
    "--primary-light": rgba(p, 0.1),
    "--primary-hover": hover,
    "--primary-hover-bg": theme.hoverBg || rgba(mix(p, "#ffffff", 0.35), 0.2),
    "--text-primary": theme.textPrimary || mix(p, "#566a7f", 0.7),
    "--text-secondary": theme.textSecondary || mix(p, "#697a8d", 0.75),
    "--text-muted": theme.textMuted || mix(p, "#8592a3", 0.8),
    "--link-color": p,
    "--link-hover-color": hover,
    "--heading-color": p,
    "--navbar-bg": p,
    "--navbar-text": theme.navbarText || mix(p, "#ffffff", 0.88),
    "--navbar-text-hover": "#ffffff",
    "--navbar-title-color": "#ffffff",
    "--pagination-active-bg": p,
    "--pagination-active-border": p,
    "--pagination-active-shadow": rgba(p, 0.4),
    "--bs-table-hover-bg": theme.hoverBg || rgba(mix(p, "#ffffff", 0.35), 0.2),
    "--switch-focus-image": `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23${p.replace("#", "")}'/%3e%3c/svg%3e")`,
  };
};

/**
 * Applies a theme to <html>:
 *  - class theme-<name> (theme-blue, theme-green, theme-purple, theme-custom …)
 *  - class theme-custom-colors + CSS variables for every theme except BLUE
 * Returns the resolved theme key.
 */
export const applyTheme = (value) => {
  const theme = resolveTheme(value);
  const html = document.documentElement;

  [...html.classList].filter((c) => c.startsWith("theme-")).forEach((c) => html.classList.remove(c));
  html.classList.add(`theme-${theme.key.toLowerCase()}`);

  if (theme.key === DEFAULT_THEME) {
    THEME_VARIABLES.forEach((v) => html.style.removeProperty(v));
  } else {
    html.classList.add("theme-custom-colors");
    Object.entries(buildVariables(theme)).forEach(([name, val]) => html.style.setProperty(name, val));
  }
  return theme.key;
};
