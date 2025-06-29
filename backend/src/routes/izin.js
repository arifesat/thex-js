const express = require('express');
const router = express.Router();
const IzinTalebi = require('../models/IzinTalebi');
const User = require('../models/User');
const { auth, isIKUzmani } = require('../middleware/auth');
const { analyzeIzinTalebi } = require('../services/openaiService');

// Test endpoint for environment variables
router.get('/test-env', (req, res) => {
  res.json({
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

// Yeni izin talebi oluştur
router.post('/talep', auth, async (req, res) => {
  try {
    const { requestedDates, requestDesc } = req.body;
    console.log('Gelen talep verisi:', { 
      requestedDates, 
      requestDesc,
      calisanId: req.user.calisanId,
      user: req.user
    });
    
    if (!requestedDates || typeof requestedDates !== 'string') {
      console.error('Geçersiz tarih formatı:', requestedDates);
      return res.status(400).json({ 
        error: 'Geçersiz tarih formatı',
        details: 'requestedDates string olmalı ve DD.MM.YYYY-DD.MM.YYYY formatında olmalıdır'
      });
    }

    if (!requestDesc || typeof requestDesc !== 'string') {
      console.error('Geçersiz açıklama:', requestDesc);
      return res.status(400).json({ 
        error: 'Geçersiz açıklama',
        details: 'requestDesc string olmalıdır'
      });
    }

    // Tarih formatını kontrol et
    const [startDate, endDate] = requestedDates.split('-');
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
    
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      console.error('Geçersiz tarih formatı:', { startDate, endDate });
      return res.status(400).json({ 
        error: 'Geçersiz tarih formatı',
        details: 'Tarihler DD.MM.YYYY formatında olmalıdır'
      });
    }

    // calisanId'yi number'a çevir
    const calisanId = Number(req.user.calisanId);
    console.log('Converted calisanId:', calisanId);

    if (isNaN(calisanId)) {
      console.error('Geçersiz calisanId:', req.user.calisanId);
      return res.status(400).json({
        error: 'Geçersiz çalışan ID',
        details: 'calisanId geçerli bir sayı olmalıdır'
      });
    }

    const izinTalebi = new IzinTalebi({
      calisanId,
      requestedDates,
      requestDesc,
      requestTime: new Date()
    });

    console.log('Oluşturulacak izin talebi:', izinTalebi);

    const savedTalep = await izinTalebi.save();
    console.log('Kaydedilen talep:', savedTalep);
    
    res.status(201).json(savedTalep);
  } catch (error) {
    console.error('İzin talebi oluşturma hatası:', error);
    console.error('Hata detayları:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    
    res.status(500).json({ 
      error: 'İzin talebi oluşturulamadı',
      details: error.message,
      code: error.code
    });
  }
});

// İzin talebi analizi
router.post('/talep/:id/analiz', auth, isIKUzmani, async (req, res) => {
  try {
    const talep = await IzinTalebi.findById(req.params.id);
    if (!talep) {
      return res.status(404).json({ error: 'İzin talebi bulunamadı' });
    }

    const calisan = await User.findOne({ calisanId: talep.calisanId });
    if (!calisan) {
      return res.status(404).json({ error: 'Çalışan bulunamadı' });
    }

    // Departman kotası hesaplama (örnek)
    const departmanKotalari = {
      kalanKota: 2, // Bu değer gerçek veritabanından gelmeli
      toplamKota: 5  // Bu değer gerçek veritabanından gelmeli
    };

    const calisanBilgileri = {
      adSoyad: calisan.adSoyad,
      calisanId: calisan.calisanId,
      pozisyon: calisan.pozisyon,
      pozisyonSeviyesi: calisan.pozisyonSeviyesi,
      workStartDate: calisan.workStartDate,
      remainingDays: calisan.remainingDays
    };

    const analysis = await analyzeIzinTalebi(talep, calisanBilgileri, departmanKotalari);
    
    // AI analizini parse et
    const analysisLines = analysis.analysis.split('\n');
    const status = analysisLines.find(line => line.startsWith('Durum:'))?.split(':')[1]?.trim();
    const gerekce = analysisLines
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim());
    const alternatifOneri = analysisLines
      .find(line => line.startsWith('Alternatif Öneri:'))
      ?.split(':')[1]
      ?.trim();

    // Analizi kaydet
    talep.aiAnalysis = {
      analysis: analysis.analysis,
      timestamp: analysis.timestamp,
      status,
      gerekce,
      alternatifOneri
    };

    await talep.save();
    
    res.json(talep);
  } catch (error) {
    console.error('İzin talebi analiz hatası:', error);
    res.status(500).json({ 
      error: 'İzin talebi analiz edilemedi',
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
        requestTime: new Date(talepObj.requestTime).toISOString()
      };
    });

    console.log('Gönderilen talepler:', formattedTalepler);
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

    // Her talep için çalışan bilgilerini getir
    const taleplerWithUserInfo = await Promise.all(talepler.map(async (talep) => {
      const user = await User.findOne({ calisanId: talep.calisanId });
      const talepObj = talep.toObject();
      return {
        ...talepObj,
        requestTime: new Date(talepObj.requestTime).toISOString(),
        adSoyad: user ? user.adSoyad : 'Bilinmiyor',
        remainingDays: user ? user.remainingDays : 0,
        workStartDate: user ? user.workStartDate : null,
        kidem: user ? Math.floor((new Date() - new Date(user.workStartDate)) / (1000 * 60 * 60 * 24 * 365)) : 0
      };
    }));

    console.log('Gönderilen talepler:', taleplerWithUserInfo);
    res.json(taleplerWithUserInfo);
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
      requestTime: new Date(talepObj.requestTime).toISOString()
    };
    
    console.log('Gönderilen güncellenmiş talep:', formattedTalep);
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