const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Routes
const authRoutes = require('./routes/auth');
const izinRoutes = require('./routes/izin');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB bağlantısı başarılı');
})
.catch((error) => {
  console.error('MongoDB bağlantı hatası:', error);
  process.exit(1);
});

// Bağlantı durumunu dinle
mongoose.connection.on('error', (err) => {
  console.error('MongoDB bağlantı hatası:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB bağlantısı kesildi');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/izin', izinRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Uygulama hatası:', err);
  res.status(500).json({
    error: 'Sunucu hatası',
    details: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 