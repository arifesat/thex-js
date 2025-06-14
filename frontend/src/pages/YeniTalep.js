import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { format, isValid } from 'date-fns';
import { izinService } from '../services/api';

const YeniTalep = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [requestDesc, setRequestDesc] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatDateForDB = (date) => {
    if (!date || !isValid(date)) return '';
    return format(date, 'dd.MM.yyyy');
  };

  const formatDateForDisplay = (date) => {
    if (!date || !isValid(date)) return '';
    return format(date, 'dd MMMM yyyy', { locale: tr });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) {
      setError('Lütfen geçerli başlangıç ve bitiş tarihlerini seçin');
      return;
    }

    if (startDate > endDate) {
      setError('Bitiş tarihi başlangıç tarihinden önce olamaz');
      return;
    }

    if (!requestDesc.trim()) {
      setError('Lütfen açıklama girin');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const dateRange = `${formatDateForDB(startDate)}-${formatDateForDB(endDate)}`;
      console.log('Gönderilecek veriler:', {
        requestedDates: dateRange,
        requestDesc: requestDesc.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      const response = await izinService.createTalep({
        requestedDates: dateRange,
        requestDesc: requestDesc.trim()
      });

      console.log('Talep oluşturma yanıtı:', response);
      navigate('/taleplerim');
    } catch (err) {
      console.error('Talep oluşturma hatası:', err);
      console.error('Hata detayları:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Talep oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Yeni İzin Talebi
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                İzin Tarihleri
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <DatePicker
                  label="Başlangıç Tarihi"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="Bitiş Tarihi"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                  minDate={startDate}
                />
              </Box>
              
              {startDate && endDate && isValid(startDate) && isValid(endDate) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Seçilen Tarih Aralığı:
                  </Typography>
                  <Typography>
                    {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
                  </Typography>
                </Box>
              )}
            </Box>
          </LocalizationProvider>

          <TextField
            fullWidth
            label="Açıklama"
            multiline
            rows={4}
            value={requestDesc}
            onChange={(e) => setRequestDesc(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Gönderiliyor...' : 'Talep Oluştur'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/taleplerim')}
            >
              İptal
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default YeniTalep; 