import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installRefreshTelemetry } from "./lib/refreshTelemetry";

// DIAGNOSTIC: logs every event that could cause a remount or page reload.
// Check the browser console if the page refreshes itself.
installRefreshTelemetry();

createRoot(document.getElementById("root")!).render(<App />);
