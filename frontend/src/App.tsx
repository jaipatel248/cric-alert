import React from 'react';
import { Routes, Route } from "react-router-dom";
import { Container, Box } from "@mui/material";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import Home from "./pages/Home";
import MatchMonitor from "./pages/MatchMonitor";
import AlertsList from "./pages/AlertsList";
import AlertDetail from "./pages/AlertDetail";

function App() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Header />
      <Container component='main' sx={{ flex: 1, py: 4 }}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/monitor' element={<MatchMonitor />} />
          <Route path='/monitor/:matchId' element={<MatchMonitor />} />
          <Route path='/alerts' element={<AlertsList />} />
          <Route path='/alerts/:monitorId' element={<AlertDetail />} />
        </Routes>
      </Container>
      <Footer />
    </Box>
  );
}

export default App;
