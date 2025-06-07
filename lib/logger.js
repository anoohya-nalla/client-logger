let originalLog;
let originalError;
let originalWarn;
let originalInfo;

function sendLogToServer(level, args) {
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
    }),
  }).catch((err) => {
    console.warn("Error sending log to server:", err);
  });
}

export function interceptConsole() {
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

  // Hook into window errors — **use original console**
  window.onerror = function (message, source, lineno, colno, error) {
    originalError("Intercepted window.onerror:", message);
    sendLogToServer("ERROR", [`${message} at ${source}:${lineno}:${colno}`]);
  };

  window.onunhandledrejection = function (event) {
    originalError("Intercepted unhandledrejection:", event.reason);
    sendLogToServer("ERROR", [`Unhandled Rejection: ${event.reason}`]);
  };
}
