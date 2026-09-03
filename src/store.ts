import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./reducers";

const persisted = sessionStorage.getItem("appstate");

const store = configureStore({
  reducer: rootReducer,
  preloadedState: persisted ? JSON.parse(persisted) : undefined,
});

// Parity: the whole state is persisted to sessionStorage on every change.
store.subscribe(() => {
  sessionStorage.setItem("appstate", JSON.stringify(store.getState()));
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
