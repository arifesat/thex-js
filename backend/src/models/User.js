const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  calisanId: {
    type: Number,
    required: true,
    unique: true
  },
  adSoyad: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  pozisyon: {
    type: String,
    required: true,
    enum: ['Çalışan', 'Şef', 'Müdür', 'Uzman', 'İK Uzmanı']
  },
  pozisyonSeviyesi: {
    type: Number,
    required: true,
    default: 1,
    validate: {
      validator: function(v) {
        const seviyeler = {
          'Çalışan': 1,
          'Şef': 2,
          'Müdür': 3,
          'Uzman': 2,
          'İK Uzmanı': 2
        };
        return v === seviyeler[this.pozisyon];
      },
      message: 'Pozisyon seviyesi pozisyon ile uyumlu olmalıdır'
    }
  },
  workStartDate: {
    type: Date,
    required: true
  },
  role: {
    type: String,
    enum: ['Çalışan', 'Yönetici'],
    default: 'Çalışan'
  },
  usedDays: {
    type: Number,
    default: 0
  },
  remainingDays: {
    type: Number,
    default: 14
  },
  enabled: {
    type: Boolean,
    default: true
  },
  _class: {
    type: String,
    default: 'com.izin_talebi.izin_talebi_spring.model.User'
  }
}, {
  timestamps: true,
  collection: 'calisanlar'
});

module.exports = mongoose.model('User', userSchema); 