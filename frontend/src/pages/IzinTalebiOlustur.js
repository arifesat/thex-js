import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { izinService } from '../services/api';

const IzinTalebiOlustur = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    baslangicTarihi: null,
    bitisTarihi: null,
    aciklama: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDateChange = (field) => (date) => {
    setFormData({
      ...formData,
      [field]: date
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const izinData = {
        requestedDates: `${formData.baslangicTarihi.toLocaleDateString()}-${formData.bitisTarihi.toLocaleDateString()}`,
        requestDesc: formData.aciklama
      };

      await izinService.createIzinTalebi(izinData);
      setSuccess('İzin talebiniz başarıyla oluşturuldu');
      setTimeout(() => navigate('/izinlerim'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'İzin talebi oluşturulurken bir hata oluştu');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Yeni İzin Talebi Oluştur
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Başlangıç Tarihi"
                    value={formData.baslangicTarihi}
                    onChange={handleDateChange('baslangicTarihi')}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Bitiş Tarihi"
                    value={formData.bitisTarihi}
                    onChange={handleDateChange('bitisTarihi')}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>

            <TextField
              fullWidth
              label="Açıklama"
              name="aciklama"
              multiline
              rows={4}
              value={formData.aciklama}
              onChange={handleChange}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
            >
              İzin Talebi Oluştur
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default IzinTalebiOlustur; 