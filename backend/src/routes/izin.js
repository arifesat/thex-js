const express = require('express');
const router = express.Router();
const IzinTalebi = require('../models/IzinTalebi');
const { auth, isIKUzmani } = require('../middleware/auth');

// Yeni izin talebi oluştur
router.post('/talep', auth, async (req, res) => {
  try {
    const { requestedDates, requestDesc } = req.body;
    
    if (!requestedDates || !Array.isArray(requestedDates)) {
      return res.status(400).json({ error: 'Geçersiz tarih formatı' });
    }

    // Tarihleri Date nesnesine çevir
    const formattedDates = requestedDates.map(date => new Date(date));
    
    const izinTalebi = new IzinTalebi({
      calisanId: req.user.calisanId,
      requestedDates: formattedDates,
      requestDesc,
      requestTime: new Date()
    });

    await izinTalebi.save();
    res.status(201).json(izinTalebi);
  } catch (error) {
    console.error('İzin talebi oluşturma hatası:', error);
    res.status(500).json({ 
      error: 'İzin talebi oluşturulamadı',
      details: error.message 
    });
  }
});

// Kullanıcının kendi izin taleplerini getir
router.get('/taleplerim', auth, async (req, res) => {
  try {
    console.log('Kullanıcı ID:', req.user.calisanId);
    
    const talepler = await IzinTalebi.find({ calisanId: req.user.calisanId })
      .sort({ requestTime: -1 });
    
    console.log('Bulunan talepler:', talepler);

    // Tarihleri ISO string formatına çevir
    const formattedTalepler = talepler.map(talep => {
      const talepObj = talep.toObject();
      return {
        ...talepObj,
        requestedDates: Array.isArray(talepObj.requestedDates) 
          ? talepObj.requestedDates.map(date => new Date(date).toISOString())
          : [],
        requestTime: new Date(talepObj.requestTime).toISOString()
      };
    });

    res.json(formattedTalepler);
  } catch (error) {
    console.error('Talepler getirme hatası:', error);
    res.status(500).json({ 
      error: 'Talepler getirilemedi',
      details: error.message 
    });
  }
});

// İK Uzmanı için tüm izin taleplerini getir
router.get('/talepler', auth, isIKUzmani, async (req, res) => {
  try {
    console.log('İK Uzmanı talepleri getiriliyor...');
    
    const talepler = await IzinTalebi.find()
      .sort({ requestTime: -1 });

    console.log('Bulunan talepler:', talepler);

    // Tarihleri ISO string formatına çevir
    const formattedTalepler = talepler.map(talep => {
      const talepObj = talep.toObject();
      return {
        ...talepObj,
        requestedDates: Array.isArray(talepObj.requestedDates) 
          ? talepObj.requestedDates.map(date => new Date(date).toISOString())
          : [],
        requestTime: new Date(talepObj.requestTime).toISOString()
      };
    });

    res.json(formattedTalepler);
  } catch (error) {
    console.error('Talepler getirme hatası:', error);
    res.status(500).json({ 
      error: 'Talepler getirilemedi',
      details: error.message 
    });
  }
});

// İzin talebi durumunu güncelle (sadece İK Uzmanı)
router.put('/talep/:id', auth, isIKUzmani, async (req, res) => {
  try {
    const { requestStatus } = req.body;
    
    if (!['Bekliyor', 'Onaylandı', 'Reddedildi'].includes(requestStatus)) {
      return res.status(400).json({ error: 'Geçersiz durum değeri' });
    }

    const talep = await IzinTalebi.findByIdAndUpdate(
      req.params.id,
      { requestStatus },
      { new: true }
    );

    if (!talep) {
      return res.status(404).json({ error: 'İzin talebi bulunamadı' });
    }

    // Tarihleri ISO string formatına çevir
    const talepObj = talep.toObject();
    const formattedTalep = {
      ...talepObj,
      requestedDates: Array.isArray(talepObj.requestedDates) 
        ? talepObj.requestedDates.map(date => new Date(date).toISOString())
        : [],
      requestTime: new Date(talepObj.requestTime).toISOString()
    };

    res.json(formattedTalep);
  } catch (error) {
    console.error('Talep güncelleme hatası:', error);
    res.status(500).json({ 
      error: 'Talep güncellenemedi',
      details: error.message 
    });
  }
});

module.exports = router; 