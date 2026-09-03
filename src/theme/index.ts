import { createTheme, Theme } from "@mui/material/styles";
import { tokens } from "./tokens";

export type ThemeMode = "light" | "dark";

export const buildTheme = (mode: ThemeMode): Theme => {
  const c = tokens[mode];
  return createTheme({
    palette: {
      mode,
      primary: { main: c.primary },
      secondary: { main: c.secondary },
      background: { default: c.bg, paper: c.paper },
      text: { primary: c.textPrimary, secondary: c.textSecondary },
    },
    shape: { borderRadius: tokens.radius },
    typography: {
      fontFamily: tokens.font,
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { minHeight: 44, borderRadius: tokens.radius },
        },
        defaultProps: { disableElevation: true },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius + 4,
            boxShadow:
              mode === "light"
                ? "0 1px 2px rgba(15,23,42,.06), 0 4px 12px rgba(15,23,42,.08)"
                : "0 1px 2px rgba(0,0,0,.4), 0 4px 12px rgba(0,0,0,.5)",
          },
        },
      },
      MuiTextField: { defaultProps: { variant: "outlined", size: "medium" } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    },
  });
};

export { tokens };
