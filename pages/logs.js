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
  Card,
  CardContent,
} from "@mui/material";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const logsPerPage = 10;

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
    switch (level) {
      case "ERROR":
        return {
          backgroundColor: "#ffcccc",
          color: "#990000",
          fontWeight: 500,
        };
      case "WARN":
        return {
          backgroundColor: "#fff2cc",
          color: "#996600",
          fontWeight: 500,
        };
      case "INFO":
        return {
          backgroundColor: "#f3f0ff",
          color: "#433558",
          fontWeight: 500,
        };
      case "LOG":
        return {
          backgroundColor: "#f3f0ff",
          color: "#433558",
          fontWeight: 500,
        };
      default:
        return { backgroundColor: "#f7f7fb" };
    }
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

    const csvContent =
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
    <Card>
      <CardContent>
        <Typography sx={{ mb: 1 }}>Filter</Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <TextField
            size="small"
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
            size="small"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
          />
          <TextField
            size="small"
            label="End Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#9580ff",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { backgroundColor: "#7a6be0" },
            }}
            onClick={downloadCSV}
          >
            Download Filtered CSV
          </Button>
        </Box>

        <Box mt={2}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(e, val) => val && setFilter(val)}
            size="small"
            sx={{
              backgroundColor: "#f3f0ff",
              borderRadius: "8px",
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontWeight: 500,
                color: "#433558",
                "&.Mui-selected": {
                  backgroundColor: "#9580ff",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#7a6be0" },
                },
              },
            }}
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

        <Typography mt={2} mb={2} fontWeight="medium">
          Showing {filteredLogs.length} log(s)
        </Typography>

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
      </CardContent>
    </Card>
  );
}
