// Note: MUI version of your logs.js has been rewritten with modern components
// All buttons, tables, and inputs are now Material UI based

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  useTheme,
} from "@mui/material";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const logsPerPage = 10;
  const theme = useTheme();

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setLogs(data.logs);
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const addOneDay = (date) => {
    const result = new Date(date);
    result.setDate(result.getDate() + 1);
    return result;
  };

  const getRowStyle = (level) => {
    return {
      fontWeight: "bold",
      backgroundColor:
        level === "ERROR"
          ? theme.palette.error.light
          : level === "WARN"
          ? theme.palette.warning.light
          : level === "INFO"
          ? theme.palette.info.light
          : theme.palette.success.light,
    };
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === "ALL" || log.level === filter;
    const matchesSearch = log.message
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDate =
      (!startDate || new Date(log.timestamp) >= new Date(startDate)) &&
      (!endDate || new Date(log.timestamp) < addOneDay(endDate));
    return matchesFilter && matchesSearch && matchesDate;
  });

  const pageCount = Math.max(Math.ceil(filteredLogs.length / logsPerPage), 1);
  const currentLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const handlePageChange = (_, value) => {
    setCurrentPage(value);
  };

  const downloadCSV = () => {
    const headers = ["Timestamp", "Level", "User ID", "URL", "Message"];
    const rows = filteredLogs.map((log) => [
      log.timestamp,
      log.level,
      log.userId,
      log.url,
      `"${log.message.replace(/"/g, '""')}"`,
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "filtered_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const logCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box p={4}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Client Logs
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <TextField
            label="Search by message"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <TextField
            label="Start Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
          />
          <TextField
            label="End Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Button variant="contained" color="success" onClick={downloadCSV}>
            📥 Download Filtered CSV
          </Button>
        </Box>

        <Box mt={2}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(e, val) => val && setFilter(val)}
            size="small"
          >
            {[
              ["ALL", logs.length],
              ["LOG", logCounts.LOG || 0],
              ["INFO", logCounts.INFO || 0],
              ["WARN", logCounts.WARN || 0],
              ["ERROR", logCounts.ERROR || 0],
            ].map(([type, count]) => (
              <ToggleButton key={type} value={type}>
                {type} ({count})
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Typography mt={1} fontWeight="bold">
          Showing {filteredLogs.length} log(s)
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentLogs.map((log, idx) => (
              <TableRow key={idx} sx={getRowStyle(log.level)}>
                <TableCell>
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{log.level}</TableCell>
                <TableCell>{log.userId}</TableCell>
                <TableCell>{log.url}</TableCell>
                <TableCell>{log.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={3} display="flex" justifyContent="center">
        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
}
