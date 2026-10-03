/**
 * A sample baby shop to explore the app with: categories, products,
 * suppliers (some delivered on credit), customers (some buying on
 * account), deliveries, expenses and a week of sales. A new install starts
 * with it; the owner can clear it from the Backup screen.
 *
 * Everything goes in through the same services the screens use, so the
 * sample behaves exactly like real trading (stock moves, balances add up,
 * reports agree). Only an empty shop can be filled, so it can never mix
 * into real records.
 */
import db from '../database/DatabaseService';
import api from '../../api';

const TYPES = ['Diapers & wipes', 'Feeding', 'Clothing', 'Bath & care', 'Toys', 'Nursery', 'Services'];

// name, type, cost, price, opening stock, reorder level, unit
const PRODUCTS = [
  ['Pampers Baby-Dry Size 3 (44)', 'Diapers & wipes', 1350, 1650, 18, 6, 'pack'],
  ['Huggies Newborn (48)', 'Diapers & wipes', 1750, 2100, 9, 5, 'pack'],
  ['Molfix Size 4 (36)', 'Diapers & wipes', 1050, 1300, 4, 6, 'pack'],
  ['Baby wipes (72)', 'Diapers & wipes', 290, 380, 40, 12, 'pack'],
  ['Diaper rash cream 100g', 'Diapers & wipes', 480, 650, 15, 5],
  ['NAN 1 infant formula 400g', 'Feeding', 1600, 1950, 12, 4],
  ['Feeding bottle 250ml', 'Feeding', 520, 750, 20, 6],
  ['Sippy cup with handles', 'Feeding', 380, 550, 14, 4],
  ['Baby cereal 400g', 'Feeding', 520, 680, 3, 5],
  ['Bibs (3-pack)', 'Feeding', 300, 450, 16, 5, 'pack'],
  ['Onesies 0-3m (3-pack)', 'Clothing', 850, 1200, 10, 4, 'pack'],
  ['Bodysuit 6-12m', 'Clothing', 450, 650, 12, 4],
  ['Baby socks (3-pack)', 'Clothing', 220, 350, 25, 8, 'pack'],
  ['Knitted baby hat', 'Clothing', 280, 450, 8, 3],
  ['Baby shampoo 200ml', 'Bath & care', 380, 520, 18, 6],
  ['Baby lotion 200ml', 'Bath & care', 300, 420, 0, 5],
  ['Hooded bath towel', 'Bath & care', 800, 1100, 7, 3],
  ['Silicone teether', 'Toys', 220, 350, 22, 6],
  ['Soft plush bunny', 'Toys', 620, 900, 9, 3],
  ['Activity rattle set', 'Toys', 400, 600, 11, 4, 'pack'],
  ['Cot sheet (fitted)', 'Nursery', 1050, 1450, 6, 2],
  ['Muslin swaddle blanket', 'Nursery', 900, 1300, 10, 3],
  ['Baby carrier', 'Nursery', 3400, 4500, 3, 1],
  ['Gift wrapping', 'Services', 0, 150, 0, null, 'service'],
];

const VENDORS = [
  ['Little Steps Distributors', 'Diapers and wipes', 'Industrial Area, Nairobi', '0722 410 118'],
  ['Mama Care Wholesale', 'Formula, feeding and bath', 'Ngara, Nairobi', '0733 552 907'],
  ['Tiny Threads Garments', 'Baby clothing', 'Eastleigh, Nairobi', '0711 263 540'],
  ['Cuddle Toys & Nursery', 'Toys and nursery', 'Westlands, Nairobi', '0745 981 302'],
];

const CUSTOMERS = [
  ['Wanjiru Kamau', 'Twins due in March', 'Kilimani', '0712 345 678'],
  ['Aisha Mohamed', 'Prefers Huggies', 'South C', '0723 456 789'],
  ['Brian Otieno', '', 'Ngong Road', '0734 567 890'],
  ['Grace Achieng', 'Daycare owner, buys in bulk', 'Lavington', '0745 678 901'],
];

const EXPENSES = [
  ['Rent', 'Shop rent', 2500, 6],
  ['Electricity', 'Power tokens', 600, 5],
  ['Transport', 'Delivery from Industrial Area', 450, 4],
  ['Packaging', 'Gift bags and paper', 800, 3],
  ['Transport', 'Boda to customer', 200, 1],
];

// What the week's customers bought: [product name, quantity] per sale.
const BASKETS = [
  [['Pampers Baby-Dry Size 3 (44)', 1], ['Baby wipes (72)', 2]],
  [['NAN 1 infant formula 400g', 2], ['Feeding bottle 250ml', 1]],
  [['Onesies 0-3m (3-pack)', 1], ['Baby socks (3-pack)', 2], ['Gift wrapping', 1]],
  [['Huggies Newborn (48)', 1], ['Diaper rash cream 100g', 1]],
  [['Soft plush bunny', 1], ['Silicone teether', 1], ['Gift wrapping', 1]],
  [['Baby shampoo 200ml', 1], ['Hooded bath towel', 1]],
  [['Baby wipes (72)', 3]],
  [['Muslin swaddle blanket', 1], ['Knitted baby hat', 1]],
  [['Pampers Baby-Dry Size 3 (44)', 2]],
  [['Sippy cup with handles', 1], ['Bibs (3-pack)', 1]],
  [['Bodysuit 6-12m', 2], ['Baby socks (3-pack)', 1]],
  [['Activity rattle set', 1], ['Silicone teether', 1]],
  [['NAN 1 infant formula 400g', 1], ['Baby cereal 400g', 1]],
  [['Cot sheet (fitted)', 1]],
  [['Pampers Baby-Dry Size 3 (44)', 1], ['Baby wipes (72)', 1], ['Diaper rash cream 100g', 1]],
  [['Baby carrier', 1]],
];

const daysAgo = (days, hour) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, (days * 17 + hour * 7) % 60, 0, 0);
  // Today's sample sales cannot be later than now.
  const now = Date.now();
  return d.getTime() > now ? new Date(now - (hour + 1) * 6 * 60 * 1000) : d;
};

const localDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export async function isShopEmpty() {
  const rows = await db.query('SELECT COUNT(*) AS n FROM products');
  return (rows[0]?.n || 0) === 0;
}

/**
 * Fill an empty shop with the sample. `cashierId` is who the sample
 * sales are booked to (the owner loading it).
 * @param {number | null} [cashierId]
 */
export async function loadSampleShop(cashierId = null) {
  if (!(await isShopEmpty())) {
    throw new Error('The sample can only be loaded into an empty shop');
  }

  const typeIds = {};
  for (const description of TYPES) {
    typeIds[description] = (await api.productType.createNew({ description })).data.id;
  }

  const products = {};
  for (const [index, [name, type, cost, price, stock, reorder, unit = 'pcs']] of PRODUCTS.entries()) {
    const product = (
      await api.product.createNew({
        name,
        productTypeId: typeIds[type],
        costPrice: cost,
        sellingPrice: price,
        openingStock: stock,
        reorderLevel: reorder,
        unit,
        trackStock: unit !== 'service',
        sku: `BB-${String(index + 1).padStart(3, '0')}`,
        barcode: unit === 'service' ? '' : String(6009801000000 + index * 37),
      })
    ).data;
    products[name] = product;
  }

  const vendors = [];
  for (const [name, description, address, mobile] of VENDORS) {
    vendors.push((await api.vendor.createNew({ name, description, address, mobile })).data);
  }

  const customers = [];
  for (const [name, description, address, mobile] of CUSTOMERS) {
    customers.push((await api.customer.createNew({ name, description, address, mobile })).data);
  }

  // Deliveries earlier in the week, each from the supplier of that line.
  // Some were taken on credit: amount paid less than the delivery cost
  // (undefined means paid in full).
  const deliveries = [
    ['Pampers Baby-Dry Size 3 (44)', 0, 12, 1350, 6, 10000],
    ['Baby wipes (72)', 0, 24, 290, 6, undefined],
    ['NAN 1 infant formula 400g', 1, 6, 1600, 5, 0],
    ['Baby shampoo 200ml', 1, 10, 380, 5, undefined],
    ['Onesies 0-3m (3-pack)', 2, 6, 850, 4, undefined],
    ['Soft plush bunny', 3, 4, 620, 3, 1000],
  ];
  for (const [name, vendor, qty, price, ago, amountPaid] of deliveries) {
    await api.receiving.createNew({
      productId: products[name].id,
      vendorId: vendors[vendor].id,
      qty,
      price,
      amountPaid,
      payedAt: localDate(daysAgo(ago, 9)),
    });
  }
  // The formula supplier has since been paid part of what is owed.
  await api.vendor.payVendor(vendors[1].id, 4000);

  const expenseTypes = {};
  for (const [type, description, amount, ago] of EXPENSES) {
    expenseTypes[type] ??= (await api.expenseType.createNew({ description: type })).data.id;
    await api.expense.createNew({ amount, description, expenseTypeId: expenseTypes[type], spentAt: localDate(daysAgo(ago, 10)) });
  }

  await api.product.adjustStock(
    { productId: products['Feeding bottle 250ml'].id, mode: 'delta', qty: -1, reason: 'Damaged', notes: 'Cracked in delivery' },
    cashierId
  );

  // A week of sales: two or three a day, a few on account.
  for (const [index, basket] of BASKETS.entries()) {
    const ago = 6 - Math.floor(index / 2.3);
    const onAccount = index % 5 === 3;
    const customer = customers[index % customers.length];

    await api.transaction.getTransactionId();
    const sale = (
      await api.transaction.saveNormalSale({
        items: basket.map(([name, qty]) => ({ id: products[name].id, name, qty, discount: 0 })),
        tax: '0',
        discountOnTotal: 0,
        amountPaid: onAccount ? 500 : 1e9,
        salesType: onAccount ? 'Credit' : 'Counter',
        customerId: onAccount ? customer.id : undefined,
        cashierId,
      })
    ).data;

    // Book the sale to its day in the week rather than to now.
    const when = daysAgo(ago, 9 + ((index * 3) % 9)).toISOString();
    await db.run('UPDATE transaction_headers SET created_at = ?, updated_at = ? WHERE id = ?', [when, when, sale.id]);
    await db.run('UPDATE transaction_details SET created_at = ? WHERE transaction_id = ?', [when, sale.id]);
    await db.run('UPDATE credit_transactions SET created_at = ? WHERE transaction_id = ?', [when, sale.id]);
  }

  // One customer has since paid part of what they owe.
  const { balance } = (await api.customer.getBalance(customers[3].id)).data;
  if (balance > 0) await api.customer.receivePayment(customers[3].id, Math.min(1000, balance));

  return { products: PRODUCTS.length, vendors: VENDORS.length, customers: CUSTOMERS.length, sales: BASKETS.length };
}
