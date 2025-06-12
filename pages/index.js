import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useRouter } from "next/router";

const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#FF4C4C"];

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [dailyCounts, setDailyCounts] = useState({});
  const [todayCount, setTodayCount] = useState(0);
  const [stackedCounts, setStackedCounts] = useState([]);
  const [logsByPage, setLogsByPage] = useState([]);
  const [logs, setLogs] = useState([]);

  const router = useRouter();

  useEffect(() => {
    const fetchAllLogs = async () => {
      const res = await fetch("/api/logs");
      const data = await res.json();

      setLogs(data.logs || []);
      setStats(data.stats || {});
      setDailyCounts(data.dailyCounts || {});
      setTodayCount(data.todayCount || 0);
      setStackedCounts(data.stackedCounts || []);

      const pageMap = {};
      data.logs.forEach((log) => {
        const path = log.url?.split("?")[0] || "/";
        pageMap[path] = (pageMap[path] || 0) + 1;
      });
      const topPages = Object.entries(pageMap)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setLogsByPage(topPages);
    };

    fetchAllLogs();
  }, []);

  const testLogs = () => {
    console.log("📄 Test: log");
    console.info("📘 Test: info");
    console.warn("⚠️ Test: warn");
    console.error("❌ Test: error");
    Promise.reject("🚨 Unhandled rejection");
  };

  const triggerServerError = async () => {
    try {
      const res = await fetch("/api/test-server-error");
      if (!res.ok) throw new Error("Server responded with error");
    } catch (err) {
      console.error("Caught from client:", err.message);
    }
  };

  const pieData = Object.entries(stats).map(([level, value]) => ({
    name: level,
    value,
  }));

  const lineData = Object.entries(dailyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

  const totalLogs = Object.values(stats).reduce((a, b) => a + b, 0);
  const totalServerLogs = stackedCounts.reduce(
    (sum, d) => sum + (d.server || 0),
    0
  );
  const percentServer = totalLogs
    ? ((totalServerLogs / totalLogs) * 100).toFixed(1)
    : 0;

  const clientLogs = logs.filter((l) => !l.url.includes("/api/"));
  const serverLogs = logs.filter((l) => l.url.includes("/api/"));

  const recentErrors = logs
    .filter((log) => log.level === "ERROR")
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  return (
    <div style={{ padding: "2rem", maxWidth: "1300px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>📊 Log Analytics Dashboard</h1>

      {/* Summary Cards */}
      <section style={sectionBox}>
        <h2>🔢 Summary</h2>
        <div style={cardRow}>
          {["LOG", "INFO", "WARN", "ERROR"].map((level) => (
            <div key={level} style={cardStyle(level)}>
              <h3>{level}</h3>
              <p>{stats[level] || 0}</p>
            </div>
          ))}
          <div style={cardStyle("TODAY")}>
            <h3>Today</h3>
            <p>{todayCount}</p>
          </div>
          <div style={cardStyle("TOTAL")}>
            <h3>Total</h3>
            <p>{totalLogs}</p>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section style={sectionBox}>
        <h2>📊 Visualizations</h2>
        <div style={chartRow}>
          {/* Pie Chart */}
          <div>
            <h4 style={{ textAlign: "center" }}>Log Levels</h4>
            <PieChart width={320} height={300}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          {/* Line Chart */}
          <div>
            <h4 style={{ textAlign: "center" }}>Logs per Day</h4>
            <ResponsiveContainer width={400} height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0070f3"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Extra Insights */}
      <section style={sectionBox}>
        <h2>📍 Breakdown</h2>
        <div style={chartRow}>
          {/* Logs by Page */}
          <div>
            <h4 style={{ textAlign: "center" }}>Logs by Page</h4>
            <ResponsiveContainer width={600} height={300}>
              <BarChart
                data={logsByPage}
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="path" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Client vs Server Stacked */}
          <div>
            <h4 style={{ textAlign: "center" }}>Client vs Server (Daily)</h4>
            <ResponsiveContainer width={500} height={300}>
              <BarChart data={stackedCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="client" stackId="a" fill="#8884d8" />
                <Bar dataKey="server" stackId="a" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Client / Server Summary */}
      <section style={sectionBox}>
        <h2>🧍 Client & 🖥 Server Summary</h2>
        <div style={cardRow}>
          <div style={cardStyle("INFO")}>
            <h3>🧍 Client Logs</h3>
            <p>Total: {clientLogs.length}</p>
            <p>
              Errors: {clientLogs.filter((l) => l.level === "ERROR").length}
            </p>
          </div>
          <div style={cardStyle("SERVER")}>
            <h3>🖥 Server Logs</h3>
            <p>Total: {serverLogs.length}</p>
            <p>
              Errors: {serverLogs.filter((l) => l.level === "ERROR").length}
            </p>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section style={{ marginTop: "3rem", textAlign: "center" }}>
        <button onClick={testLogs} style={btn("#0070f3")}>
          🧪 Generate Logs
        </button>
        <button onClick={() => router.push("/crash")} style={btn("#dc3545")}>
          💥 Trigger Client Crash
        </button>
        <button onClick={triggerServerError} style={btn("#ff6600")}>
          🔥 Trigger Server Error
        </button>
        <button onClick={() => router.push("/logs")} style={btn("#28a745")}>
          📄 View Logs
        </button>
      </section>

      <section style={sectionBox}>
        <h2>🚨 Recent Error Logs</h2>
        <div style={{ overflowX: "auto", marginTop: "1rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={cellStyle}>Time</th>
                <th style={cellStyle}>User ID</th>
                <th style={cellStyle}>Message</th>
                <th style={cellStyle}>Page</th>
              </tr>
            </thead>
            <tbody>
              {recentErrors.map((log, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={cellStyle}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={cellStyle}>{log.userId}</td>
                  <td style={cellStyle}>{log.message}</td>
                  <td style={cellStyle}>
                    <a
                      href={log.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#0070f3" }}
                    >
                      {new URL(log.url, window.location.origin).pathname}
                    </a>
                  </td>
                </tr>
              ))}
              {recentErrors.length === 0 && (
                <tr>
                  <td style={cellStyle} colSpan={3}>
                    No recent error logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// --- styles ---
const sectionBox = { marginTop: "3rem" };
const cardRow = {
  display: "flex",
  gap: "1rem",
  flexWrap: "wrap",
  justifyContent: "center",
  marginTop: "1rem",
};
const chartRow = {
  display: "flex",
  gap: "3rem",
  flexWrap: "wrap",
  justifyContent: "center",
  alignItems: "flex-start",
};

const cardStyle = (level) => ({
  minWidth: "180px",
  padding: "1rem",
  borderRadius: "8px",
  backgroundColor:
    level === "ERROR"
      ? "#ffe5e5"
      : level === "WARN"
      ? "#fff3cd"
      : level === "INFO"
      ? "#e7f3fe"
      : level === "SERVER"
      ? "#e0e0ff"
      : "#e5ffe5",
  color: "#333",
  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  textAlign: "center",
});

const btn = (bg) => ({
  margin: "0 0.5rem",
  padding: "12px 20px",
  borderRadius: "5px",
  border: "none",
  backgroundColor: bg,
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
});

const cellStyle = {
  padding: "8px 12px",
  fontSize: "0.95rem",
  textAlign: "left",
  whiteSpace: "nowrap",
  color: "#333",
};
