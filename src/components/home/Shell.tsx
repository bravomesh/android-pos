import { ReactNode, useState, MouseEvent } from "react";
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
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme, alpha } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { useThemeMode } from "../../theme/ThemeModeContext";
import { logout } from "../../actions/auth";
import { navItemsFor } from "./navItems";
import { selectIsAdmin, selectUser } from "../../reducers/auth";

const DRAWER_WIDTH = 240;

export interface ShellProps {
  children: ReactNode;
}

const isActivePath = (pathname: string, itemPath: string) =>
  pathname === itemPath || pathname.startsWith(`${itemPath}/`);

export default function Shell({ children }: ShellProps) {
  const theme = useTheme();
  const isPermanent = useMediaQuery(theme.breakpoints.up("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { mode, toggle } = useThemeMode();
  const user = useSelector(selectUser);
  const NAV_ITEMS = navItemsFor(useSelector(selectIsAdmin));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const activeItem =
    NAV_ITEMS.find((item) => isActivePath(location.pathname, item.path)) ??
    NAV_ITEMS[0];

  const handleDrawerToggle = () => setMobileOpen((open) => !open);

  const handleNavClick = (path: string) => {
    navigate(path);
    if (!isPermanent) {
      setMobileOpen(false);
    }
  };

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    dispatch(logout());
  };

  const drawerContent = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Point Of Sale
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(location.pathname, item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => handleNavClick(item.path)}
              sx={{
                minHeight: 48,
                "&.Mui-selected": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  "& .MuiListItemIcon-root": {
                    color: theme.palette.primary.main,
                  },
                },
                "&.Mui-selected:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.18),
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: isPermanent ? `calc(100% - ${DRAWER_WIDTH}px)` : "100%",
          ml: isPermanent ? `${DRAWER_WIDTH}px` : 0,
        }}
      >
        <Toolbar>
          {!isPermanent && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, p: 1.5 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {activeItem.label}
          </Typography>
          <IconButton
            color="inherit"
            aria-label="toggle theme"
            onClick={toggle}
            sx={{ p: 1.5 }}
          >
            {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="account menu"
            onClick={handleMenuOpen}
            sx={{ p: 1.5 }}
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem disabled>
              {user ? `${user.name} (${user.role === "Admin" ? "administrator" : "cashier"})` : ""}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Log out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant={isPermanent ? "permanent" : "temporary"}
          open={isPermanent ? true : mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
