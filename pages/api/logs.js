import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const logFilePath = path.join(process.cwd(), "client-logs.txt");

    if (req.method === "POST") {
      const { level, message, timestamp, url } = req.body;

      const logEntry = `[${timestamp}] [${level.toUpperCase()}] [${url}] ${message}\n`;

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
  } catch (error) {
    console.error("API Handler Error:", error);

    res.status(500).json({ message: "Internal Server Error" });
  }
}
