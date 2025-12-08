import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry, measureWebVitals } from "./lib/sentry";
import { initializeSecurity, generateCSPHeader } from "./lib/security";
import { initStorageMonitoring } from "./lib/storageErrorHandler";

// Initialize Sentry for error tracking and performance monitoring
initSentry();

// Initialize security measures
initializeSecurity();

// Initialize storage monitoring
initStorageMonitoring();

// Measure Core Web Vitals
measureWebVitals();

// Set security headers (client-side CSP via meta tag)
const cspMeta = document.createElement('meta')
cspMeta.setAttribute('http-equiv', 'Content-Security-Policy')
cspMeta.setAttribute('content', generateCSPHeader())
document.head.appendChild(cspMeta)

// Initialize app
createRoot(document.getElementById("root")!).render(<App />);
