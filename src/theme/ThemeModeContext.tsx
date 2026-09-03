import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { buildTheme, ThemeMode } from "./index";

const STORAGE_KEY = "pos-theme-mode";

const ThemeModeContext = createContext<{ mode: ThemeMode; toggle: () => void }>({
  mode: "light",
  toggle: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() =>
    localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light"
  );

  const value = useMemo(
    () => ({
      mode,
      toggle: () =>
        setMode((m) => {
          const next = m === "light" ? "dark" : "light";
          localStorage.setItem(STORAGE_KEY, next);
          return next;
        }),
    }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={buildTheme(mode)}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
