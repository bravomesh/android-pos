import { combineReducers, createAction } from "@reduxjs/toolkit";

import auth from "./auth";
import productType from "./productType";
import cart from "./cart";
import transaction from "./transaction";

export const userLoggedOut = createAction("auth/userLoggedOut");

const appReducer = combineReducers({ auth, productType, cart, transaction });

// Logout resets the whole store to slice defaults (parity with the legacy rootReducer).
const rootReducer: typeof appReducer = (state, action) =>
  appReducer(userLoggedOut.match(action) ? undefined : state, action);

export default rootReducer;
