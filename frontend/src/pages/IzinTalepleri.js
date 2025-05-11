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
                <TableCell>İşlemler</TableCell>
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
                      {talep.requestStatus === 'Reddedildi' && talep.aiAnalysis?.gerekce && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: '#fff3f3', borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="error" gutterBottom>
                            Red Gerekçeleri:
                          </Typography>
                          <List dense disablePadding>
                            {talep.aiAnalysis.gerekce.map((gerekce, index) => (
                              <ListItem key={index} sx={{ py: 0.5 }}>
                                <ListItemText 
                                  primary={`• ${gerekce}`}
                                  primaryTypographyProps={{ 
                                    variant: 'body2',
                                    color: 'error.main'
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                          {talep.aiAnalysis.alternatifOneri && (
                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #ffcdd2' }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Alternatif Öneri:
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {talep.aiAnalysis.alternatifOneri}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {talep.aiAnalysis && (
                        <Button
                          size="small"
                          onClick={() => handleViewAnalysis(talep)}
                          variant="outlined"
                        >
                          AI Analizi
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Yapay Zeka Analizi</DialogTitle>
        <DialogContent>
          {selectedTalep?.aiAnalysis && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Durum: {selectedTalep.aiAnalysis.status}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Gerekçeler:
              </Typography>
              <List>
                {selectedTalep.aiAnalysis.gerekce.map((gerekce, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={gerekce} />
                  </ListItem>
                ))}
              </List>

              {selectedTalep.aiAnalysis.alternatifOneri && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Alternatif Öneri:
                  </Typography>
                  <Typography>
                    {selectedTalep.aiAnalysis.alternatifOneri}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Detaylı Analiz:
                </Typography>
                <Typography
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    backgroundColor: '#f5f5f5',
                    p: 2,
                    borderRadius: 1
                  }}
                >
                  {selectedTalep.aiAnalysis.analysis}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default IzinTalepleri; 