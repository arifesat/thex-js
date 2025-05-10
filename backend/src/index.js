const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

// Load environment variables
const result = dotenv.config({ path: path.join(__dirname, '../.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Log environment variables (without sensitive data)
console.log('Environment loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  openAIKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0
});

// Routes
const authRoutes = require('./routes/auth');
const izinRoutes = require('./routes/izin');

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