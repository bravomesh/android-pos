import { createElement, ReactElement } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PeopleIcon from "@mui/icons-material/People";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import ReceiptIcon from "@mui/icons-material/Receipt";
import HistoryIcon from "@mui/icons-material/History";
import BackupIcon from "@mui/icons-material/Backup";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";

export interface NavItem {
  label: string;
  path: string;
  icon: ReactElement;
  /** Cashiers work the till; the back office is for administrators. */
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: createElement(DashboardIcon), adminOnly: true },
  { label: "Sale", path: "/sale", icon: createElement(PointOfSaleIcon) },
  { label: "Sales history", path: "/sales", icon: createElement(HistoryIcon) },
  { label: "Products", path: "/products", icon: createElement(Inventory2Icon), adminOnly: true },
  { label: "Stock", path: "/stock", icon: createElement(WarehouseIcon), adminOnly: true },
  { label: "Customers", path: "/customers", icon: createElement(PeopleIcon) },
  { label: "Vendors", path: "/vendors", icon: createElement(LocalShippingIcon), adminOnly: true },
  { label: "Receivings", path: "/receivings", icon: createElement(MoveToInboxIcon), adminOnly: true },
  { label: "Expenses", path: "/expense", icon: createElement(ReceiptIcon), adminOnly: true },
  { label: "Backup", path: "/admin/backup", icon: createElement(BackupIcon), adminOnly: true },
  { label: "Users", path: "/users", icon: createElement(ManageAccountsIcon), adminOnly: true },
];

export const navItemsFor = (isAdmin: boolean) => NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly);

/** Where a user lands after signing in. */
export const homePath = (isAdmin: boolean) => (isAdmin ? "/dashboard" : "/sale");
