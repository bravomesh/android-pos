import React from "react";
import { useSelector } from "react-redux";
import { Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { selectIsAdmin } from "../../reducers/auth";
import { homePath } from "./navItems";
import CustomersPage from "../customers/CustomersPage";
import CustomerFormPage from "../customers/CustomerFormPage";
import ExpensesPage from "../expense/ExpensesPage";
import ExpenseFormPage from "../expense/ExpenseFormPage";
import ExpenseTypesPage from "../expense/ExpenseTypesPage";
import ExpenseTypeFormPage from "../expense/ExpenseTypeFormPage";
import ReceivingsPage from "../receivings/ReceivingsPage";
import ReceivingFormPage from "../receivings/ReceivingFormPage";
import ProductsPage from "../products/ProductsPage";
import ProductFormPage from "../products/ProductFormPage";
import ProductTypesPage from "../products/ProductTypesPage";
import ProductTypeFormPage from "../products/ProductTypeFormPage";
import VendorsPage from "../vendor/VendorsPage";
import VendorFormPage from "../vendor/VendorFormPage";
import SalePage from "../sale/SalePage";
import SalesHistoryPage from "../sales/SalesHistoryPage";
import NotFound from "../notFound/NotFound";
import BackupAdminPanel from "../backup/BackupAdminPanel";
import Dashboard from "../dashboard/Dashboard";
import StockPage from "../stock/StockPage";
import UsersPage from "../users/UsersPage";
import UserFormPage from "../users/UserFormPage";

// The menu already hides the back office from cashiers; this stops a typed
// or remembered address getting round it.
const AdminOnly = ({ children }) =>
  useSelector(selectIsAdmin) ? children : <Navigate to="/sale" replace />;

const Routes = () => (
  <RouterRoutes>
    <Route path="/" element={<Home />} />

    {/* Dashboard */}
    <Route path="/dashboard" element={<AdminOnly><Dashboard /></AdminOnly>} />

    {/* Sale */}
    <Route path="/sale" element={<SalePage />} />
    <Route path="/sales" element={<SalesHistoryPage />} />

    {/* Receivings */}
    <Route path="/receivings" element={<AdminOnly><ReceivingsPage /></AdminOnly>} />
    <Route path="/receivings/new" element={<AdminOnly><ReceivingFormPage /></AdminOnly>} />
    <Route path="/receivings/edit/:id" element={<AdminOnly><ReceivingFormPage /></AdminOnly>} />

    {/* Vendor */}
    <Route path="/vendors" element={<AdminOnly><VendorsPage /></AdminOnly>} />
    <Route path="/vendors/new" element={<AdminOnly><VendorFormPage /></AdminOnly>} />
    <Route path="/vendors/edit/:id" element={<AdminOnly><VendorFormPage /></AdminOnly>} />

    {/* Customer */}
    <Route path="/customers" element={<CustomersPage />} />
    <Route path="/customers/new" element={<CustomerFormPage />} />
    <Route path="/customers/edit/:id" element={<CustomerFormPage />} />

    {/* Expense */}
    <Route path="/expense" element={<AdminOnly><ExpensesPage /></AdminOnly>} />
    <Route path="/expense/new" element={<AdminOnly><ExpenseFormPage /></AdminOnly>} />
    <Route path="/expense/edit/:id" element={<AdminOnly><ExpenseFormPage /></AdminOnly>} />

    {/* Expense Type */}
    <Route path="/expensetypes" element={<AdminOnly><ExpenseTypesPage /></AdminOnly>} />
    <Route path="/expensetypes/new" element={<AdminOnly><ExpenseTypeFormPage /></AdminOnly>} />
    <Route path="/expensetypes/edit/:id" element={<AdminOnly><ExpenseTypeFormPage /></AdminOnly>} />

    {/* Product */}
    <Route path="/products" element={<AdminOnly><ProductsPage /></AdminOnly>} />
    <Route path="/products/new" element={<AdminOnly><ProductFormPage /></AdminOnly>} />
    <Route path="/products/edit/:id" element={<AdminOnly><ProductFormPage /></AdminOnly>} />

    {/* Stock */}
    <Route path="/stock" element={<AdminOnly><StockPage /></AdminOnly>} />

    {/* Users */}
    <Route path="/users" element={<AdminOnly><UsersPage /></AdminOnly>} />
    <Route path="/users/new" element={<AdminOnly><UserFormPage /></AdminOnly>} />

    {/* Product Type */}
    <Route path="/producttypes" element={<AdminOnly><ProductTypesPage /></AdminOnly>} />
    <Route path="/producttypes/new" element={<AdminOnly><ProductTypeFormPage /></AdminOnly>} />
    <Route path="/producttypes/edit/:id" element={<AdminOnly><ProductTypeFormPage /></AdminOnly>} />

    {/* Backup Admin (hidden) */}
    <Route path="/admin/backup" element={<AdminOnly><BackupAdminPanel /></AdminOnly>} />

    {/* Catch : Not found */}
    <Route path="*" element={<NotFound />} />
  </RouterRoutes>
);

function Home() {
  return <Navigate to={homePath(useSelector(selectIsAdmin))} replace />;
}

export default Routes;
