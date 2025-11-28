import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((registrationError) => {
          console.warn("SW registration failed:", registrationError);
        });
    });
  } else {
    // Ensure stale SWs from prod builds don't interfere with local dev/HMR.
    navigator.serviceWorker.getRegistrations?.().then((registrations) => {
      registrations.forEach((registration) => registration.unregister().catch(() => undefined));
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
