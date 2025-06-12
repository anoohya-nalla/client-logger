export default async function handler(req, res) {
  try {
    // Simulate server-side error
    throw new Error("💥 Simulated server error from /api/test-server-error");
  } catch (err) {
    // Log it to your logging system
    await fetch("http://localhost:3000/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "ERROR",
        message: err.message,
        timestamp: new Date().toISOString(),
        url: "/api/test-server-error",
      }),
    });

    res.status(500).json({ error: "Server error triggered." });
  }
}
