/**
 * API Index - Mobile POS
 *
 * This module exports the local SQLite-based API instead of HTTP calls.
 * The interface remains the same to minimize changes in React components.
 */

import {
  productsApi,
  productTypesApi,
  customersApi,
  vendorsApi,
  transactionApi,
  receivingsApi,
  expensesApi,
  expenseTypesApi,
  authApi,
  reportsApi
} from './localApi';

// Map to original API structure used by components
const auth = {
  login: async ({ username, password }) => {
    try {
      const response = await authApi.login(username, password);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Invalid credentials');
    }
  }
};

// Every entity below exposes both the modern names (getAll/get/create/...)
// and the legacy HTTP-era names components actually call (fetchAll/
// fetchByPages/fetchById/createNew/searchByIdAndGetByPages). See
// src/api/localApi.js `withLegacyMethods` for how the legacy names are
// implemented on top of the local SQLite services.
const buildEntity = (localEntityApi) => ({
  getAll: (params) => localEntityApi.getAll(params),
  get: (id) => localEntityApi.getById(id),
  create: (data) => localEntityApi.create(data),
  update: (id, data) => localEntityApi.update(id, data),
  delete: (id) => localEntityApi.delete(id),

  fetchAll: () => localEntityApi.fetchAll(),
  fetchByPages: () => localEntityApi.fetchByPages(),
  fetchById: (id) => localEntityApi.fetchById(id),
  createNew: (data) => localEntityApi.createNew(data),
  searchByIdAndGetByPages: (query) => localEntityApi.searchByIdAndGetByPages(query)
});

const productType = buildEntity(productTypesApi);

const expenseType = buildEntity(expenseTypesApi);

const expense = buildEntity(expensesApi);

const product = buildEntity(productsApi);

const customer = {
  ...buildEntity(customersApi),
  getBalance: (id) => customersApi.getBalance(id)
};

const vendor = buildEntity(vendorsApi);

const receiving = buildEntity(receivingsApi);

const transaction = {
  getTransactionId: () => transactionApi.getTransactionId(),
  saveNormalSale: (data) => transactionApi.saveNormalSale(data),
  updateCart: (transactionId, item) => transactionApi.updateCart(transactionId, item),
  removeFromCart: (transactionId, productId) => transactionApi.removeFromCart(transactionId, productId),
  checkoutCounterSale: (transactionId, data) => transactionApi.checkoutCounterSale(transactionId, data),
  checkoutCreditSale: (transactionId, data) => transactionApi.checkoutCreditSale(transactionId, data)
};

const reports = {
  getDashboard: (startDate, endDate) => reportsApi.getDashboard(startDate, endDate),
  getTodaySales: () => reportsApi.getTodaySales(),
  getCreditSales: (startDate, endDate) => reportsApi.getCreditSales(startDate, endDate),
  getExpenses: (startDate, endDate) => reportsApi.getExpenses(startDate, endDate),
  getSalesByProduct: (startDate, endDate) => reportsApi.getSalesByProduct(startDate, endDate),
  getLowStock: (threshold) => reportsApi.getLowStock(threshold),
  getProfitLoss: (startDate, endDate) => reportsApi.getProfitLoss(startDate, endDate),
  getSalesTrend: (startDate, endDate) => reportsApi.getSalesTrend(startDate, endDate)
};

export default {
  auth,
  productType,
  product,
  customer,
  expense,
  expenseType,
  vendor,
  receiving,
  transaction,
  reports
};
