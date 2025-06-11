import "@/styles/globals.css";
import { interceptConsole } from "../lib/logger";
import { ErrorBoundary } from "react-error-boundary";

// Start intercepting console logs
if (typeof window !== "undefined") {
  interceptConsole();
}

// Fallback UI when error happens
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Something went wrong!</h2>
      <pre style={{ color: "red" }}>{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        style={{
          marginTop: "1rem",
          padding: "8px 16px",
          borderRadius: "5px",
          border: "none",
          backgroundColor: "#0070f3",
          color: "white",
          cursor: "pointer",
        }}
      >
        Try Again
      </button>
    </div>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error("Caught by ErrorBoundary:", error, errorInfo);

        // Send to server logs
        fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            level: "ERROR",
            message: `ErrorBoundary Caught: ${error.toString()}`,
            timestamp: new Date().toISOString(),
            url: window.location.href,
          }),
        });
      }}
    >
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
