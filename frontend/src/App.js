import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import GestioneCamere from './pages/GestioneCamere';
import GestioneAlloggiati from './pages/GestioneAlloggiati';
import GestioneAssegnazioni from './pages/GestioneAssegnazioni';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              }
            />
            <Route
              path="/camere"
              element={
                <Layout>
                  <GestioneCamere />
                </Layout>
              }
            />
            <Route
              path="/alloggiati"
              element={
                <Layout>
                  <GestioneAlloggiati />
                </Layout>
              }
            />
            <Route
              path="/assegnazioni"
              element={
                <Layout>
                  <GestioneAssegnazioni />
                </Layout>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;