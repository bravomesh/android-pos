import api from "../api";
import { setAuthorizationHeader } from "../utils";
import { userLoggedIn, AuthTokens } from "../reducers/auth";
import { userLoggedOut } from "../reducers";
import type { AppDispatch } from "../store";

export const loginUser =
  (credentials: { username: string; password: string }) =>
  async (dispatch: AppDispatch) => {
    const tokens: AuthTokens = await api.auth.login(credentials);
    (setAuthorizationHeader as (token?: string | null) => void)(tokens.authToken);
    dispatch(userLoggedIn(tokens));
  };

export const logout = () => (dispatch: AppDispatch) => {
  sessionStorage.removeItem("token");
  setAuthorizationHeader();
  dispatch(userLoggedOut());
};
