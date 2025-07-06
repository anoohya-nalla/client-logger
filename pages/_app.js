import { useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  CssBaseline,
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { ErrorBoundary } from "react-error-boundary";
import { interceptConsole } from "../lib/logger";
import { lightTheme, darkTheme } from "@/lib/theme";
import MainLayout from "@/components/mainLayout";
import { useRouter } from "next/router";

if (typeof window !== "undefined") {
  interceptConsole();
}

function ErrorFallback({ error, resetErrorBoundary }) {
  const router = useRouter();
  const [goHome, setGoHome] = useState(false);

  useEffect(() => {
    if (goHome) {
      // Reset boundary first, then route
      resetErrorBoundary();
      router.push("/");
    }
  }, [goHome, resetErrorBoundary, router]);

  return (
    <Box role="alert" sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h5" color="error">
        Something went wrong!
      </Typography>
      <pre style={{ color: "red", marginTop: "1rem" }}>{error.message}</pre>
      <Button variant="text" color="primary" onClick={resetErrorBoundary}>
        Try Again
      </Button>
      <Button
        variant="contained"
        sx={{
          ml: 2,
          backgroundColor: "#9580ff",
          "&:hover": {
            backgroundColor: "#7a6be0",
          },
        }}
        onClick={() => setGoHome(true)}
      >
        Go to Home
      </Button>
    </Box>
  );
}

export default function App({ Component, pageProps }) {
  const [mode, setMode] = useState("light");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const theme = useMemo(
    () => (mode === "dark" ? darkTheme : lightTheme),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={(error, errorInfo) => {
          console.error("Caught by ErrorBoundary:", error, errorInfo);

          if (typeof window !== "undefined") {
            const userId = localStorage.getItem("userId") || "anonymous";

            fetch("/api/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                level: "ERROR",
                message: `ErrorBoundary Caught: ${error.toString()}`,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userId,
              }),
            });
          }
        }}
      >
        <MainLayout mode={mode} setMode={setMode}>
          <Component
            {...pageProps}
            mode={mode}
            setMode={setMode}
            showSnackbar={showSnackbar}
          />
        </MainLayout>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
