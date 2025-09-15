import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import AppRouter from "@/routes/AppRouter";
import "@/styles/globals.scss";
import { clearCredentials } from "@/features/auth/authSlice";
import { setOnAuthFailed } from "@/lib/token";

setOnAuthFailed(() => {
  store.dispatch(clearCredentials());
  window.location.href = "/login";
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppRouter />
    </Provider>
  </React.StrictMode>
);
