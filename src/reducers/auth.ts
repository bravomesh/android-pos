import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthTokens {
  authToken: string;
  [key: string]: unknown;
}

export interface AuthState {
  tokens?: AuthTokens;
}

const authSlice = createSlice({
  name: "auth",
  initialState: {} as AuthState,
  reducers: {
    userLoggedIn(state, action: PayloadAction<AuthTokens>) {
      state.tokens = action.payload;
    },
  },
});

export const { userLoggedIn } = authSlice.actions;
export default authSlice.reducer;
