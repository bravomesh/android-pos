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

const productType = {
  getAll: () => productTypesApi.getAll(),
  get: (id) => productTypesApi.getById(id),
  create: (data) => productTypesApi.create(data),
  update: (id, data) => productTypesApi.update(id, data),
  delete: (id) => productTypesApi.delete(id)
};

const expenseType = {
  getAll: () => expenseTypesApi.getAll(),
  get: (id) => expenseTypesApi.getById(id),
  create: (data) => expenseTypesApi.create(data),
  update: (id, data) => expenseTypesApi.update(id, data),
  delete: (id) => expenseTypesApi.delete(id)
};

const expense = {
  getAll: (params) => expensesApi.getAll(params),
  get: (id) => expensesApi.getById(id),
  create: (data) => expensesApi.create(data),
  update: (id, data) => expensesApi.update(id, data),
  delete: (id) => expensesApi.delete(id)
};

const product = {
  getAll: (params) => productsApi.getAll(params),
  get: (id) => productsApi.getById(id),
  create: (data) => productsApi.create(data),
  update: (id, data) => productsApi.update(id, data),
  delete: (id) => productsApi.delete(id)
};

const customer = {
  getAll: (params) => customersApi.getAll(params),
  get: (id) => customersApi.getById(id),
  create: (data) => customersApi.create(data),
  update: (id, data) => customersApi.update(id, data),
  delete: (id) => customersApi.delete(id)
};

const vendor = {
  getAll: (params) => vendorsApi.getAll(params),
  get: (id) => vendorsApi.getById(id),
  create: (data) => vendorsApi.create(data),
  update: (id, data) => vendorsApi.update(id, data),
  delete: (id) => vendorsApi.delete(id)
};

const receiving = {
  getAll: (params) => receivingsApi.getAll(params),
  get: (id) => receivingsApi.getById(id),
  create: (data) => receivingsApi.create(data),
  update: (id, data) => receivingsApi.update(id, data),
  delete: (id) => receivingsApi.delete(id)
};

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
  getProfitLoss: (startDate, endDate) => reportsApi.getProfitLoss(startDate, endDate)
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
