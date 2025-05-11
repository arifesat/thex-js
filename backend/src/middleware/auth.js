const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    console.log('Token:', token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
    console.log('Decoded token:', decoded);

    // calisanId'yi number'a çevir
    const calisanId = Number(decoded.calisanId);
    console.log('Converted calisanId:', calisanId);

    const user = await User.findOne({ calisanId });
    console.log('Found user:', user);

    if (!user) {
      console.error('User not found for calisanId:', calisanId);
      throw new Error('User not found');
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(401).json({ error: 'Lütfen giriş yapın' });
  }
};

const isIKUzmani = async (req, res, next) => {
  try {
    if (req.user.pozisyon !== 'İK Uzmanı') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }
    next();
  } catch (error) {
    console.error('IKUzmani middleware error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

module.exports = { auth, isIKUzmani }; 