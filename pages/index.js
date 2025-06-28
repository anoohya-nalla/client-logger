import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [dailyCounts, setDailyCounts] = useState({});
  const [todayCount, setTodayCount] = useState(0);
  const [stackedCounts, setStackedCounts] = useState([]);
  const [logsByPage, setLogsByPage] = useState([]);
  const [logs, setLogs] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

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
    setSnackbar({
      open: true,
      message: "Test logs sent!",
      severity: "success",
    });
  };

  const triggerServerError = async () => {
    try {
      const res = await fetch("/api/test-server-error");
      if (!res.ok) throw new Error("Server responded with error");
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const pieData = Object.entries(stats).map(([label, value]) => ({
    label,
    value,
  }));
  const lineData = Object.entries(dailyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

  const totalLogs = Object.values(stats).reduce((a, b) => a + b, 0);
  const clientLogs = logs.filter((l) => !l.url.includes("/api/"));
  const serverLogs = logs.filter((l) => l.url.includes("/api/"));
  const recentErrors = logs
    .filter((log) => log.level === "ERROR")
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  const stripDomain = (url = "") =>
    url.replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "");

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, width: "100%", maxWidth: "100vw" }}>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }} columns={12}>
        {[
          {
            title: "Today’s Logs",
            value: todayCount,
            icon: "📅",
            color: "#e3f2fd",
          },
          {
            title: "Total Logs",
            value: totalLogs,
            icon: "📊",
            color: "#ede7f6",
          },
          {
            title: "Errors Logged",
            value: stats.ERROR || 0,
            icon: "❌",
            color: "#ffebee",
          },
          {
            title: "Warnings Logged",
            value: stats.WARN || 0,
            icon: "⚠️",
            color: "#fff8e1",
          },
        ].map(({ title, value, icon, color }) => (
          <Grid item xs={12} sm={6} md={3} key={title}>
            <Card
              sx={{
                width: "100%",
                bgcolor: color,
                borderRadius: 1,
                minWidth: "280px",
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box flexGrow={1}>
                    <Typography variant="h5">{value}</Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      {title}
                    </Typography>
                  </Box>
                  <Typography fontSize={28}>{icon}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Log Level Pie + Logs per Day */}
      <Grid
        container
        spacing={3}
        sx={{ mb: 4, justifyContent: "space-between" }}
      >
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ height: "100%" }}>
              <ApexChart
                type="donut"
                height={300}
                series={pieData.map((d) => d.value)}
                options={{
                  labels: pieData.map((d) => d.label),
                  title: { text: "Log Levels" },
                  legend: { position: "bottom" },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ height: "100%" }}>
              <ApexChart
                type="line"
                height={300}
                series={[{ name: "Logs", data: lineData.map((d) => d.value) }]}
                options={{
                  xaxis: { categories: lineData.map((d) => d.date) },
                  title: { text: "Logs per Day" },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <ApexChart
                type="bar"
                series={[
                  {
                    name: "Client Logs",
                    data: stackedCounts.map((d) => d.client),
                  },
                  {
                    name: "Server Logs",
                    data: stackedCounts.map((d) => d.server),
                  },
                ]}
                options={{
                  chart: { stacked: true },
                  xaxis: { categories: stackedCounts.map((d) => d.date) },
                  title: { text: "Client vs Server Logs" },
                }}
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Logs by Page + Stacked Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <ApexChart
                type="bar"
                series={[
                  { name: "Count", data: logsByPage.map((d) => d.count) },
                ]}
                options={{
                  plotOptions: { bar: { horizontal: true } },
                  xaxis: {
                    categories: logsByPage.map((d) => stripDomain(d.path)),
                  },
                  title: { text: "Logs by Page" },
                }}
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Heatmap */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <ApexChart
            type="heatmap"
            series={["INFO", "WARN", "ERROR"].map((level) => ({
              name: level,
              data: logsByPage.map((p) => ({
                x: stripDomain(p.path),
                y: logs.filter(
                  (l) =>
                    stripDomain(l.url).includes(stripDomain(p.path)) &&
                    l.level === level
                ).length,
              })),
            }))}
            options={{
              title: { text: "🔥 Heatmap: Log Level by Page" },
              dataLabels: { enabled: true },
              xaxis: { title: { text: "Pages" } },
              yaxis: { title: { text: "Log Count" } },
            }}
            height={350}
          />
        </CardContent>
      </Card>

      {/* Client vs Server Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">🧍 Client Logs</Typography>
              <Typography>Total: {clientLogs.length}</Typography>
              <Typography>
                Errors: {clientLogs.filter((l) => l.level === "ERROR").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">🖥 Server Logs</Typography>
              <Typography>Total: {serverLogs.length}</Typography>
              <Typography>
                Errors: {serverLogs.filter((l) => l.level === "ERROR").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Buttons */}
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Button variant="contained" sx={{ m: 1 }} onClick={testLogs}>
          🧪 Generate Logs
        </Button>
        <Button
          variant="contained"
          color="error"
          sx={{ m: 1 }}
          onClick={() => router.push("/crash")}
        >
          💥 Trigger Client Crash
        </Button>
        <Button
          variant="contained"
          color="warning"
          sx={{ m: 1 }}
          onClick={triggerServerError}
        >
          🔥 Trigger Server Error
        </Button>
        <Button
          variant="contained"
          color="success"
          sx={{ m: 1 }}
          onClick={() => router.push("/logs")}
        >
          📄 View Logs
        </Button>
      </Box>

      {/* Recent Errors */}
      <Typography variant="h6" sx={{ mt: 6 }}>
        🚨 Recent Error Logs
      </Typography>
      <Paper sx={{ mt: 2, overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Page</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentErrors.map((log, i) => (
              <TableRow key={i}>
                <TableCell>
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{log.userId}</TableCell>
                <TableCell sx={{ maxWidth: 500, whiteSpace: "pre-wrap" }}>
                  {log.message}
                </TableCell>
                <TableCell>
                  <a href={log.url} target="_blank" rel="noreferrer">
                    {stripDomain(log.url)}
                  </a>
                </TableCell>
              </TableRow>
            ))}
            {recentErrors.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No recent error logs.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
