import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    success: {
      main: "#4caf50",
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h1: {
      "@media (max-width:600px)": {
        fontSize: "2rem",
      },
    },
    h2: {
      "@media (max-width:600px)": {
        fontSize: "1.75rem",
      },
    },
    h3: {
      "@media (max-width:600px)": {
        fontSize: "1.5rem",
      },
    },
    h4: {
      "@media (max-width:600px)": {
        fontSize: "1.25rem",
      },
    },
    h5: {
      "@media (max-width:600px)": {
        fontSize: "1.1rem",
      },
    },
    h6: {
      "@media (max-width:600px)": {
        fontSize: "1rem",
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
