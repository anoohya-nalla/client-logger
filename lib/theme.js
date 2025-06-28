import { createTheme } from "@mui/material/styles";

const common = {
  typography: {
    fontFamily: `'Inter', 'Roboto', sans-serif`,
  },
  shape: {
    borderRadius: 12,
  },
};

const darkTheme = createTheme({
  ...common,
  palette: {
    mode: "dark",
    primary: {
      main: "#B176F9", // button color
    },
    background: {
      default: "#22192C", // page background
      paper: "#433558", // card bg
    },
    custom: {
      appBar: "#2C2336", // appbar/sidebar
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#C0C0C0",
    },
  },
});

const lightTheme = createTheme({
  ...common,
  palette: {
    mode: "light",
    primary: {
      main: "#7B61FF",
    },
    background: {
      default: "#F7F7FB", // page background
      paper: "#FFFFFF", // card bg
    },
    custom: {
      appBar: "#FFFFFF", // navbar/sidebar
    },
    text: {
      primary: "#1A1A1A",
      secondary: "#555",
    },
  },
});

export { lightTheme, darkTheme };
