import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface TransactionState {
  id?: number | string;
}

const transactionSlice = createSlice({
  name: "transaction",
  initialState: {} as TransactionState,
  reducers: {
    initTransaction(state, action: PayloadAction<number | string>) {
      state.id = action.payload;
    },
    cancelTransaction() {
      return {};
    },
  },
});

export const { initTransaction, cancelTransaction } = transactionSlice.actions;
export default transactionSlice.reducer;
