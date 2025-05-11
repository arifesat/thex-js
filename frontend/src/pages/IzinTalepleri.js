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
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { izinService } from '../services/api';

const IzinTalepleri = () => {
  const navigate = useNavigate();
  const [talepler, setTalepler] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTalep, setSelectedTalep] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchTalepler();
  }, []);

  const fetchTalepler = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await izinService.getTaleplerim();
      console.log('API Response:', response);
      
      // Debug log for each talep
      response.forEach((talep, index) => {
        console.log(`Talep ${index}:`, {
          id: talep._id,
          requestedDates: talep.requestedDates,
          type: typeof talep.requestedDates
        });
      });
      
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
      if (!dateString) {
        return 'Geçersiz tarih';
      }
      
      // Tarih formatını dönüştür (DD.MM.YYYY -> YYYY-MM-DD)
      const [day, month, year] = dateString.split('.');
      const isoDate = `${year}-${month}-${day}`;
      
      const date = parseISO(isoDate);
      return format(date, 'dd.MM.yyyy', { locale: tr });
    } catch (error) {
      console.error('Tarih formatlama hatası:', error, 'Tarih:', dateString);
      return dateString;
    }
  };

  const formatDateRange = (dateRange) => {
    if (!dateRange) return 'Geçersiz tarih aralığı';
    
    const [start, end] = dateRange.split('-');
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const formatRequestTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd.MM.yyyy HH:mm', { locale: tr });
    } catch (error) {
      console.error('Talep zamanı formatlama hatası:', error);
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

  const handleViewAnalysis = (talep) => {
    setSelectedTalep(talep);
    setOpenDialog(true);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
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
              {talepler.map((talep) => {
                console.log('Rendering talep:', talep);
                return (
                  <TableRow key={talep._id}>
                    <TableCell>{formatRequestTime(talep.requestTime)}</TableCell>
                    <TableCell>{formatDateRange(talep.requestedDates)}</TableCell>
                    <TableCell>{talep.requestDesc}</TableCell>
                    <TableCell>
                      <Chip
                        label={talep.requestStatus}
                        color={getStatusColor(talep.requestStatus)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default IzinTalepleri; 