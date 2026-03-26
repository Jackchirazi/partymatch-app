export type ThemeKey = "pink" | "purple" | "blue" | "green" | "orange" | "teal";

export type Theme = {
  name: string;
  primary: string;
  primaryHover: string;
  light: string;
  lighter: string;
  text: string;
  textLight: string;
  border: string;
  emoji: string;
};

export const themes: Record<ThemeKey, Theme> = {
  pink: {
    name: "Party Pink",
    primary: "#f43f5e",
    primaryHover: "#e11d48",
    light: "#fff1f2",
    lighter: "#ffe4e6",
    text: "#be123c",
    textLight: "#fb7185",
    border: "#fecdd3",
    emoji: "🌸",
  },
  purple: {
    name: "Midnight",
    primary: "#7c3aed",
    primaryHover: "#6d28d9",
    light: "#f5f3ff",
    lighter: "#ede9fe",
    text: "#5b21b6",
    textLight: "#a78bfa",
    border: "#ddd6fe",
    emoji: "🔮",
  },
  blue: {
    name: "Ocean",
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    light: "#eff6ff",
    lighter: "#dbeafe",
    text: "#1e40af",
    textLight: "#60a5fa",
    border: "#bfdbfe",
    emoji: "🌊",
  },
  green: {
    name: "Jungle",
    primary: "#059669",
    primaryHover: "#047857",
    light: "#ecfdf5",
    lighter: "#d1fae5",
    text: "#065f46",
    textLight: "#34d399",
    border: "#a7f3d0",
    emoji: "🌿",
  },
  orange: {
    name: "Sunset",
    primary: "#ea580c",
    primaryHover: "#c2410c",
    light: "#fff7ed",
    lighter: "#fed7aa",
    text: "#9a3412",
    textLight: "#fb923c",
    border: "#fed7aa",
    emoji: "🔥",
  },
  teal: {
    name: "Deep Teal",
    primary: "#0d9488",
    primaryHover: "#0f766e",
    light: "#f0fdfa",
    lighter: "#ccfbf1",
    text: "#115e59",
    textLight: "#2dd4bf",
    border: "#99f6e4",
    emoji: "✨",
  },
};

export type PartySettings = {
  appName: string;
  tagline: string;
  matchLabel: string;
  theme: ThemeKey;
  blindMode: boolean;
};

export const defaultSettings: PartySettings = {
  appName: "Party Match",
  tagline: "Find your perfect match tonight!",
  matchLabel: "Secret Flame",
  theme: "pink",
  blindMode: false,
};

export function getTheme(key: string): Theme {
  return themes[(key as ThemeKey)] ?? themes.pink;
}
