require('dotenv').config();
const mongoose = require('mongoose');

async function checkIzinTalepleri() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect('mongodb://localhost:27017/izin_talebi_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB bağlantısı başarılı');

    // Doğrudan koleksiyona erişim
    const db = mongoose.connection.db;
    const izinTalepleri = await db.collection('izinTalepleri').find({}).toArray();
    
    console.log('\nTüm izin talepleri:');
    console.log(JSON.stringify(izinTalepleri, null, 2));

    // Belirli bir çalışanın taleplerini getir
    const calisanTalepleri = await db.collection('izinTalepleri')
      .find({ calisanId: 1 })
      .toArray();
    
    console.log('\nÇalışan ID 1\'in talepleri:');
    console.log(JSON.stringify(calisanTalepleri, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

checkIzinTalepleri(); 