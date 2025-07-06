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
  Icon,
} from "@mui/material";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { formatPathLabel } from "@/lib/formatPathLabel";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

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
    reload: false,
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
    console.log("Test: log");
    console.info("Test: info");
    console.warn("Test: warn");
    console.error("Test: error");
    Promise.reject("Unhandled rejection");
    setSnackbar({
      open: true,
      message: "Test logs sent!",
      severity: "success",
      reload: true,
    });
  };

  const triggerServerError = async () => {
    try {
      const res = await fetch("/api/test-server-error");
      if (!res.ok) throw new Error("Server responded with error");
      setSnackbar({
        open: true,
        message: "Server error simulated!",
        severity: "warning",
        reload: true, //trigger reload after close
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
        reload: true, // still reload to show latest logs
      });
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
            icon: <TodayRoundedIcon sx={{ fontSize: 24, color: "#9580ff" }} />,
          },
          {
            title: "Total Logs",
            value: totalLogs,
            icon: (
              <BarChartRoundedIcon sx={{ fontSize: 24, color: "#9580ff" }} />
            ),
          },
          {
            title: "Errors Logged",
            value: stats.ERROR || 0,
            icon: (
              <ErrorOutlineRoundedIcon
                sx={{ fontSize: 24, color: "#9580ff" }}
              />
            ),
          },
          {
            title: "Warnings Logged",
            value: stats.WARN || 0,
            icon: (
              <WarningAmberRoundedIcon
                sx={{ fontSize: 24, color: "#9580ff" }}
              />
            ),
          },
        ].map(({ title, value, icon, color }) => (
          <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={title}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                backgroundColor: (theme) => theme.palette[color],
                boxShadow: "rgba(76, 78, 100, 0.22) 0px 2px 10px 0px",
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="h6">{value}</Typography>
                    <Typography
                      variant="subtitle2"
                      fontSize={12}
                      color="text.secondary"
                    >
                      {title}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#f3f0ff",
                      borderRadius: "10px",
                    }}
                  >
                    {icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Log Level Pie + Logs per Day */}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              boxShadow: "rgba(76, 78, 100, 0.22) 0px 2px 10px 0px",
            }}
          >
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
                    colors: ["#e0d9ff", "#b8aaff", "#9580ff"],
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
          <Card
            elevation={0}
            sx={{
              height: "100%",
              boxShadow: "rgba(76, 78, 100, 0.22) 0px 2px 10px 0px",
            }}
          >
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
                    colors: ["#9580ff"],
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
          <Card
            elevation={0}
            sx={{
              height: "100%",
              boxShadow: "rgba(76, 78, 100, 0.22) 0px 2px 10px 0px",
            }}
          >
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
                    colors: ["#9580ff"],
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
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  boxShadow: "rgba(76, 78, 100, 0.22) 0px 2px 10px 0px",
                }}
              >
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
                        colors: ["#9580ff"],
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
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  boxShadow: "rgba(76, 78, 100, 0.22) 0px 2px 10px 0px",
                }}
              >
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
                                  color: "#d3c8ff",
                                  name: "No Logs",
                                },
                                {
                                  from: 1,
                                  to: 10,
                                  color: "#d3c8ff",
                                  name: "Low",
                                },
                                {
                                  from: 11,
                                  to: 30,
                                  color: "#b5a1ff",
                                  name: "Medium",
                                },
                                {
                                  from: 31,
                                  to: 1000,
                                  color: "#9580ff",
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
          <Card
            elevation={0}
            sx={{
              mt: 2,
              boxShadow: "rgba(76, 78, 100, 0.22) 0px 2px 10px 0px",
            }}
          >
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
                        legend: {
                          show: false,
                        },
                        labels: ["INFO", "WARN", "ERROR"],
                        tooltip: { enabled: true },
                        colors: ["#e0d9ff", "#b8aaff", "#9580ff"],
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
                      height={140}
                      series={[
                        serverLogs.filter((l) => l.level === "INFO").length,
                        serverLogs.filter((l) => l.level === "WARN").length,
                        serverLogs.filter((l) => l.level === "ERROR").length,
                      ]}
                      options={{
                        colors: ["#e0d9ff", "#b8aaff", "#9580ff"],
                        labels: ["INFO", "WARN", "ERROR"],
                        legend: { show: false },
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
            elevation={0}
            sx={{
              height: "474px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "rgba(76, 78, 100, 0.22) 0px 2px 10px 0px",
            }}
          >
            <CardHeader
              title={<Typography fontSize={18}>Recent Error Logs</Typography>}
              sx={{ paddingBottom: "10px !important" }}
              action={
                <Button
                  variant="contained"
                  sx={{
                    borderRadius: "10px",
                    backgroundColor: "#9580ff",
                    color: "#fff",
                    textTransform: "none",
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: "#7a6be0",
                    },
                  }}
                  onClick={() => router.push("/logs")}
                >
                  View Logs
                </Button>
              }
            />
            <CardContent
              sx={{
                p: 0,
                flexGrow: 1,
                overflowY: "auto",
              }}
            >
              {recentErrors.length > 0 ? (
                <Table size="small" stickyHeader>
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
                              color: "#9580ff",
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

          {/* Generate Logs */}
          <Button
            variant="contained"
            sx={{
              borderRadius: "8px",
              backgroundColor: "#9580ff",
              color: "#fff",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#7a6be0",
              },
              minWidth: "126px",
            }}
            onClick={testLogs}
          >
            Generate Logs
          </Button>

          {/* Client Crash */}
          <Button
            variant="contained"
            color="error"
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              minWidth: "126px",
            }}
            onClick={() => router.push("/crash")}
          >
            Client Crash
          </Button>

          {/* Server Error */}
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#fdb528",
              borderRadius: "8px",
              textTransform: "none",
              minWidth: "126px",
            }}
            onClick={triggerServerError}
          >
            Server Error
          </Button>
        </CardContent>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => {
          setSnackbar((s) => ({ ...s, open: false }));
          if (snackbar.reload) {
            setTimeout(() => window.location.reload(), 300); //  reload after snackbar closes
          }
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => {
            setSnackbar((s) => ({ ...s, open: false }));
            if (snackbar.reload) {
              setTimeout(() => window.location.reload(), 300);
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
