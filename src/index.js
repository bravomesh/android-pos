import React from "react";
import ReactDOM from "react-dom";
import { Capacitor } from "@capacitor/core";
import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";

import { Provider } from "react-redux";
import { BrowserRouter, Route } from "react-router-dom";

import DatabaseProvider from "./components/DatabaseProvider";
import App from "./components/app/App";
import store from "./store";

import registerServiceWorker from "./registerServiceWorker";

import "./index.css";

// Initialize jeep-sqlite for web platform
const initApp = async () => {
  const platform = Capacitor.getPlatform();

  // For web platform, we need to define the jeep-sqlite custom element
  if (platform === "web") {
    await jeepSqlite(window);

    // Create and add jeep-sqlite element
    const jeepEl = document.createElement("jeep-sqlite");
    document.body.appendChild(jeepEl);
    await customElements.whenDefined("jeep-sqlite");
  }

  // Render the app
  ReactDOM.render(
    <BrowserRouter>
      <Provider store={store}>
        <DatabaseProvider>
          <Route component={App} />
        </DatabaseProvider>
      </Provider>
    </BrowserRouter>,
    document.getElementById("root")
  );

  registerServiceWorker();
};

// Start the application
initApp().catch(console.error);
