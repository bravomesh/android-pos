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
 * The original HTTP-era components call `fetchAll`, `fetchByPages`,
 * `fetchById`, `createNew` and `searchByIdAndGetByPages` on every entity
 * module (see ApiAutoFetchDatagrid.js / product/customer/vendor/expense/
 * receiving list+form screens). This adds those names on top of the modern
 * `getAll/getById/create/update/delete` object without changing the latter.
 *
 * On-device datasets are small, so `fetchAll`/`fetchByPages` both just
 * return every row with an empty pagination header (getPaginationInfo(undefined)
 * degrades to `{}`, which the datagrid/pagination controls already handle
 * gracefully — footer is hidden, prev/next are inert).
 *
 * `searchByIdAndGetByPages` matches the legacy "type an id or a name" search
 * box behaviour: exact match on `id`, partial (case-insensitive) match on any
 * of `searchFields`.
 */
const BIG_LIMIT = 1000000;

const withLegacyMethods = (baseApi, { supportsPaging = true, searchFields = [] } = {}) => {
  const fetchAll = async () =>
    (supportsPaging ? baseApi.getAll({ limit: BIG_LIMIT }) : baseApi.getAll());

  const searchByIdAndGetByPages = async (query) => {
    const res = await fetchAll();
    const q = String(query).trim().toLowerCase();

    const list = (res.data || []).filter((row) => {
      if (String(row.id).toLowerCase() === q) return true;
      return searchFields.some(
        (field) => row[field] !== undefined && row[field] !== null &&
          String(row[field]).toLowerCase().includes(q)
      );
    });

    return wrapResponse(list);
  };

  return {
    ...baseApi,
    fetchAll,
    fetchByPages: fetchAll,
    fetchById: (id) => baseApi.getById(id),
    createNew: (data) => baseApi.create(data),
    searchByIdAndGetByPages
  };
};

/**
 * Products API
 */
const productsApiBase = {
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
  },

  /** Exact match on a scanned barcode or a typed shelf code. */
  findByCode: async (code) => {
    const product = await ProductsService.findByCode(code);
    return wrapResponse(product);
  },

  /** Breakage, spoilage, theft, or a physical count. */
  adjustStock: async (payload, userId = null) => {
    const result = await ProductsService.adjustStock(payload, userId);
    return wrapResponse(result);
  },

  getStockAdjustments: async (params = {}) => {
    const rows = await ProductsService.getStockAdjustments(params);
    return wrapResponse(rows);
  },

  getStockValuation: async () => {
    const result = await ProductsService.getStockValuation();
    return wrapResponse(result);
  },

  getLowStock: async (threshold = null) => {
    const rows = await ProductsService.getLowStockItems(threshold);
    return wrapResponse(rows);
  }
};

export const productsApi = withLegacyMethods(productsApiBase, {
  searchFields: ['name', 'description', 'sku', 'barcode']
});

/**
 * Product Types API
 */
const productTypesApiBase = {
  getAll: async () => {
    const types = await ProductsService.getAllProductTypes();
    return wrapResponse(types);
  },

  getById: async (id) => {
    const type = await ProductsService.getProductTypeById(id);
    return wrapResponse(type);
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

export const productTypesApi = withLegacyMethods(productTypesApiBase, {
  supportsPaging: false,
  searchFields: ['description']
});

/**
 * Customers API
 */
const customersApiBase = {
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
  },

  receivePayment: async (id, amount) => {
    const balance = await CustomersService.receivePayment(id, amount);
    return wrapResponse(balance);
  }
};

export const customersApi = withLegacyMethods(customersApiBase, {
  searchFields: ['name', 'email', 'mobile', 'address']
});

/**
 * Vendors API
 */
const vendorsApiBase = {
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

export const vendorsApi = withLegacyMethods(vendorsApiBase, {
  searchFields: ['name', 'email', 'mobile', 'address']
});

/**
 * Sales/Transaction API
 *
 * Single-register app: only one sale can be in flight at a time, so the
 * transaction id created by getTransactionId() is kept in module scope and
 * consumed by the next saveNormalSale() call.
 */
let currentTransactionId = null;

export const transactionApi = {
  getTransactionId: async () => {
    const id = await SalesService.initTransaction();
    currentTransactionId = id;
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

  /**
   * Completes the counter sale started by getTransactionId().
   *
   * `sale` (from NormalSale.js) is `{ items, total, taxAmount, totalDiscount,
   * netTotal }` — no transactionId, since this is a single-register app and
   * the id was already stashed by getTransactionId(). `items` are cart lines
   * shaped `{ id, name, qty, price, discount, discountTotal, sellingPrice,
   * totalPrice }`.
   *
   * Each item is persisted via SalesService.updateCart (source of truth for
   * per-line qty/discount/price), then the sale is finalized. Line totals and
   * per-item discounts are re-derived from the persisted lines, but the
   * cart-level tax rate, discount-on-total and amount paid only exist on the
   * cart, so they are forwarded to checkout and stored on the header.
   *
   * `salesType: 'Credit'` routes to checkoutCreditSale, which additionally
   * requires `customerId` and records the outstanding balance against them.
   *
   * The current-transaction register is only cleared on success, so a failed
   * checkout (e.g. insufficient stock) leaves the transaction open for retry
   * and the error propagates to the caller instead of being swallowed.
   */
  saveNormalSale: async (sale) => {
    const transactionId = currentTransactionId;

    if (!transactionId) {
      throw new Error('No active transaction. Please start a new sale.');
    }

    const items = (sale && sale.items) || [];

    // Drop lines the cashier removed since this transaction was opened, so a
    // retry after a failed checkout never resurrects them.
    const keepIds = new Set(items.map((item) => String(item.id)));
    const persisted = await SalesService.getTransactionWithDetails(transactionId);
    for (const line of (persisted && persisted.items) || []) {
      if (!keepIds.has(String(line.product_id))) {
        await SalesService.removeFromCart(transactionId, line.product_id);
      }
    }

    for (const item of items) {
      await SalesService.updateCart(transactionId, {
        productId: item.id,
        qty: item.qty,
        discount: item.discount
      });
    }

    const saleData = {
      tax: sale && sale.tax !== undefined ? String(sale.tax) : '0',
      discountOnTotal: (sale && sale.discountOnTotal) || 0,
      amountPaid: sale ? sale.amountPaid : undefined,
      customerId: sale && sale.customerId
    };

    const result = sale && sale.salesType === 'Credit'
      ? await SalesService.checkoutCreditSale(transactionId, saleData)
      : await SalesService.checkoutCounterSale(transactionId, saleData);

    currentTransactionId = null;

    return wrapResponse(result);
  }
};

/**
 * Receivings API
 */
const receivingsApiBase = {
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

export const receivingsApi = withLegacyMethods(receivingsApiBase, {
  searchFields: ['product_name', 'vendor_name']
});

/**
 * Expenses API
 */
const expensesApiBase = {
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

export const expensesApi = withLegacyMethods(expensesApiBase, {
  searchFields: ['description']
});

/**
 * Expense Types API
 */
const expenseTypesApiBase = {
  getAll: async () => {
    const types = await ExpensesService.getAllExpenseTypes();
    return wrapResponse(types);
  },

  getById: async (id) => {
    const type = await ExpensesService.getExpenseTypeById(id);
    return wrapResponse(type);
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

export const expenseTypesApi = withLegacyMethods(expenseTypesApiBase, {
  supportsPaging: false,
  searchFields: ['description']
});

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
  },

  changePassword: async (id, oldPassword, newPassword) => {
    const result = await UsersService.changePassword(id, oldPassword, newPassword);
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
  },

  getSalesTrend: async (startDate, endDate) => {
    const report = await ReportsService.getSalesTrend(startDate, endDate);
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
