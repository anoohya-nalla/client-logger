import "@/styles/globals.css";
import { useEffect } from "react";
import { interceptConsole } from "../lib/logger";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    interceptConsole();
  }, []);

  return <Component {...pageProps} />;
}
