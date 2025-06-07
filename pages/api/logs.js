import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const logFilePath = path.join(process.cwd(), "client-logs.txt");

  if (req.method === "POST") {
    const { level, message, timestamp, url } = req.body;

    const logEntry = `[${timestamp}] [${level.toUpperCase()}] [${url}] ${message}\n`;

    fs.appendFile(logFilePath, logEntry, (err) => {
      if (err) {
        console.error("Failed to write log:", err);
        return res.status(500).json({ message: "Failed to save log" });
      }
      res.status(200).json({ message: "Log saved successfully" });
    });
  } else if (req.method === "GET") {
    fs.readFile(logFilePath, "utf-8", (err, data) => {
      if (err) {
        console.error("Failed to read log file:", err);
        return res.status(500).json({ message: "Failed to read logs" });
      }

      const logs = data
        .trim()
        .split("\n")
        .map((line) => {
          const match = line.match(/\[(.*?)\] \[(.*?)\] \[(.*?)\] (.*)/);
          if (match) {
            const [, timestamp, level, url, message] = match;
            return { timestamp, level, url, message };
          }
          return null;
        })
        .filter(Boolean);

      res.status(200).json({ logs });
    });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
