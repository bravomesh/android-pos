import React from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";

import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import DatabaseGate from "./components/DatabaseGate";
import App from "./components/app/App";
import store from "./store";
import { ThemeModeProvider } from "./theme/ThemeModeContext";
import { ToastProvider } from "./toast/ToastProvider";

import "@fontsource-variable/rubik";
import "@fontsource-variable/nunito-sans";
import "./index.css";

const initApp = async () => {
  if (Capacitor.getPlatform() === "web") {
    await jeepSqlite(window);
    const jeepEl = document.createElement("jeep-sqlite");
    document.body.appendChild(jeepEl);
    await customElements.whenDefined("jeep-sqlite");
  }

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <ThemeModeProvider>
        <ToastProvider>
          <Provider store={store}>
            <DatabaseGate>
              <App />
            </DatabaseGate>
          </Provider>
        </ToastProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  );
};

initApp().catch(console.error);
