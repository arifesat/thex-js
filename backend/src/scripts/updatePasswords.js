require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function updatePasswords() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect('mongodb://localhost:27017/izin_talebi_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB bağlantısı başarılı');

    // Tüm kullanıcıları getir
    const users = await User.find({});
    console.log(`${users.length} kullanıcı bulundu`);

    // Her kullanıcının şifresini güncelle
    for (const user of users) {
      // Şifre zaten hash'lenmiş mi kontrol et
      if (user.password.length < 60) { // bcrypt hash'leri genellikle 60 karakter
        const oldPassword = user.password;
        user.password = oldPassword; // Bu işlem pre-save middleware'i tetikleyecek
        await user.save();
        console.log(`Kullanıcı ${user.email} şifresi güncellendi`);
      } else {
        console.log(`Kullanıcı ${user.email} şifresi zaten hash'lenmiş`);
      }
    }

    console.log('Tüm şifreler güncellendi');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

updatePasswords(); 