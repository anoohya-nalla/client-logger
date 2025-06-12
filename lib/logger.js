let originalLog;
let originalError;
let originalWarn;
let originalInfo;

let userId;

function getUserId() {
  if (typeof window === "undefined") return "anonymous";

  if (!userId) {
    userId = localStorage.getItem("userId");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("userId", userId);
    }
  }
  return userId;
}

function sendLogToServer(level, args) {
  if (typeof window === "undefined") return;

  fetch("/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      level,
      message: args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" "),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: getUserId(),
    }),
  }).catch((err) => {
    console.warn("Error sending log to server:", err);
  });
}

export function interceptConsole() {
  if (typeof window === "undefined") return; // Don't run on server

  originalLog = console.log;
  originalError = console.error;
  originalWarn = console.warn;
  originalInfo = console.info;

  const methods = ["log", "info", "warn", "error"];

  methods.forEach((method) => {
    const original = console[method];
    console[method] = function (...args) {
      sendLogToServer(method.toUpperCase(), args);
      original.apply(console, args);
    };
  });

  window.onerror = function (message, source, lineno, colno, error) {
    originalError("Intercepted window.onerror:", message);
    sendLogToServer("ERROR", [`${message} at ${source}:${lineno}:${colno}`]);
  };

  window.onunhandledrejection = function (event) {
    originalError("Intercepted unhandledrejection:", event.reason);
    sendLogToServer("ERROR", [`Unhandled Rejection: ${event.reason}`]);
  };
}
