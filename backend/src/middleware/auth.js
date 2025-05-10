const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
    const user = await User.findOne({ calisanId: decoded.calisanId });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
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
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

module.exports = { auth, isIKUzmani }; 