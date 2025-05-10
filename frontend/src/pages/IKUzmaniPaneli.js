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
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { izinService } from '../services/api';

const IKUzmaniPaneli = () => {
  const [talepler, setTalepler] = useState([]);
  const [selectedTalep, setSelectedTalep] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAnalysisDialog, setOpenAnalysisDialog] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

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

  const handleAnalyze = async (talep) => {
    try {
      setAnalyzing(true);
      setSelectedTalep(talep);
      const analyzedTalep = await izinService.analyzeTalep(talep._id);
      setSelectedTalep(analyzedTalep);
      setOpenAnalysisDialog(true);
      fetchTalepler(); // Refresh the list to show updated analysis
    } catch (error) {
      console.error('Talep analiz edilemedi:', error);
      setError('Talep analiz edilirken bir hata oluştu');
    } finally {
      setAnalyzing(false);
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

  const parseDateRange = (dateRange) => {
    if (!dateRange) return { start: null, end: null, duration: 0 };
    
    const [start, end] = dateRange.split('-').map(date => {
      const [day, month, year] = date.split('.');
      return new Date(year, month - 1, day);
    });

    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return { start, end, duration };
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
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
                <TableCell>Kıdem (Yıl)</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell>Talep Zamanı</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {talepler.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
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
                      <TableCell>{talep.kidem}</TableCell>
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
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleAnalyze(talep)}
                            disabled={analyzing}
                          >
                            {analyzing && selectedTalep?._id === talep._id ? (
                              <CircularProgress size={20} />
                            ) : (
                              'AI Analiz'
                            )}
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setSelectedTalep(talep);
                              setOpenDialog(true);
                            }}
                          >
                            İşlem
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* İşlem Dialog */}
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

      {/* AI Analiz Dialog */}
      <Dialog 
        open={openAnalysisDialog} 
        onClose={() => setOpenAnalysisDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>AI Analiz Sonucu</DialogTitle>
        <DialogContent>
          {selectedTalep?.aiAnalysis && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedTalep.adSoyad} (ID {selectedTalep.calisanId})
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Talep Tarihi: {selectedTalep.requestedDates}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Durum: {selectedTalep.aiAnalysis.status}
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Gerekçe:
              </Typography>
              <List>
                {selectedTalep.aiAnalysis.gerekce.map((gerekce, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`• ${gerekce}`} />
                  </ListItem>
                ))}
              </List>

              {selectedTalep.aiAnalysis.alternatifOneri && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Alternatif Öneri:
                  </Typography>
                  <Typography>
                    {selectedTalep.aiAnalysis.alternatifOneri}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAnalysisDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default IKUzmaniPaneli; 