import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { izinService } from '../services/api';

const IzinTalepleri = () => {
  const navigate = useNavigate();
  const [talepler, setTalepler] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTalepler();
  }, []);

  const fetchTalepler = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await izinService.getTaleplerim();
      console.log('API Response:', response); // Debug için
      setTalepler(response || []);
    } catch (err) {
      console.error('Talepler getirilemedi:', err);
      setError('Talepler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: tr });
    } catch (error) {
      console.error('Tarih formatlama hatası:', error);
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Onaylandı':
        return 'success';
      case 'Reddedildi':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          İzin Taleplerim
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/yeni-talep')}
        >
          Yeni Talep Oluştur
        </Button>
      </Box>

      {talepler.length === 0 ? (
        <Alert severity="info">Henüz izin talebiniz bulunmamaktadır.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Talep Tarihi</TableCell>
                <TableCell>İzin Tarihleri</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell>Durum</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {talepler.map((talep) => (
                <TableRow key={talep._id}>
                  <TableCell>{formatDate(talep.requestTime)}</TableCell>
                  <TableCell>
                    {Array.isArray(talep.requestedDates) ? (
                      talep.requestedDates.map((date, index) => (
                        <div key={index}>{formatDate(date)}</div>
                      ))
                    ) : (
                      <div>Geçersiz tarih formatı</div>
                    )}
                  </TableCell>
                  <TableCell>{talep.requestDesc}</TableCell>
                  <TableCell>
                    <Chip 
                      label={talep.requestStatus} 
                      color={getStatusColor(talep.requestStatus)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default IzinTalepleri; 