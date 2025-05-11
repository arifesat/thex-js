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
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import BarChartIcon from '@mui/icons-material/BarChart';
import { izinService } from '../services/api';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

const IKUzmaniPaneli = () => {
  const [talepler, setTalepler] = useState([]);
  const [selectedTalep, setSelectedTalep] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAnalysisDialog, setOpenAnalysisDialog] = useState(false);
  const [openChartDialog, setOpenChartDialog] = useState(false);
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
    try {
      const date = new Date(dateString);
      return format(date, 'dd.MM.yyyy', { locale: tr });
    } catch (error) {
      console.error('Tarih formatlama hatası:', error);
      return dateString;
    }
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

  const calculateSeniority = (startDate) => {
    try {
      console.log('Original startDate:', startDate);
      
      // ISO formatındaki tarihi parse et
      const start = new Date(startDate);
      // Referans tarihi olarak 1 Ocak 2024'ü kullan
      const referenceDate = new Date('2024-01-01');
      
      console.log('Parsed start date:', start);
      console.log('Reference date:', referenceDate);
      
      // Toplam gün sayısını hesapla
      const diffDays = differenceInDays(referenceDate, start);
      console.log('Difference in days:', diffDays);
      
      // 6 aydan kısa çalışma süresi kontrolü (yaklaşık 180 gün)
      if (diffDays < 180) {
        return '6 aydan kısa';
      }
      
      // Yıl olarak hesapla (ondalıklı)
      const years = diffDays / 365;
      console.log('Years:', years);
      
      // 0.5'e yuvarla (6 aylık hassasiyet)
      const roundedYears = Math.round(years * 2) / 2;
      console.log('Rounded years:', roundedYears);
      
      return roundedYears;
    } catch (error) {
      console.error('Kıdem hesaplama hatası:', error, 'Start date:', startDate);
      return '6 aydan kısa';
    }
  };

  const prepareChartData = () => {
    const data = talepler.reduce((acc, talep) => {
      const duration = parseDateRange(talep.requestedDates).duration;
      const existingEntry = acc.find(item => item.name === talep.adSoyad);
      
      if (existingEntry) {
        existingEntry.value += duration;
      } else {
        acc.push({
          name: talep.adSoyad,
          value: duration,
          id: talep._id
        });
      }
      return acc;
    }, []);

    return data;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 1.5, 
          borderRadius: 1,
          boxShadow: 1,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {payload[0].name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {payload[0].value} gün izin talebi
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          İzin Talepleri Yönetimi
        </Typography>
        <Tooltip title="İzin Talepleri Dağılımı">
          <IconButton 
            onClick={() => setOpenChartDialog(true)}
            sx={{ 
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            <BarChartIcon />
          </IconButton>
        </Tooltip>
      </Box>

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
                  const seniority = calculateSeniority(talep.workStartDate);
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
                      <TableCell>
                        {typeof seniority === 'string' ? seniority : `${seniority} yıl`}
                      </TableCell>
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
            <Box sx={{ 
              mt: 2, 
              p: 3, 
              bgcolor: selectedTalep.aiAnalysis.status === 'Reddedilmelidir' ? '#fff3f3' : '#f3fff3',
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 3,
                pb: 2,
                borderBottom: '2px solid',
                borderColor: selectedTalep.aiAnalysis.status === 'Reddedilmelidir' ? 'error.light' : 'success.light'
              }}>
                <Box>
                  <Typography 
                    variant="h6" 
                    color="text.secondary"
                    sx={{ 
                      fontWeight: 500,
                      letterSpacing: '0.3px',
                      mb: 0.5
                    }}
                  >
                    {selectedTalep.adSoyad}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontWeight: 400,
                      letterSpacing: '0.2px'
                    }}
                  >
                    ID: {selectedTalep.calisanId}
                  </Typography>
                </Box>
                <Chip
                  label={selectedTalep.aiAnalysis.status}
                  color={selectedTalep.aiAnalysis.status === 'Reddedilmelidir' ? 'error' : 'success'}
                  sx={{
                    fontWeight: 600,
                    fontSize: '1rem',
                    py: 2,
                    px: 1
                  }}
                />
              </Box>
              
              <List sx={{ 
                py: 0,
                '& .MuiListItem-root': {
                  px: 0
                }
              }}>
                {selectedTalep.aiAnalysis.gerekce.map((gerekce, index) => (
                  <ListItem key={index} sx={{ py: 1.5 }}>
                    <ListItemText 
                      primary={gerekce}
                      primaryTypographyProps={{
                        color: selectedTalep.aiAnalysis.status === 'Reddedilmelidir' ? 'error.main' : 'success.main',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        lineHeight: 1.6,
                        letterSpacing: '0.3px'
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ 
                mt: 4, 
                p: 3, 
                bgcolor: 'rgba(0,0,0,0.02)', 
                borderRadius: 1.5,
                border: '2px solid',
                borderColor: selectedTalep.aiAnalysis.status === 'Reddedilmelidir' ? 'error.light' : 'success.light'
              }}>
                <Typography
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.9rem',
                    color: selectedTalep.aiAnalysis.status === 'Reddedilmelidir' ? 'error.main' : 'success.main',
                    lineHeight: 1.6,
                    fontFamily: 'inherit',
                    m: 0,
                    fontWeight: 400,
                    letterSpacing: '0.2px'
                  }}
                >
                  {selectedTalep.aiAnalysis.analysis}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button 
            onClick={() => setOpenAnalysisDialog(false)}
            variant="contained"
            color={selectedTalep?.aiAnalysis?.status === 'Reddedilmelidir' ? 'error' : 'success'}
            sx={{ 
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chart Dialog */}
      <Dialog 
        open={openChartDialog} 
        onClose={() => setOpenChartDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>İzin Talepleri Dağılımı</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400, width: '100%', mt: 2 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={prepareChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data) => {
                    const talep = talepler.find(t => t._id === data.id);
                    if (talep) {
                      handleAnalyze(talep);
                      setOpenChartDialog(false);
                    }
                  }}
                >
                  {prepareChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChartDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default IKUzmaniPaneli; 