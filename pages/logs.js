import { useEffect, useState } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function fetchLogs() {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setLogs(data.logs);
    }

    fetchLogs();
  }, []);

  const getRowStyle = (level) => {
    switch (level) {
      case "ERROR":
        return {
          backgroundColor: "#ffe5e5",
          color: "#b30000",
          fontWeight: "bold",
        }; // Light Red
      case "WARN":
        return {
          backgroundColor: "#fff9e5",
          color: "#b38600",
          fontWeight: "bold",
        }; // Light Yellow
      case "INFO":
        return {
          backgroundColor: "#e5f0ff",
          color: "#0059b3",
          fontWeight: "bold",
        }; // Light Blue
      case "LOG":
      default:
        return { backgroundColor: "#e5ffe5", color: "#006600" }; // Light Green
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Client Logs</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Timestamp
            </th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Level</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>URL</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Message
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={index} style={getRowStyle(log.level)}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {log.timestamp}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {log.level}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {log.url}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {log.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
