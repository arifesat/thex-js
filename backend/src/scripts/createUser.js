require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createUser() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect('mongodb://localhost:27017/izin_talebi_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB bağlantısı başarılı');

    // Test kullanıcısı oluştur
    const testUser = new User({
      calisanId: 'EMP001',
      adSoyad: 'Ahmet Yılmaz',
      email: 'ahmet.yilmaz64@outlook.com',
      password: '123456',
      pozisyon: 'Yazılım Geliştirici',
      workStartDate: new Date('2023-01-01'),
      role: 'calisan'
    });

    await testUser.save();
    console.log('Test kullanıcısı oluşturuldu:', testUser);

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

createUser(); 