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

export interface SignedInUser {
  id: number;
  name: string;
  role: "Admin" | "NonAdmin";
}

// api.auth.login returns { authToken, refreshToken, user }, and the whole
// payload is what this slice stores.
export const selectUser = (state: { auth?: AuthState }) =>
  (state.auth?.tokens?.user as SignedInUser | undefined) ?? null;

export const selectIsAdmin = (state: { auth?: AuthState }) => selectUser(state)?.role === "Admin";
export default authSlice.reducer;
