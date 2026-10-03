import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme, alpha } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/MenuRounded";
import DarkModeIcon from "@mui/icons-material/DarkModeRounded";
import LightModeIcon from "@mui/icons-material/LightModeRounded";
import LogoutIcon from "@mui/icons-material/LogoutRounded";
import StorefrontIcon from "@mui/icons-material/StorefrontRounded";
import { useThemeMode } from "../../theme/ThemeModeContext";
import { duration, easing } from "../../theme/motion";
import { logout } from "../../actions/auth";
import { navItemsFor, NavItem, NavSection } from "./navItems";
import { selectIsAdmin, selectUser } from "../../reducers/auth";

const DRAWER_WIDTH = 264;

// Screens reached from inside another one, so they have no menu entry.
const SUB_PAGES: Record<string, string> = {
  "/producttypes": "Product types",
  "/expensetypes": "Expense types",
};

const isActivePath = (pathname: string, itemPath: string) =>
  pathname === itemPath || pathname.startsWith(`${itemPath}/`);

const today = () =>
  new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

export const BrandMark = ({ size = 40 }: { size?: number }) => (
  <Box
    aria-hidden
    sx={(theme) => ({
      width: size,
      height: size,
      borderRadius: `${size * 0.3}px`,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      color: "#fff",
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #10B981 55%, ${theme.palette.secondary.main} 140%)`,
      boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.35)}`,
    })}
  >
    <StorefrontIcon sx={{ fontSize: size * 0.55 }} />
  </Box>
);

export interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const theme = useTheme();
  const isPermanent = useMediaQuery(theme.breakpoints.up("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { mode, toggle } = useThemeMode();
  const user = useSelector(selectUser);
  const items = navItemsFor(useSelector(selectIsAdmin));

  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = items.find((item) => isActivePath(location.pathname, item.path));
  const subPage = Object.entries(SUB_PAGES).find(([path]) => isActivePath(location.pathname, path))?.[1];
  const title = subPage ?? activeItem?.label ?? "Mobile POS";

  const sections = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    (acc[item.section] ||= []).push(item);
    return acc;
  }, {});

  const handleNavClick = (path: string) => {
    navigate(path);
    if (!isPermanent) setMobileOpen(false);
  };

  const initials = (user?.name || "?").slice(0, 2).toUpperCase();

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 2.5 }}>
        <BrandMark />
        <Box>
          <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
            Mobile POS
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Offline till
          </Typography>
        </Box>
      </Box>

      <Box component="nav" aria-label="Main" sx={{ flex: 1, overflowY: "auto", pb: 2 }}>
        {(Object.keys(sections) as NavSection[]).map((section) => (
          <Box key={section} sx={{ mb: 1 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: "block", px: 3, pt: 1, pb: 0.5, fontSize: "0.68rem" }}
            >
              {section}
            </Typography>
            <List disablePadding>
              {sections[section].map((item) => {
                const active = isActivePath(location.pathname, item.path);
                return (
                  <ListItemButton
                    key={item.path}
                    selected={active}
                    aria-current={active ? "page" : undefined}
                    onClick={() => handleNavClick(item.path)}
                    sx={{
                      minHeight: 48,
                      my: 0.25,
                      position: "relative",
                      overflow: "hidden",
                      // A bar that slides in beside the current screen.
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 10,
                        bottom: 10,
                        width: 4,
                        borderRadius: 4,
                        bgcolor: "primary.main",
                        transform: active ? "scaleY(1)" : "scaleY(0)",
                        transition: `transform ${duration.enter}ms ${easing.spring}`,
                      },
                      "&.Mui-selected": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        color: "primary.main",
                        "& .MuiListItemIcon-root": { color: "primary.main" },
                      },
                      "&.Mui-selected:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.18) },
                      "& .MuiListItemIcon-root": {
                        minWidth: 40,
                        transition: `transform ${duration.quick}ms ${easing.spring}`,
                      },
                      "&:hover .MuiListItemIcon-root": { transform: "translateX(2px) scale(1.08)" },
                    }}
                  >
                    <ListItemIcon aria-hidden>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: active ? 700 : 600 } } }} />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          m: 1.5,
          p: 1.5,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          bgcolor: alpha(theme.palette.primary.main, 0.07),
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 700, width: 38, height: 38 }}>
          {initials}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {user?.name ?? "Signed out"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.role === "Admin" ? "Administrator" : "Cashier"}
          </Typography>
        </Box>
        <Tooltip title="Log out">
          <IconButton aria-label="Log out" onClick={() => dispatch(logout())} sx={{ width: 44, height: 44 }}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: isPermanent ? `calc(100% - ${DRAWER_WIDTH}px)` : "100%",
          ml: isPermanent ? `${DRAWER_WIDTH}px` : 0,
          pt: "env(safe-area-inset-top)",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {!isPermanent && (
            <IconButton aria-label="Open menu" edge="start" onClick={() => setMobileOpen(true)} sx={{ width: 48, height: 48 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box key={title} className="pos-enter" sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap component="h1" sx={{ lineHeight: 1.2 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="p">
              {today()}
            </Typography>
          </Box>
          <Tooltip title={mode === "dark" ? "Light theme" : "Dark theme"}>
            <IconButton
              aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              onClick={toggle}
              sx={{
                width: 48,
                height: 48,
                "& svg": { transition: `transform ${duration.emphasis}ms ${easing.spring}` },
                "&:hover svg": { transform: "rotate(-25deg)" },
              }}
            >
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isPermanent ? "permanent" : "temporary"}
          open={isPermanent ? true : mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, sm: 3 },
          pb: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minWidth: 0,
        }}
      >
        <Toolbar sx={{ mb: 2, mt: "env(safe-area-inset-top)" }} />
        {/* Remounts on every screen change, so each screen rises into place. */}
        <Box key={location.pathname} className="pos-enter">
          {children}
        </Box>
      </Box>
    </Box>
  );
}
