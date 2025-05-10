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
import { izinService } from '../services/api';

const YeniTalep = () => {
  const navigate = useNavigate();
  const [selectedDates, setSelectedDates] = useState([]);
  const [requestDesc, setRequestDesc] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDateChange = (date) => {
    if (date) {
      // Tarihi ISO string formatına çevir
      const isoDate = date.toISOString();
      setSelectedDates(prev => [...prev, isoDate]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedDates.length === 0) {
      setError('Lütfen en az bir tarih seçin');
      return;
    }

    if (!requestDesc.trim()) {
      setError('Lütfen açıklama girin');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await izinService.createTalep({
        requestedDates: selectedDates,
        requestDesc: requestDesc.trim()
      });

      console.log('Talep oluşturma yanıtı:', response);
      navigate('/taleplerim');
    } catch (err) {
      console.error('Talep oluşturma hatası:', err);
      setError('Talep oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const removeDate = (indexToRemove) => {
    setSelectedDates(prev => prev.filter((_, index) => index !== indexToRemove));
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
              <DatePicker
                label="Tarih Seçin"
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
                sx={{ mb: 2 }}
              />
              
              {selectedDates.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Seçilen Tarihler:
                  </Typography>
                  {selectedDates.map((date, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        mb: 1 
                      }}
                    >
                      <Typography>
                        {new Date(date).toLocaleDateString('tr-TR')}
                      </Typography>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => removeDate(index)}
                      >
                        Kaldır
                      </Button>
                    </Box>
                  ))}
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