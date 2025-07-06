import { useEffect } from "react";

export default function CrashPage() {
  useEffect(() => {
    throw new Error("I crashed on purpose for testing! 😱");
  }, []);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>This page will crash on load</h1>
    </div>
  );
}
