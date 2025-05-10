import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Login from './pages/Login';
import IzinTalepleri from './pages/IzinTalepleri';
import YeniTalep from './pages/YeniTalep';
import IKUzmaniPaneli from './pages/IKUzmaniPaneli';
import Navbar from './components/Navbar';
import { authService } from './services/api';

// Protected Route bileşeni
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.getCurrentUser();
  const user = authService.getCurrentUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // İK Uzmanı kontrolü
  if (user?.pozisyon === 'İK Uzmanı' && window.location.pathname === '/taleplerim') {
    return <Navigate to="/ik-paneli" />;
  }

  return (
    <>
      <Navbar />
      <Box sx={{ mt: 2 }}>
        {children}
      </Box>
    </>
  );
};

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/taleplerim"
          element={
            <ProtectedRoute>
              <IzinTalepleri />
            </ProtectedRoute>
          }
        />
        <Route
          path="/yeni-talep"
          element={
            <ProtectedRoute>
              <YeniTalep />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ik-paneli"
          element={
            <ProtectedRoute>
              <IKUzmaniPaneli />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/taleplerim" />} />
      </Routes>
    </Box>
  );
}

export default App; 