import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import AuthContext from "./context/AuthDataContext";
import { Provider } from "react-redux";
import store from "./redux/store";
import { BrowserRouter } from "react-router-dom";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <BrowserRouter>
      <Provider store={store}>
        <AuthContext>
          <App />
        </AuthContext>
      </Provider>
    </BrowserRouter>
  );
}
