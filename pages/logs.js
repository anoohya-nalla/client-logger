import { useEffect, useState } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1); // 🆕
  const logsPerPage = 10; // 🆕

  useEffect(() => {
    async function fetchLogs() {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setLogs(data.logs);
    }

    fetchLogs();

    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRowStyle = (level) => {
    switch (level) {
      case "ERROR":
        return {
          backgroundColor: "#ffe5e5",
          color: "#b30000",
          fontWeight: "bold",
        };
      case "WARN":
        return {
          backgroundColor: "#fff9e5",
          color: "#b38600",
          fontWeight: "bold",
        };
      case "INFO":
        return {
          backgroundColor: "#e5f0ff",
          color: "#0059b3",
          fontWeight: "bold",
        };
      case "LOG":
      default:
        return { backgroundColor: "#e5ffe5", color: "#006600" };
    }
  };

  const filteredLogs =
    filter === "ALL" ? logs : logs.filter((log) => log.level === filter);

  // Pagination logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleFilterChange = (level) => {
    setFilter(level);
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  // 🧮 Count logs by level
  const logCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {});

  const totalCount = logs.length;

  const downloadCSV = () => {
    const headers = ["Timestamp", "Level", "URL", "Message"];
    const rows = logs.map((log) => [
      log.timestamp,
      log.level,
      log.url,
      `"${log.message.replace(/"/g, '""')}"`,
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Client Logs</h1>

      {/* Filter Buttons */}
      <div style={{ marginBottom: "1rem" }}>
        {[
          { type: "ALL", count: totalCount },
          { type: "LOG", count: logCounts["LOG"] || 0 },
          { type: "INFO", count: logCounts["INFO"] || 0 },
          { type: "WARN", count: logCounts["WARN"] || 0 },
          { type: "ERROR", count: logCounts["ERROR"] || 0 },
        ].map(({ type, count }) => (
          <button
            key={type}
            onClick={() => handleFilterChange(type)}
            style={{
              marginRight: "10px",
              padding: "8px 16px",
              borderRadius: "5px",
              border: filter === type ? "2px solid #0070f3" : "1px solid #ccc",
              backgroundColor: filter === type ? "#0070f3" : "#f5f5f5",
              color: filter === type ? "white" : "black",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {type} ({count})
          </button>
        ))}

        {/* Download CSV Button */}
        <button
          onClick={downloadCSV}
          style={{
            marginLeft: "20px",
            padding: "8px 16px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            backgroundColor: "#28a745",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          📥 Download CSV
        </button>
      </div>

      {/* Logs Table */}
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
          {currentLogs.map((log, index) => (
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

      {/* Pagination Controls */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          style={{
            padding: "8px 16px",
            marginRight: "10px",
            backgroundColor: currentPage === 1 ? "#ccc" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>
        <span style={{ margin: "0 10px", fontWeight: "bold" }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          style={{
            padding: "8px 16px",
            backgroundColor: currentPage === totalPages ? "#ccc" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
