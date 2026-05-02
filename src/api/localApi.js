/**
 * Local API Adapter
 *
 * This module provides the same API interface as the original HTTP-based API,
 * but routes all calls to local SQLite database services instead.
 *
 * This minimizes changes needed in existing React components.
 */

import {
  ProductsService,
  CustomersService,
  VendorsService,
  SalesService,
  ReportsService,
  ExpensesService,
  ReceivingsService,
  UsersService
} from '../services/database';

/**
 * Wrap service calls to match axios response format
 */
const wrapResponse = (data) => ({
  data,
  status: 200,
  headers: {}
});

/**
 * Products API
 */
export const productsApi = {
  getAll: async (params = {}) => {
    const result = await ProductsService.getAllProducts(params);
    return wrapResponse(result.list);
  },

  getById: async (id) => {
    const product = await ProductsService.getProductById(id);
    return wrapResponse(product);
  },

  create: async (data) => {
    const product = await ProductsService.createProduct(data);
    return wrapResponse(product);
  },

  update: async (id, data) => {
    const product = await ProductsService.updateProduct(id, data);
    return wrapResponse(product);
  },

  delete: async (id) => {
    const result = await ProductsService.deleteProduct(id);
    return wrapResponse(result);
  }
};

/**
 * Product Types API
 */
export const productTypesApi = {
  getAll: async () => {
    const types = await ProductsService.getAllProductTypes();
    return wrapResponse(types);
  },

  create: async (data) => {
    const type = await ProductsService.createProductType(data);
    return wrapResponse(type);
  },

  update: async (id, data) => {
    const type = await ProductsService.updateProductType(id, data);
    return wrapResponse(type);
  },

  delete: async (id) => {
    const result = await ProductsService.deleteProductType(id);
    return wrapResponse(result);
  }
};

/**
 * Customers API
 */
export const customersApi = {
  getAll: async (params = {}) => {
    const result = await CustomersService.getAllCustomers(params);
    return wrapResponse(result.list);
  },

  getById: async (id) => {
    const customer = await CustomersService.getCustomerById(id);
    return wrapResponse(customer);
  },

  create: async (data) => {
    const customer = await CustomersService.createCustomer(data);
    return wrapResponse(customer);
  },

  update: async (id, data) => {
    const customer = await CustomersService.updateCustomer(id, data);
    return wrapResponse(customer);
  },

  delete: async (id) => {
    const result = await CustomersService.deleteCustomer(id);
    return wrapResponse(result);
  },

  getBalance: async (id) => {
    const balance = await CustomersService.getCustomerBalance(id);
    return wrapResponse(balance);
  }
};

/**
 * Vendors API
 */
export const vendorsApi = {
  getAll: async (params = {}) => {
    const result = await VendorsService.getAllVendors(params);
    return wrapResponse(result.list);
  },

  getById: async (id) => {
    const vendor = await VendorsService.getVendorById(id);
    return wrapResponse(vendor);
  },

  create: async (data) => {
    const vendor = await VendorsService.createVendor(data);
    return wrapResponse(vendor);
  },

  update: async (id, data) => {
    const vendor = await VendorsService.updateVendor(id, data);
    return wrapResponse(vendor);
  },

  delete: async (id) => {
    const result = await VendorsService.deleteVendor(id);
    return wrapResponse(result);
  }
};

/**
 * Sales/Transaction API
 */
export const transactionApi = {
  getTransactionId: async () => {
    const id = await SalesService.initTransaction();
    return wrapResponse(id);
  },

  getTransaction: async (id) => {
    const transaction = await SalesService.getTransactionWithDetails(id);
    return wrapResponse(transaction);
  },

  updateCart: async (transactionId, item) => {
    const result = await SalesService.updateCart(transactionId, item);
    return wrapResponse(result);
  },

  removeFromCart: async (transactionId, productId) => {
    const result = await SalesService.removeFromCart(transactionId, productId);
    return wrapResponse(result);
  },

  checkoutCounterSale: async (transactionId, data) => {
    const result = await SalesService.checkoutCounterSale(transactionId, data);
    return wrapResponse(result);
  },

  checkoutCreditSale: async (transactionId, data) => {
    const result = await SalesService.checkoutCreditSale(transactionId, data);
    return wrapResponse(result);
  },

  deleteSale: async (transactionId) => {
    const result = await SalesService.deleteSale(transactionId);
    return wrapResponse(result);
  },

  getTodaySales: async () => {
    const sales = await SalesService.getTodayTransactions();
    return wrapResponse(sales);
  },

  // Alias for saveNormalSale used in original code
  saveNormalSale: async (data) => {
    // This is called from the checkout flow
    // The transaction should already be created, this just completes it
    return wrapResponse({ success: true });
  }
};

/**
 * Receivings API
 */
export const receivingsApi = {
  getAll: async (params = {}) => {
    const result = await ReceivingsService.getAllReceivings(params);
    return wrapResponse(result.list);
  },

  getById: async (id) => {
    const receiving = await ReceivingsService.getReceivingById(id);
    return wrapResponse(receiving);
  },

  create: async (data) => {
    const receiving = await ReceivingsService.createReceiving(data);
    return wrapResponse(receiving);
  },

  update: async (id, data) => {
    const receiving = await ReceivingsService.updateReceiving(id, data);
    return wrapResponse(receiving);
  },

  delete: async (id) => {
    const result = await ReceivingsService.deleteReceiving(id);
    return wrapResponse(result);
  }
};

/**
 * Expenses API
 */
export const expensesApi = {
  getAll: async (params = {}) => {
    const result = await ExpensesService.getAllExpenses(params);
    return wrapResponse(result.list);
  },

  getById: async (id) => {
    const expense = await ExpensesService.getExpenseById(id);
    return wrapResponse(expense);
  },

  create: async (data) => {
    const expense = await ExpensesService.createExpense(data);
    return wrapResponse(expense);
  },

  update: async (id, data) => {
    const expense = await ExpensesService.updateExpense(id, data);
    return wrapResponse(expense);
  },

  delete: async (id) => {
    const result = await ExpensesService.deleteExpense(id);
    return wrapResponse(result);
  }
};

/**
 * Expense Types API
 */
export const expenseTypesApi = {
  getAll: async () => {
    const types = await ExpensesService.getAllExpenseTypes();
    return wrapResponse(types);
  },

  create: async (data) => {
    const type = await ExpensesService.createExpenseType(data);
    return wrapResponse(type);
  },

  update: async (id, data) => {
    const type = await ExpensesService.updateExpenseType(id, data);
    return wrapResponse(type);
  },

  delete: async (id) => {
    const result = await ExpensesService.deleteExpenseType(id);
    return wrapResponse(result);
  }
};

/**
 * Users API
 */
export const usersApi = {
  getAll: async () => {
    const users = await UsersService.getAllUsers();
    return wrapResponse(users);
  },

  getById: async (id) => {
    const user = await UsersService.getUserById(id);
    return wrapResponse(user);
  },

  create: async (data) => {
    const user = await UsersService.createUser(data);
    return wrapResponse(user);
  },

  update: async (id, data) => {
    const user = await UsersService.updateUser(id, data);
    return wrapResponse(user);
  },

  delete: async (id) => {
    const result = await UsersService.deleteUser(id);
    return wrapResponse(result);
  }
};

/**
 * Auth API
 */
export const authApi = {
  login: async (username, password) => {
    const user = await UsersService.authenticate(username, password);

    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Generate a simple token for local use
    const token = btoa(JSON.stringify({
      userId: user.id,
      username: user.name,
      role: user.role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }));

    return wrapResponse({
      authToken: token,
      refreshToken: token,
      user
    });
  }
};

/**
 * Reports API
 */
export const reportsApi = {
  getDashboard: async (startDate, endDate) => {
    const metrics = await ReportsService.getDashboardMetrics(startDate, endDate);
    return wrapResponse(metrics);
  },

  getTodaySales: async () => {
    const report = await ReportsService.getTodaySales();
    return wrapResponse(report);
  },

  getCreditSales: async (startDate, endDate) => {
    const report = await ReportsService.getCreditSales(startDate, endDate);
    return wrapResponse(report);
  },

  getExpenses: async (startDate, endDate) => {
    const report = await ReportsService.getExpenseReport(startDate, endDate);
    return wrapResponse(report);
  },

  getSalesByProduct: async (startDate, endDate) => {
    const report = await ReportsService.getSalesByProduct(startDate, endDate);
    return wrapResponse(report);
  },

  getLowStock: async (threshold) => {
    const report = await ReportsService.getLowStockItems(threshold);
    return wrapResponse(report);
  },

  getProfitLoss: async (startDate, endDate) => {
    const report = await ReportsService.getProfitLossReport(startDate, endDate);
    return wrapResponse(report);
  }
};

/**
 * Default export combining all APIs
 */
const api = {
  products: productsApi,
  productTypes: productTypesApi,
  customers: customersApi,
  vendors: vendorsApi,
  transaction: transactionApi,
  receivings: receivingsApi,
  expenses: expensesApi,
  expenseTypes: expenseTypesApi,
  users: usersApi,
  auth: authApi,
  reports: reportsApi
};

export default api;
