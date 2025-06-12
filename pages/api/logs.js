import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const logFilePath = path.join(process.cwd(), "client-logs.txt");

    if (req.method === "POST") {
      const { level, message, timestamp, url, userId } = req.body;

      if (!level || !message || !timestamp || !url) {
        return res.status(400).json({ error: "Missing log data" });
      }

      const cleanMessage = message.replace(/\n/g, " ");
      const logEntry = `[${timestamp}] [${level.toUpperCase()}] (${
        userId || "anonymous"
      }) [${url}] ${cleanMessage}\n`;

      console.log(`Server side [${level.toUpperCase()}] ${message} @ ${url}`);

      fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
          console.error("Failed to write log:", err);
          throw new Error("Failed to write log file");
        }
        res.status(200).json({ message: "Log saved successfully" });
      });
    } else if (req.method === "GET") {
      fs.readFile(logFilePath, "utf-8", (err, data) => {
        if (err) {
          console.error("Failed to read log file:", err);
          throw new Error("Failed to read log file");
        }

        const logs = data
          .trim()
          .split("\n")
          .map((line) => {
            const match = line.match(
              /\[(.*?)\] \[(.*?)\] \((.*?)\) \[(.*?)\] (.*)/
            );
            if (match) {
              const [, timestamp, level, userId, url, message] = match;
              return { timestamp, level, url, message, userId };
            }

            return null;
          })
          .filter(Boolean);

        // Count log levels
        const stats = logs.reduce((acc, log) => {
          acc[log.level] = (acc[log.level] || 0) + 1;
          return acc;
        }, {});

        // Group by day (YYYY-MM-DD)
        const dailyCounts = {};
        logs.forEach((log) => {
          const date = new Date(log.timestamp).toISOString().split("T")[0];
          dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });

        const todayStr = new Date().toISOString().split("T")[0];
        let todayCount = 0;

        const grouped = {};

        logs.forEach((log) => {
          const date = new Date(log.timestamp).toISOString().split("T")[0];
          const source = log.url.includes("/api/") ? "server" : "client";

          if (date === todayStr) todayCount++;

          if (!grouped[date]) {
            grouped[date] = { date, client: 0, server: 0 };
          }

          grouped[date][source]++;
        });

        const stackedCounts = Object.values(grouped);

        res
          .status(200)
          .json({ logs, stats, dailyCounts, todayCount, stackedCounts });
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("API Handler Error:", error);

    res.status(500).json({ message: "Internal Server Error" });
  }
}
