import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container
} from '@mui/material';
import { authService } from '../services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleNewRequest = () => {
    navigate('/yeni-talep');
  };

  return (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}
          >
            İzin Yönetim Sistemi
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              {user?.adSoyad}
            </Typography>
            
            <Button
              color="inherit"
              variant="outlined"
              onClick={handleNewRequest}
              sx={{ mr: 2 }}
            >
              Yeni İzin Talebi
            </Button>

            <Button
              color="inherit"
              variant="outlined"
              onClick={handleLogout}
            >
              Çıkış Yap
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 