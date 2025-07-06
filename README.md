# FourEyeFour (4👁4) – Full-Stack Logging Dashboard

> "When your console fails, your logs shouldn't."

FourEyeFour is a real-time full-stack **logging and error-monitoring dashboard** built with **Next.js**. It captures both **client-side and server-side logs**, displays them on an elegant dashboard, and stores them for later analysis. Inspired by real-world debugging struggles, this tool provides deep visibility into what's going wrong — even when your browser console can't help.

## Features

-  **Client & Server Logging**
  - Captures all `console.log`, `console.info`, `console.warn`, `console.error`, and even **unhandled promise rejections**
  - Logs are sent from browser to the backend via a single `/api/logs` endpoint
  - Server-side logs (e.g. runtime errors) are automatically tracked

- **Interactive Logging Dashboard**
  - Donut chart for log type distribution
  - Daily trend line chart
  - Stacked bar for client vs server logs
  - Page-level heatmap and top route logging
  - Table of recent error logs

- **Log Filtering & CSV Export**
  - Filter logs by level (`LOG`, `INFO`, `WARN`, `ERROR`)
  - Search logs by message
  - Date range filtering
  - Export current logs as filtered `.csv` file

- **Crash Detection**
  - A `/crash` page intentionally throws an error
  - Triggers React Error Boundary
  - Error is logged and user can click “Go Home” to recover

- **Dev Tools**
  - Built-in buttons to simulate:
    - Client-side logs
    - Trigger server-side errors
    - Navigate to a crash

## 📂 Tech Stack

| Layer     | Stack                              |
|----------|-------------------------------------|
| Frontend | React + Next.js + Material UI (MUI) |
| Backend  | Next.js API Routes (`/api/logs`)    |
| Storage  | In-memory (can be extended to DB)   |
| Charts   | ApexCharts                          |
| Routing  | Next.js Dynamic Routing             |


## Why This Project?

In real-world applications, **frontend issues often go unnoticed in production**, especially if the user doesn’t report them or you can't reproduce the issue. This project was built to **centralize all logs** (even browser logs) into a single, searchable system.

Instead of relying on browser consoles or remote tools, this solution:
- Proactively catches and stores logs
- Helps teams debug faster
- Simulates real production issues via dev tools

## Setup

```bash
git clone https://github.com/yourusername/foureyefour.git
cd foureyefour
npm install
npm run dev
