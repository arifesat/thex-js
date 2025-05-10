import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { izinService } from '../services/api';

const YoneticiPaneli = () => {
  const [izinTalepleri, setIzinTalepleri] = useState([]);
  const [selectedTalep, setSelectedTalep] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');

  useEffect(() => {
    loadIzinTalepleri();
  }, []);

  const loadIzinTalepleri = async () => {
    try {
      const response = await izinService.getIzinTalepleri();
      setIzinTalepleri(response);
    } catch (error) {
      console.error('İzin talepleri yüklenirken hata:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await izinService.updateIzinTalebi(id, newStatus);
      loadIzinTalepleri();
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
    }
  };

  const handleViewAnalysis = (talep) => {
    setSelectedTalep(talep);
    setAiAnalysis(talep.aiAnalysis?.analysis || 'AI analizi bulunamadı');
    setOpenDialog(true);
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Yönetici Paneli
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Çalışan ID</TableCell>
                <TableCell>Talep Tarihi</TableCell>
                <TableCell>İzin Tarihleri</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {izinTalepleri.map((talep) => (
                <TableRow key={talep._id}>
                  <TableCell>{talep.calisanId}</TableCell>
                  <TableCell>
                    {new Date(talep.requestTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{talep.requestedDates}</TableCell>
                  <TableCell>
                    <Chip
                      label={talep.requestStatus}
                      color={getStatusColor(talep.requestStatus)}
                    />
                  </TableCell>
                  <TableCell>{talep.requestDesc}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handleViewAnalysis(talep)}
                      sx={{ mr: 1 }}
                    >
                      AI Analizi
                    </Button>
                    {talep.requestStatus === 'Bekliyor' && (
                      <>
                        <Button
                          size="small"
                          color="success"
                          onClick={() => handleStatusChange(talep._id, 'Onaylandı')}
                          sx={{ mr: 1 }}
                        >
                          Onayla
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleStatusChange(talep._id, 'Reddedildi')}
                        >
                          Reddet
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>AI Analizi</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={aiAnalysis}
              InputProps={{
                readOnly: true,
              }}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Kapat</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default YoneticiPaneli; 