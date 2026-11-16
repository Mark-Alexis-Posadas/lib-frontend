import { createRoot } from "react-dom/client";
import { AppRoot } from "./app/App";
import "./styles/app.css";

const rootElement = document.getElementById("app");

if (rootElement) {
    createRoot(rootElement).render(<AppRoot />);
}
