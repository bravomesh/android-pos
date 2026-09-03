import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ProductTypePayload {
  list: unknown[];
  paginationInfo: unknown;
  isFiltered: boolean;
}

export interface ProductTypeState {
  list?: unknown[];
  paginationInfo?: unknown;
  meta?: { isFiltered: boolean };
}

const productTypeSlice = createSlice({
  name: "productType",
  initialState: {} as ProductTypeState,
  reducers: {
    loadProductType(state, action: PayloadAction<ProductTypePayload>) {
      state.list = action.payload.list;
      state.paginationInfo = action.payload.paginationInfo;
      state.meta = { isFiltered: action.payload.isFiltered };
    },
  },
});

export const { loadProductType } = productTypeSlice.actions;
export default productTypeSlice.reducer;
