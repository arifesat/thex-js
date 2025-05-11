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
  Tooltip,
  Grid
} from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';
import BarChartIcon from '@mui/icons-material/BarChart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { izinService } from '../services/api';
import { format, differenceInDays, parseISO, eachDayOfInterval } from 'date-fns';
import { tr } from 'date-fns/locale';

const IKUzmaniPaneli = () => {
  const [talepler, setTalepler] = useState([]);
  const [selectedTalep, setSelectedTalep] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAnalysisDialog, setOpenAnalysisDialog] = useState(false);
  const [openChartDialog, setOpenChartDialog] = useState(false);
  const [openDashboard, setOpenDashboard] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [dateStats, setDateStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

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

  const prepareDepartmentStats = (talepler) => {
    const stats = talepler.reduce((acc, talep) => {
      const duration = parseDateRange(talep.requestedDates).duration;
      const existingDept = acc.find(item => item.department === talep.pozisyon);
      
      if (existingDept) {
        existingDept.totalDays += duration;
        existingDept.count += 1;
      } else {
        acc.push({
          department: talep.pozisyon,
          totalDays: duration,
          count: 1
        });
      }
      return acc;
    }, []);

    return stats.map(dept => ({
      ...dept,
      averageDays: Math.round((dept.totalDays / dept.count) * 10) / 10
    }));
  };

  const prepareDateStats = (talepler) => {
    const dateMap = new Map();
    
    talepler.forEach(talep => {
      const { start, end } = parseDateRange(talep.requestedDates);
      if (start && end) {
        const days = eachDayOfInterval({ start, end });
        days.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
        });
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({
        date: format(parseISO(date), 'dd MMM', { locale: tr }),
        count
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const loadDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const response = await izinService.getAllTalepler();
      setDepartmentStats(prepareDepartmentStats(response));
      setDateStats(prepareDateStats(response));
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
      setError('İstatistikler yüklenirken bir hata oluştu');
    } finally {
      setLoadingStats(false);
    }
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="İzin İstatistikleri">
            <IconButton 
              onClick={() => {
                setOpenDashboard(true);
                loadDashboardStats();
              }}
              sx={{ 
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              <DashboardIcon />
            </IconButton>
          </Tooltip>
        </Box>
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
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTypography-root': {
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '-0.5px'
          }
        }}>
          AI Analiz Sonucu
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedTalep?.aiAnalysis && (
            <Box sx={{ 
              p: 4,
              bgcolor: selectedTalep.aiAnalysis.status === 'Reddedilmelidir' ? 'rgba(211, 47, 47, 0.04)' : 'rgba(46, 125, 50, 0.04)',
              borderRadius: 2,
              m: 3
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 4,
                pb: 3,
                borderBottom: '1px solid',
                borderColor: selectedTalep.aiAnalysis.status === 'Reddedilmelidir' ? 'error.light' : 'success.light'
              }}>
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600,
                      letterSpacing: '-0.5px',
                      mb: 1,
                      color: 'text.primary'
                    }}
                  >
                    {selectedTalep.adSoyad}
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 500,
                      color: 'text.secondary',
                      letterSpacing: '0.2px'
                    }}
                  >
                    Çalışan ID: {selectedTalep.calisanId}
                  </Typography>
                </Box>
                <Chip
                  label={selectedTalep.aiAnalysis.status}
                  color={selectedTalep.aiAnalysis.status === 'Reddedilmelidir' ? 'error' : 'success'}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    py: 2,
                    px: 2,
                    borderRadius: 2,
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              </Box>
              
              <List sx={{ 
                py: 0,
                '& .MuiListItem-root': {
                  px: 0,
                  py: 2
                }
              }}>
                {selectedTalep.aiAnalysis.gerekce.map((gerekce, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={gerekce}
                      primaryTypographyProps={{
                        color: selectedTalep.aiAnalysis.status === 'Reddedilmelidir' ? 'error.main' : 'success.main',
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        lineHeight: 1.6,
                        letterSpacing: '0.2px'
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ 
                mt: 4, 
                p: 3, 
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: selectedTalep.aiAnalysis.status === 'Reddedilmelidir' ? 'error.light' : 'success.light',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <Typography
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '1rem',
                    color: 'text.primary',
                    lineHeight: 1.7,
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
        <DialogActions sx={{ 
          px: 4, 
          py: 3,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained"
                color="success"
                onClick={() => {
                  handleStatusUpdate(selectedTalep._id, 'Onaylandı');
                  setOpenAnalysisDialog(false);
                }}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                  }
                }}
              >
                İzni Onayla
              </Button>
              <Button 
                variant="contained"
                color="error"
                onClick={() => {
                  handleStatusUpdate(selectedTalep._id, 'Reddedildi');
                  setOpenAnalysisDialog(false);
                }}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(211, 47, 47, 0.2)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
                  }
                }}
              >
                İzni Reddet
              </Button>
            </Box>
            <Button 
              onClick={() => setOpenAnalysisDialog(false)}
              variant="outlined"
              sx={{ 
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                borderRadius: 2,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2
                }
              }}
            >
              Kapat
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Dashboard Dialog */}
      <Dialog 
        open={openDashboard} 
        onClose={() => setOpenDashboard(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTypography-root': {
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '-0.5px'
          }
        }}>
          İzin Bilgileri İstatistik Dashboard
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {loadingStats ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* İzin Yoğunluğu */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    İzin Yoğunluğu
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer>
                      <LineChart data={dateStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          name="İzin Talebi Sayısı" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 7, fill: '#8884d8', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setOpenDashboard(false)}
            variant="contained"
            sx={{ 
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              borderRadius: 2
            }}
          >
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default IKUzmaniPaneli; 