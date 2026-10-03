// "Market Fresh": emerald for the shop, warm orange kept for money actions
// (Charge, Confirm), mint-tinted surfaces. Every text pairing below is at
// least 4.5:1 in its own theme.
export const tokens = {
  radius: 14,
  font: {
    body: '"Nunito Sans Variable", "Nunito Sans", Roboto, system-ui, sans-serif',
    display: '"Rubik Variable", Rubik, "Nunito Sans Variable", system-ui, sans-serif',
  },
  light: {
    primary: "#047857",
    primarySoft: "#D1FAE5",
    accent: "#C2410C",
    accentSoft: "#FFEDD5",
    bg: "#F3FAF7",
    paper: "#FFFFFF",
    border: "#D5E8DF",
    textPrimary: "#0B2E24",
    textSecondary: "#4B6359",
    warning: "#B45309",
    error: "#DC2626",
    shadow: "11, 46, 36",
  },
  dark: {
    primary: "#34D399",
    primarySoft: "#0F3A2C",
    accent: "#FB923C",
    accentSoft: "#3A2111",
    bg: "#0A1612",
    paper: "#13221D",
    border: "#23382F",
    textPrimary: "#E8F5EF",
    textSecondary: "#9FBDB1",
    warning: "#FBBF24",
    error: "#F87171",
    shadow: "0, 0, 0",
  },
} as const;

export type Palette = (typeof tokens)["light"] | (typeof tokens)["dark"];
