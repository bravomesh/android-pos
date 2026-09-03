import { createElement, ReactElement } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PeopleIcon from "@mui/icons-material/People";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BackupIcon from "@mui/icons-material/Backup";

export interface NavItem {
  label: string;
  path: string;
  icon: ReactElement;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: createElement(DashboardIcon) },
  { label: "Sale", path: "/sale", icon: createElement(PointOfSaleIcon) },
  { label: "Products", path: "/products", icon: createElement(Inventory2Icon) },
  { label: "Customers", path: "/customers", icon: createElement(PeopleIcon) },
  { label: "Vendors", path: "/vendors", icon: createElement(LocalShippingIcon) },
  { label: "Receivings", path: "/receivings", icon: createElement(MoveToInboxIcon) },
  { label: "Expenses", path: "/expense", icon: createElement(ReceiptIcon) },
  { label: "Backup", path: "/admin/backup", icon: createElement(BackupIcon) },
];
