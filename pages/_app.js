import "@/styles/globals.css";
import { useEffect } from "react";
import { interceptConsole } from "../lib/logger";

if (typeof window !== "undefined") {
  interceptConsole(); //  Only run on client side
}

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
