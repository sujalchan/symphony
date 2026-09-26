export const presetColors = {
  blue: "#74a8ff",
  violet: "#b392ff",
  teal: "#66d6c6",
  amber: "#f2bb66",
  grey: "#a6a9af",
  coral: "#ff967f",
  rose: "#f3a3c7",
  sage: "#91d5a2",
  indigo: "#909cf4",
} as const;

export type PresetAccent = keyof typeof presetColors;
export type Accent = PresetAccent | "custom";
export type ThemePreference = "system" | "dark" | "light";
export type ColorProfile = { id: string; name: string; color: string };

export const presetNames: Record<PresetAccent, string> = {
  blue: "Pacific",
  violet: "Orchid",
  teal: "Lagoon",
  amber: "Sunset",
  grey: "Graphite",
  coral: "Papaya",
  rose: "Petal",
  sage: "Sage",
  indigo: "Twilight",
};

export const accentChoices: readonly Accent[] = [...(Object.keys(presetColors) as PresetAccent[]), "custom"];

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function readColorProfiles(): ColorProfile[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem("symphony-color-profiles") ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((profile): profile is ColorProfile =>
      profile !== null && typeof profile === "object" &&
      typeof profile.id === "string" && typeof profile.name === "string" &&
      profile.name.trim().length > 0 && isHexColor(profile.color),
    );
  } catch {
    return [];
  }
}
