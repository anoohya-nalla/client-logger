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
  Container,
  CardHeader,
} from "@mui/material";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { formatPathLabel } from "@/lib/formatPathLabel";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const hasNonZeroData = (series) => {
  if (!series || series.length === 0) return false;
  return series.some((val) => val > 0);
};

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

  const clientSeries = [
    clientLogs.filter((l) => l.level === "INFO").length,
    clientLogs.filter((l) => l.level === "WARN").length,
    clientLogs.filter((l) => l.level === "ERROR").length,
  ];

  const pieSeries = pieData.map((d) => d.value);
  const lineSeries = lineData.map((d) => d.value);
  const clientStack = stackedCounts.map((d) => d.client);
  const serverStack = stackedCounts.map((d) => d.server);
  const topPageCounts = logsByPage.map((d) => d.count);
  const heatmapSeries = ["INFO", "WARN", "ERROR"].map((level) => ({
    name: level,
    data: logsByPage.map((p) => ({
      x: formatPathLabel(p.path),
      y: logs.filter(
        (l) =>
          formatPathLabel(l.url?.split("?")[0] || "") ===
            formatPathLabel(p.path) && l.level === level
      ).length,
    })),
  }));

  const flattened = heatmapSeries.flatMap((s) => s.data.map((d) => d.y));

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
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
          <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={title}>
            <Card>
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

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardHeader
              title={
                <Typography fontSize={18}>Log Distribution by Type</Typography>
              }
              sx={{ paddingBottom: "0px !important" }}
            />
            <CardContent
              sx={{
                paddingTop: "10px !important",
                paddingBottom: "0px !important",
              }}
            >
              {hasNonZeroData(pieSeries) ? (
                <ApexChart
                  type="donut"
                  height={180}
                  series={pieSeries}
                  options={{
                    chart: {
                      animations: { enabled: true },
                      toolbar: { show: false },
                      zoom: { enabled: true },
                    },
                    markers: {
                      size: 6,
                      hover: {
                        size: 6,
                      },
                    },
                    labels: pieData.map((d) => d.label),
                    tooltip: {
                      enabled: true, // show data on hover
                    },
                    grid: {
                      show: false,
                    },
                    legend: {
                      show: false,
                    },
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No logs available to show distribution.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardHeader
              title={<Typography fontSize={18}>Logs Per Day</Typography>}
              sx={{ paddingBottom: "0px !important" }}
            />
            <CardContent
              sx={{
                paddingTop: "0px !important",
                paddingBottom: "0px !important",
              }}
            >
              {hasNonZeroData(lineSeries) ? (
                <ApexChart
                  type="line"
                  height={200}
                  series={[{ name: "Logs", data: lineSeries }]}
                  options={{
                    chart: {
                      animations: { enabled: true },
                      toolbar: { show: false },
                      zoom: { enabled: true },
                    },
                    markers: {
                      size: 6,
                      hover: {
                        size: 6,
                      },
                    },
                    xaxis: {
                      categories: lineData.map((d) => d.date),
                      labels: { show: false }, // hide x-axis labels
                      axisBorder: { show: false },
                      axisTicks: { show: false },
                    },
                    yaxis: {
                      labels: { show: false }, // hide y-axis labels
                    },
                    tooltip: {
                      enabled: true, // show data on hover
                    },
                    grid: {
                      show: false,
                    },
                    legend: {
                      show: false,
                    },
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No daily logs to plot.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardHeader
              title={
                <Typography fontSize={18}>Logs by Source Over Time</Typography>
              }
              sx={{ paddingBottom: "0px !important" }}
            />
            <CardContent
              sx={{
                paddingTop: "0px !important",
                paddingBottom: "0px !important",
              }}
            >
              {hasNonZeroData([...clientStack, ...serverStack]) ? (
                <ApexChart
                  type="bar"
                  height={200}
                  series={[
                    {
                      name: "Client Logs",
                      data: clientStack,
                    },
                    {
                      name: "Server Logs",
                      data: serverStack,
                    },
                  ]}
                  options={{
                    chart: {
                      stacked: true,
                      animations: { enabled: true },
                      toolbar: { show: false },
                      zoom: { enabled: true },
                    },
                    markers: {
                      size: 6,
                      hover: {
                        size: 6,
                      },
                    },
                    xaxis: {
                      categories: stackedCounts.map((d) => d.date),
                      labels: { show: false }, // hide x-axis labels
                      axisBorder: { show: false },
                      axisTicks: { show: false },
                    },
                    yaxis: {
                      labels: { show: false }, // hide y-axis labels
                    },
                    tooltip: {
                      enabled: true, // show data on hover
                    },
                    grid: {
                      show: false,
                    },
                    legend: {
                      show: false,
                    },
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No log source data to visualize.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Logs by Page + Stacked Chart */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ md: 8 }}>
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: "100%" }}>
                <CardHeader
                  title={
                    <Typography fontSize={18}>
                      Top Pages Generating Logs
                    </Typography>
                  }
                  sx={{ paddingBottom: "0px !important" }}
                />
                <CardContent
                  sx={{
                    paddingTop: "0px !important",
                    paddingBottom: "0px !important",
                  }}
                >
                  {hasNonZeroData(topPageCounts) ? (
                    <ApexChart
                      type="bar"
                      height={200}
                      series={[{ name: "Count", data: topPageCounts }]}
                      options={{
                        plotOptions: { bar: { horizontal: true } },

                        chart: {
                          animations: { enabled: true },
                          toolbar: { show: false },
                          zoom: { enabled: true },
                        },
                        markers: {
                          size: 6,
                          hover: {
                            size: 6,
                          },
                        },
                        xaxis: {
                          categories: logsByPage.map((d) =>
                            formatPathLabel(d.path)
                          ),
                          labels: { show: false }, // hide x-axis labels
                          axisBorder: { show: false },
                          axisTicks: { show: false },
                        },
                        yaxis: {
                          labels: { show: false }, // hide y-axis labels
                        },
                        tooltip: {
                          enabled: true, // show data on hover
                        },
                        grid: {
                          show: false,
                        },
                        legend: {
                          show: false,
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No logs available to show top pages.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              {/* Heatmap */}
              <Card sx={{ height: "100%" }}>
                <CardHeader
                  title={
                    <Typography fontSize={18}>Log Level by Page</Typography>
                  }
                  sx={{ paddingBottom: "0px !important" }}
                />
                <CardContent
                  sx={{
                    paddingTop: "0px !important",
                    paddingBottom: "0px !important",
                  }}
                >
                  {hasNonZeroData(flattened) ? (
                    <ApexChart
                      type="heatmap"
                      height={200}
                      series={["INFO", "WARN", "ERROR"].map((level) => ({
                        name: level,
                        data: logsByPage.map((p) => ({
                          x: formatPathLabel(p.path),
                          y: logs.filter(
                            (l) =>
                              formatPathLabel(l.url?.split("?")[0] || "") ===
                                formatPathLabel(p.path) && l.level === level
                          ).length,
                        })),
                      }))}
                      options={{
                        chart: {
                          animations: { enabled: true },
                          toolbar: { show: false },
                        },
                        dataLabels: {
                          enabled: true,
                          style: { colors: ["#fff"] },
                        },
                        plotOptions: {
                          heatmap: {
                            shadeIntensity: 0.5,
                            colorScale: {
                              ranges: [
                                {
                                  from: 0,
                                  to: 0,
                                  color: "#ECEFF1",
                                  name: "No Logs",
                                },
                                {
                                  from: 1,
                                  to: 10,
                                  color: "#AED581",
                                  name: "Low",
                                },
                                {
                                  from: 11,
                                  to: 30,
                                  color: "#FFB74D",
                                  name: "Medium",
                                },
                                {
                                  from: 31,
                                  to: 1000,
                                  color: "#E57373",
                                  name: "High",
                                },
                              ],
                            },
                          },
                        },
                        xaxis: {
                          labels: { show: false },
                        },
                        yaxis: {
                          labels: { show: false },
                        },
                        tooltip: {
                          enabled: true,
                        },
                        legend: {
                          show: true,
                          position: "bottom",
                        },
                        grid: {
                          show: false,
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not enough log data to render heatmap.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Card sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Client Logs Pie */}
              <Grid item size={{ xs: 12, md: 6 }}>
                {/* <CardHeader
                  title={
                    <Typography fontSize={18}>
                      Client Logs Distribution
                    </Typography>
                  }
                  sx={{ paddingBottom: "0px !important" }}
                /> */}
                <CardContent
                  sx={{
                    height: 200,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingTop: "0px !important",
                    paddingBottom: "0px !important",
                  }}
                >
                  {hasNonZeroData(clientSeries) ? (
                    <ApexChart
                      type="donut"
                      height={140}
                      series={clientSeries}
                      options={{
                        labels: ["INFO", "WARN", "ERROR"],
                        legend: { position: "bottom" },
                        tooltip: { enabled: true },
                        chart: {
                          animations: { enabled: true },
                          toolbar: { show: false },
                        },
                        title: {
                          text: "Client Logs",
                          align: "center",
                          style: {
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#333",
                          },
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No client logs to display.
                    </Typography>
                  )}
                </CardContent>
              </Grid>

              {/* Server Logs Pie */}
              <Grid item size={{ xs: 12, md: 6 }}>
                {/* <CardHeader
                  title={
                    <Typography fontSize={18}>
                      Server Logs Distribution
                    </Typography>
                  }
                  sx={{ paddingBottom: "0px !important" }}
                /> */}
                <CardContent
                  sx={{
                    height: 200,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {hasNonZeroData([
                    serverLogs.filter((l) => l.level === "INFO").length,
                    serverLogs.filter((l) => l.level === "WARN").length,
                    serverLogs.filter((l) => l.level === "ERROR").length,
                  ]) ? (
                    <ApexChart
                      type="donut"
                      height={120}
                      series={[
                        serverLogs.filter((l) => l.level === "INFO").length,
                        serverLogs.filter((l) => l.level === "WARN").length,
                        serverLogs.filter((l) => l.level === "ERROR").length,
                      ]}
                      options={{
                        labels: ["INFO", "WARN", "ERROR"],
                        legend: { position: "bottom" },
                        tooltip: { enabled: true },
                        chart: {
                          animations: { enabled: true },
                          toolbar: { show: false },
                        },
                        title: {
                          text: "Server Logs",
                          align: "center",
                          style: {
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#333",
                          },
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No server logs to display.
                    </Typography>
                  )}
                </CardContent>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 4 }} rowSpan={2}>
          {/* Recent Errors */}
          <Card
            sx={{
              height: "474px",
            }}
          >
            <CardHeader
              title={<Typography fontSize={18}>Recent Error Logs</Typography>}
              sx={{ paddingBottom: "0px !important" }}
              action={
                <Button
                  variant="contained"
                  color="success"
                  sx={{ m: 1 }}
                  onClick={() => router.push("/logs")}
                >
                  View Logs
                </Button>
              }
            />
            <CardContent sx={{ p: 0, pt: 4 }}>
              {recentErrors.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Page</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentErrors.slice(0, 10).map((log, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell
                          sx={{
                            maxWidth: 150,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={log.message}
                        >
                          {log.message}
                        </TableCell>

                        <TableCell>
                          <a
                            href={log.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              textDecoration: "none",
                              color: "#1976d2",
                            }}
                          >
                            {formatPathLabel(log.url)}
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent error logs.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Buttons */}
      <Grid item xs={12}>
        <CardContent
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography fontSize={18} sx={{ mr: 2 }}>
            Dev Tools
          </Typography>
          <Button variant="contained" onClick={testLogs}>
            Generate Logs
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => router.push("/crash")}
          >
            Client Crash
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={triggerServerError}
          >
            Server Error
          </Button>
        </CardContent>
      </Grid>

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
