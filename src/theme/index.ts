import { alpha, createTheme, Theme } from "@mui/material/styles";
import { tokens } from "./tokens";
import { duration, easing } from "./motion";

export type ThemeMode = "light" | "dark";

const display = { fontFamily: tokens.font.display, fontVariantNumeric: "tabular-nums" as const };

export const buildTheme = (mode: ThemeMode): Theme => {
  const c = tokens[mode];
  const shadow = (y: number, blur: number, a: number) => `0 ${y}px ${blur}px rgba(${c.shadow}, ${a})`;
  const lift = mode === "light" ? [0.05, 0.08] : [0.35, 0.45];

  return createTheme({
    palette: {
      mode,
      primary: { main: c.primary, light: c.primarySoft, contrastText: mode === "light" ? "#FFFFFF" : "#052E22" },
      // Orange is kept for money actions: Charge, Confirm, Take payment.
      secondary: { main: c.accent, light: c.accentSoft, contrastText: mode === "light" ? "#FFFFFF" : "#2A1205" },
      warning: { main: c.warning },
      error: { main: c.error },
      background: { default: c.bg, paper: c.paper },
      text: { primary: c.textPrimary, secondary: c.textSecondary },
      divider: c.border,
    },
    shape: { borderRadius: tokens.radius },
    // Fluid sizes: each heading scales smoothly between a phone and a large
    // tablet instead of jumping at breakpoints, so screens keep the same
    // proportions at every width.
    typography: {
      fontFamily: tokens.font.body,
      h3: { ...display, fontWeight: 700, fontSize: "clamp(1.9rem, 1.35rem + 2.2vw, 2.9rem)", lineHeight: 1.1 },
      h4: { ...display, fontWeight: 700, letterSpacing: "-0.01em", fontSize: "clamp(1.55rem, 1.25rem + 1.2vw, 2.15rem)", lineHeight: 1.15 },
      h5: { ...display, fontWeight: 700, letterSpacing: "-0.01em", fontSize: "clamp(1.2rem, 1.06rem + 0.6vw, 1.55rem)", lineHeight: 1.2 },
      h6: { ...display, fontWeight: 600, fontSize: "clamp(1.02rem, 0.97rem + 0.25vw, 1.18rem)", lineHeight: 1.3 },
      subtitle1: { fontWeight: 700, fontSize: "clamp(0.95rem, 0.92rem + 0.15vw, 1.02rem)" },
      subtitle2: { fontWeight: 700, fontSize: "clamp(0.86rem, 0.84rem + 0.1vw, 0.92rem)" },
      body1: { fontSize: "clamp(0.95rem, 0.93rem + 0.1vw, 1rem)" },
      body2: { fontSize: "clamp(0.85rem, 0.83rem + 0.1vw, 0.9rem)" },
      caption: { fontSize: "clamp(0.75rem, 0.74rem + 0.05vw, 0.8rem)" },
      button: { ...display, textTransform: "none", fontWeight: 600, letterSpacing: 0 },
      overline: { fontWeight: 700, letterSpacing: "0.08em" },
    },
    transitions: {
      easing: { easeOut: easing.decelerate, easeIn: easing.accelerate, easeInOut: easing.standard, sharp: easing.standard },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontVariantNumeric: "tabular-nums",
            backgroundImage:
              mode === "light"
                ? `radial-gradient(1200px 600px at -10% -10%, ${alpha(c.primary, 0.07)}, transparent 60%),
                   radial-gradient(900px 500px at 110% 0%, ${alpha(c.accent, 0.05)}, transparent 60%)`
                : `radial-gradient(1200px 600px at -10% -10%, ${alpha(c.primary, 0.08)}, transparent 60%)`,
            backgroundAttachment: "fixed",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            minHeight: 44,
            borderRadius: 12,
            paddingInline: 18,
            transition: `transform ${duration.tap}ms ${easing.standard}, background-color ${duration.quick}ms, box-shadow ${duration.quick}ms`,
            "&:active": { transform: "scale(0.97)" },
            variants: [
              { props: { variant: "contained", color: "primary" }, style: { boxShadow: `0 6px 16px ${alpha(c.primary, 0.28)}` } },
              { props: { variant: "contained", color: "secondary" }, style: { boxShadow: `0 6px 16px ${alpha(c.accent, 0.3)}` } },
              { props: { size: "large" }, style: { minHeight: 52, fontSize: "1.05rem" } },
            ],
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: `transform ${duration.tap}ms ${easing.standard}, background-color ${duration.quick}ms`,
            "&:active": { transform: "scale(0.9)" },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius + 4,
            border: `1px solid ${c.border}`,
            boxShadow: `${shadow(1, 2, lift[0])}, ${shadow(8, 24, lift[1])}`,
            transition: `transform ${duration.quick}ms ${easing.standard}, box-shadow ${duration.quick}ms`,
            // Cards that can be tapped rise a little under a mouse, so it is
            // clear what is pressable. Touch screens skip it.
            "@media (hover: hover)": {
              "&:has(> .MuiCardActionArea-root):hover": {
                transform: "translateY(-2px)",
                boxShadow: `${shadow(2, 4, lift[0])}, ${shadow(14, 32, lift[1] * 1.6)}`,
              },
            },
          },
        },
      },
      MuiCardActionArea: {
        styleOverrides: {
          root: {
            transition: `transform ${duration.tap}ms ${easing.standard}`,
            "&:active": { transform: "scale(0.97)" },
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 22,
            animation: `pos-pop-in ${duration.enter}ms ${easing.spring}`,
          },
        },
      },
      MuiDialogTitle: { styleOverrides: { root: { ...display, fontWeight: 700, fontSize: "1.25rem" } } },
      MuiBackdrop: {
        styleOverrides: {
          root: { backdropFilter: "blur(3px)" },
          invisible: { backdropFilter: "none" },
        },
      },
      MuiTextField: { defaultProps: { variant: "outlined", size: "medium" } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: c.paper,
            transition: `box-shadow ${duration.quick}ms`,
            "&.Mui-focused": { boxShadow: `0 0 0 4px ${alpha(c.primary, 0.15)}` },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 700, borderRadius: 10, transition: `all ${duration.quick}ms ${easing.standard}` },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "inherit" },
        styleOverrides: {
          root: {
            backgroundColor: alpha(c.bg, 0.78),
            backdropFilter: "saturate(1.4) blur(14px)",
            borderBottom: `1px solid ${c.border}`,
            color: c.textPrimary,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: { paper: { borderRight: `1px solid ${c.border}`, backgroundColor: c.paper } },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            marginInline: 10,
            transition: `background-color ${duration.quick}ms, color ${duration.quick}ms`,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: c.textSecondary,
          },
          root: { borderColor: c.border },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: { transition: `background-color ${duration.quick}ms` },
        },
      },
      MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 700 } } },
      MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 12,
            transition: `background-color ${duration.quick}ms, color ${duration.quick}ms`,
            "&.Mui-selected": { backgroundColor: alpha(c.primary, 0.14), color: c.primary },
          },
        },
      },
      MuiSkeleton: { defaultProps: { animation: "wave" }, styleOverrides: { root: { borderRadius: 8 } } },
      MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, height: 4 } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 14, alignItems: "center" } } },
      MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontWeight: 600 } } },
    },
  });
};

export { tokens };
