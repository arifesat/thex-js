const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password }); // Debug log

    const user = await User.findOne({ email, password });
    console.log('Found user:', user); // Debug log

    if (!user) {
      return res.status(401).json({ error: 'Geçersiz email veya şifre' });
    }

    const token = jwt.sign(
      { calisanId: user.calisanId },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        calisanId: user.calisanId,
        adSoyad: user.adSoyad,
        email: user.email,
        role: user.role,
        pozisyon: user.pozisyon,
        remainingDays: user.remainingDays
      }
    });
  } catch (error) {
    console.error('Login error:', error); // Debug log
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ calisanId: req.user.calisanId })
      .select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router; 