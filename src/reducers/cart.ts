import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import currency from "currency.js";

export interface CartItemInput {
  id: number | string;
  name: string;
  qty: number;
  price: number | string;
  discount: number | string;
}

export interface CartLine {
  id: number | string;
  name: string;
  qty: number;
  price: number;
  discount: number;
  discountTotal: number;
  sellingPrice: number;
  totalPrice: number;
}

// Money fields start as formatted strings and become numbers after the first
// recalculation — components tolerate both. (Parity with the legacy reducer.)
type Money = number | string;

export interface CartSummary {
  noOfItems: number;
  noOfInividualItems: number; // typo kept: components read this exact key
  tax: Money;
  taxAmount: Money;
  discountOnTotal: Money;
  discountOnItems: Money;
  total: Money;
  netTotal: Money;
}

export interface CartState {
  items: Record<string, CartLine>;
  summary: CartSummary;
}

const initialState: CartState = {
  items: {},
  summary: {
    noOfItems: 0,
    noOfInividualItems: 0,
    tax: "0",
    taxAmount: "0.00",
    discountOnTotal: "0.00",
    discountOnItems: "0.00",
    total: "0.00",
    netTotal: "0.00",
  },
};

const buildLine = (item: CartItemInput): CartLine => {
  const discount = currency(item.discount).value;
  const sellingPrice = currency(item.price).subtract(discount).value;
  return {
    id: item.id,
    name: item.name,
    qty: item.qty,
    price: currency(item.price).value,
    discount,
    discountTotal: currency(item.discount).multiply(item.qty).value,
    sellingPrice,
    totalPrice: currency(sellingPrice).multiply(item.qty).value,
  };
};

// Tax is charged on top of the discounted total, matching what the sale is
// recorded as in SQLite (SalesService.checkoutCounterSale):
//   netTotal = (total - discountOnTotal) + taxAmount
const recomputeTaxAndNet = (summary: CartSummary) => {
  const taxableBase = currency(summary.total).subtract(summary.discountOnTotal);
  summary.taxAmount = taxableBase.multiply(Number(summary.tax) * 0.01).value;
  summary.netTotal = taxableBase.add(summary.taxAmount).value;
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItemToCart(state, action: PayloadAction<CartItemInput>) {
      const line = buildLine(action.payload);
      state.items[line.id] = line;
      state.summary.noOfItems += 1;
      state.summary.noOfInividualItems += line.qty;
      state.summary.discountOnItems = currency(state.summary.discountOnItems)
        .add(line.discountTotal).value;
      state.summary.total = currency(state.summary.total)
        .add(line.totalPrice).value;
      recomputeTaxAndNet(state.summary);
    },

    updateCartItem(state, action: PayloadAction<CartItemInput>) {
      const oldLine = state.items[action.payload.id];
      const line = buildLine(action.payload);
      state.items[line.id] = line;
      state.summary.noOfInividualItems += line.qty - oldLine.qty;
      state.summary.discountOnItems = currency(state.summary.discountOnItems)
        .add(line.discountTotal).subtract(oldLine.discountTotal).value;
      state.summary.total = currency(state.summary.total)
        .add(line.totalPrice).subtract(oldLine.totalPrice).value;
      recomputeTaxAndNet(state.summary);
    },

    removeItemFromCart(state, action: PayloadAction<CartLine>) {
      const line = action.payload;
      delete state.items[line.id];
      state.summary.noOfItems -= 1;
      state.summary.noOfInividualItems -= line.qty;
      state.summary.discountOnItems = currency(state.summary.discountOnItems)
        .subtract(line.discountTotal).value;
      state.summary.total = currency(state.summary.total)
        .subtract(line.totalPrice).value;
      recomputeTaxAndNet(state.summary);
    },

    updateDiscountOnItems(state, action: PayloadAction<number | string>) {
      const discount = currency(action.payload).value;
      const oldDiscountOnItems = state.summary.discountOnItems;
      Object.values(state.items).forEach((line) => {
        line.discount = discount;
        line.discountTotal = currency(discount).multiply(line.qty).value;
        line.sellingPrice = currency(line.price).subtract(discount).value;
        line.totalPrice = currency(line.sellingPrice).multiply(line.qty).value;
      });
      state.summary.discountOnItems = currency(discount)
        .multiply(state.summary.noOfInividualItems).value;
      state.summary.total = currency(state.summary.total)
        .add(oldDiscountOnItems).subtract(state.summary.discountOnItems).value;
      recomputeTaxAndNet(state.summary);
    },

    updateDiscountOnTotal(state, action: PayloadAction<number | string>) {
      state.summary.discountOnTotal = currency(action.payload).value;
      recomputeTaxAndNet(state.summary);
    },

    updateTax(state, action: PayloadAction<number | string>) {
      state.summary.tax = action.payload;
      recomputeTaxAndNet(state.summary);
    },

    emptyCart: () => initialState,
  },
});

export const {
  addItemToCart,
  updateCartItem,
  removeItemFromCart,
  updateDiscountOnItems,
  updateDiscountOnTotal,
  updateTax,
  emptyCart,
} = cartSlice.actions;

export default cartSlice.reducer;
