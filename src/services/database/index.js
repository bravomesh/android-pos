/**
 * Database Services Index
 *
 * Central export for all database services.
 * Import from here to access any service.
 */

import DatabaseService from './DatabaseService';
import ProductsService from './ProductsService';
import CustomersService from './CustomersService';
import VendorsService from './VendorsService';
import SalesService from './SalesService';
import ReportsService from './ReportsService';
import ExpensesService from './ExpensesService';
import ReceivingsService from './ReceivingsService';
import UsersService from './UsersService';

// Export individual services
export {
  DatabaseService,
  ProductsService,
  CustomersService,
  VendorsService,
  SalesService,
  ReportsService,
  ExpensesService,
  ReceivingsService,
  UsersService
};

// Export default database service for initialization
export default DatabaseService;
