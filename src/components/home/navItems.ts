import { createElement, ReactElement } from "react";
import DashboardIcon from "@mui/icons-material/SpaceDashboardRounded";
import PointOfSaleIcon from "@mui/icons-material/PointOfSaleRounded";
import Inventory2Icon from "@mui/icons-material/Inventory2Rounded";
import PeopleIcon from "@mui/icons-material/PeopleAltRounded";
import LocalShippingIcon from "@mui/icons-material/LocalShippingRounded";
import MoveToInboxIcon from "@mui/icons-material/MoveToInboxRounded";
import ReceiptIcon from "@mui/icons-material/ReceiptLongRounded";
import HistoryIcon from "@mui/icons-material/HistoryRounded";
import BackupIcon from "@mui/icons-material/CloudDoneRounded";
import WarehouseIcon from "@mui/icons-material/WarehouseRounded";
import ManageAccountsIcon from "@mui/icons-material/ManageAccountsRounded";

export type NavSection = "Overview" | "Sell" | "Stock" | "Back office";

export interface NavItem {
  label: string;
  path: string;
  icon: ReactElement;
  section: NavSection;
  /** Cashiers work the till; the back office is for administrators. */
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: createElement(DashboardIcon), section: "Overview", adminOnly: true },
  { label: "Sale", path: "/sale", icon: createElement(PointOfSaleIcon), section: "Sell" },
  { label: "Sales history", path: "/sales", icon: createElement(HistoryIcon), section: "Sell" },
  { label: "Customers", path: "/customers", icon: createElement(PeopleIcon), section: "Sell" },
  { label: "Products", path: "/products", icon: createElement(Inventory2Icon), section: "Stock", adminOnly: true },
  { label: "Stock", path: "/stock", icon: createElement(WarehouseIcon), section: "Stock", adminOnly: true },
  { label: "Receivings", path: "/receivings", icon: createElement(MoveToInboxIcon), section: "Stock", adminOnly: true },
  { label: "Vendors", path: "/vendors", icon: createElement(LocalShippingIcon), section: "Stock", adminOnly: true },
  { label: "Expenses", path: "/expense", icon: createElement(ReceiptIcon), section: "Back office", adminOnly: true },
  { label: "Backup", path: "/admin/backup", icon: createElement(BackupIcon), section: "Back office", adminOnly: true },
  { label: "Users", path: "/users", icon: createElement(ManageAccountsIcon), section: "Back office", adminOnly: true },
];

export const navItemsFor = (isAdmin: boolean) => NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly);

/** Where a user lands after signing in. */
export const homePath = (isAdmin: boolean) => (isAdmin ? "/dashboard" : "/sale");
