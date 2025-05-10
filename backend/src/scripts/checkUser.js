require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUser() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect('mongodb://localhost:27017/izin_talebi_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB bağlantısı başarılı');

    // Tüm kullanıcıları getir
    const users = await User.find({});
    console.log('\nTüm kullanıcılar:');
    console.log(JSON.stringify(users, null, 2));

    // Belirli bir email ile kullanıcı ara
    const testUser = await User.findOne({ email: 'ahmet.yilmaz64@outlook.com' });
    console.log('\nTest kullanıcısı:');
    console.log(JSON.stringify(testUser, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

checkUser(); 