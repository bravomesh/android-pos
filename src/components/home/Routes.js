import React from "react";
import { Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
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
import NotFound from "../notFound/NotFound";
import BackupAdminPanel from "../backup/BackupAdminPanel";
import Dashboard from "../dashboard/Dashboard";

const Routes = () => (
  <RouterRoutes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />

    {/* Dashboard */}
    <Route path="/dashboard" element={<Dashboard />} />

    {/* Sale */}
    <Route path="/sale" element={<SalePage />} />

    {/* Receivings */}
    <Route path="/receivings" element={<ReceivingsPage />} />
    <Route path="/receivings/new" element={<ReceivingFormPage />} />
    <Route path="/receivings/edit/:id" element={<ReceivingFormPage />} />

    {/* Vendor */}
    <Route path="/vendors" element={<VendorsPage />} />
    <Route path="/vendors/new" element={<VendorFormPage />} />
    <Route path="/vendors/edit/:id" element={<VendorFormPage />} />

    {/* Customer */}
    <Route path="/customers" element={<CustomersPage />} />
    <Route path="/customers/new" element={<CustomerFormPage />} />
    <Route path="/customers/edit/:id" element={<CustomerFormPage />} />

    {/* Expense */}
    <Route path="/expense" element={<ExpensesPage />} />
    <Route path="/expense/new" element={<ExpenseFormPage />} />
    <Route path="/expense/edit/:id" element={<ExpenseFormPage />} />

    {/* Expense Type */}
    <Route path="/expensetypes" element={<ExpenseTypesPage />} />
    <Route path="/expensetypes/new" element={<ExpenseTypeFormPage />} />
    <Route path="/expensetypes/edit/:id" element={<ExpenseTypeFormPage />} />

    {/* Product */}
    <Route path="/products" element={<ProductsPage />} />
    <Route path="/products/new" element={<ProductFormPage />} />
    <Route path="/products/edit/:id" element={<ProductFormPage />} />

    {/* Product Type */}
    <Route path="/producttypes" element={<ProductTypesPage />} />
    <Route path="/producttypes/new" element={<ProductTypeFormPage />} />
    <Route path="/producttypes/edit/:id" element={<ProductTypeFormPage />} />

    {/* Backup Admin (hidden) */}
    <Route path="/admin/backup" element={<BackupAdminPanel />} />

    {/* Catch : Not found */}
    <Route path="*" element={<NotFound />} />
  </RouterRoutes>
);

export default Routes;
