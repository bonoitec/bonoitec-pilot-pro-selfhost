// Diagnostic telemetry to hunt a "page refreshes by itself" bug.
// Logs every event that could plausibly cause an unexpected remount or
// full page reload. Safe to keep in production during investigation;
// remove once the root cause is identified and fixed.

// Bump this whenever telemetry changes so the user can confirm which build
// they are running. Look for this line in the browser console:
//   "[refresh-telemetry v3 installed] ..."
const TELEMETRY_VERSION = "v3";

let installed = false;

export function installRefreshTelemetry() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const log = (tag: string, detail?: unknown) => {
    // eslint-disable-next-line no-console
    console.warn(
      `[refresh-telemetry ${TELEMETRY_VERSION} ${new Date().toISOString()}] ${tag}`,
      detail ?? ""
    );
  };

  // Banner so the user can confirm they're running the fresh build.
  // eslint-disable-next-line no-console
  console.warn(
    `%c✅ refresh-telemetry ${TELEMETRY_VERSION} loaded — if you see this, you are running the FIXED build`,
    "background:#22c55e;color:white;padding:4px 8px;border-radius:4px;font-weight:bold;"
  );

  log("installed", { url: window.location.href });

  // Page is about to unload (hard reload or navigation away)
  window.addEventListener("beforeunload", () => {
    log("beforeunload — browser is about to leave this page", {
      url: window.location.href,
      stack: new Error().stack,
    });
  });

  // Tab visibility toggled — this fires on Alt-Tab, focus away, etc.
  document.addEventListener("visibilitychange", () => {
    log("visibilitychange", { visibility: document.visibilityState });
  });

  // Window focus/blur
  window.addEventListener("focus", () => log("window focus"));
  window.addEventListener("blur", () => log("window blur"));

  // History API — router navigations via pushState/replaceState
  const origPush = history.pushState.bind(history);
  history.pushState = function (...args: Parameters<typeof origPush>) {
    log("history.pushState", { url: args[2] });
    return origPush(...args);
  };
  const origReplace = history.replaceState.bind(history);
  history.replaceState = function (...args: Parameters<typeof origReplace>) {
    log("history.replaceState", { url: args[2] });
    return origReplace(...args);
  };
  window.addEventListener("popstate", (e) => log("popstate", { state: e.state }));

  // Any uncaught error would crash the React tree and potentially cause remounts
  window.addEventListener("error", (e) => {
    log("window error", { message: e.message, filename: e.filename, line: e.lineno });
  });
  window.addEventListener("unhandledrejection", (e) => {
    log("unhandledrejection", { reason: String(e.reason) });
  });
}
