import React, { useState, useEffect } from 'react';
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
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { izinService } from '../services/api';

const IKUzmaniPaneli = () => {
  const [talepler, setTalepler] = useState([]);
  const [selectedTalep, setSelectedTalep] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTalepler();
  }, []);

  const fetchTalepler = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await izinService.getAllTalepler();
      console.log('API Response:', response);
      setTalepler(response || []);
    } catch (error) {
      console.error('Talepler getirilemedi:', error);
      setError('Talepler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (talepId, newStatus) => {
    try {
      await izinService.updateTalepStatus(talepId, newStatus);
      fetchTalepler();
      setOpenDialog(false);
    } catch (error) {
      console.error('Talep güncellenemedi:', error);
      setError('Talep güncellenirken bir hata oluştu');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const parseDateRange = (dateRangeStr) => {
    if (!dateRangeStr || typeof dateRangeStr !== 'string') return { start: null, end: null };
    
    const [startDate, endDate] = dateRangeStr.split('-');
    if (!startDate || !endDate) return { start: null, end: null };

    // Convert DD.MM.YYYY to YYYY-MM-DD format
    const formatDateForParsing = (dateStr) => {
      const [day, month, year] = dateStr.split('.');
      return `${year}-${month}-${day}`;
    };

    const start = new Date(formatDateForParsing(startDate));
    const end = new Date(formatDateForParsing(endDate));
    
    // Calculate the number of days between dates (inclusive)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return { start, end, duration: diffDays };
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        İzin Talepleri Yönetimi
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography>Yükleniyor...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Çalışan ID</TableCell>
                <TableCell>Ad Soyad</TableCell>
                <TableCell>İzin Tarihleri</TableCell>
                <TableCell>Talep Edilen Gün</TableCell>
                <TableCell>Kalan İzin Hakkı</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell>Talep Zamanı</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {talepler.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Henüz izin talebi bulunmamaktadır.
                  </TableCell>
                </TableRow>
              ) : (
                talepler.map((talep) => {
                  const { start, end, duration } = parseDateRange(talep.requestedDates);
                  return (
                    <TableRow key={talep._id}>
                      <TableCell>{talep.calisanId}</TableCell>
                      <TableCell>{talep.adSoyad}</TableCell>
                      <TableCell>
                        {start && end && (
                          <div>
                            {formatDate(start)} - {formatDate(end)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{duration} gün</TableCell>
                      <TableCell>{talep.remainingDays} gün</TableCell>
                      <TableCell>{talep.requestDesc}</TableCell>
                      <TableCell>{formatDate(talep.requestTime)}</TableCell>
                      <TableCell>
                        <Chip
                          label={talep.requestStatus}
                          color={getStatusColor(talep.requestStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {talep.requestStatus === 'Bekliyor' && (
                          <Box>
                            <Button
                              size="small"
                              color="success"
                              onClick={() => {
                                setSelectedTalep(talep);
                                setOpenDialog(true);
                              }}
                              sx={{ mr: 1 }}
                            >
                              Onayla
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedTalep(talep);
                                setOpenDialog(true);
                              }}
                            >
                              Reddet
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>İzin Talebi Değerlendirme</DialogTitle>
        <DialogContent>
          <Typography>
            Bu izin talebini {selectedTalep?.requestStatus === 'Bekliyor' ? 'onaylamak' : 'reddetmek'} istediğinizden emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button
            color="success"
            onClick={() => handleStatusUpdate(selectedTalep._id, 'Onaylandı')}
          >
            Onayla
          </Button>
          <Button
            color="error"
            onClick={() => handleStatusUpdate(selectedTalep._id, 'Reddedildi')}
          >
            Reddet
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default IKUzmaniPaneli; 