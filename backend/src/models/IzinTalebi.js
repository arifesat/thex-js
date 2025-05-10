const mongoose = require('mongoose');

const izinTalebiSchema = new mongoose.Schema({
  calisanId: {
    type: Number,
    required: true
  },
  requestTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  requestedDates: [{
    type: Date,
    required: true
  }],
  requestStatus: {
    type: String,
    enum: ['Bekliyor', 'Onaylandı', 'Reddedildi'],
    default: 'Bekliyor'
  },
  requestDesc: {
    type: String,
    required: true
  },
  _class: {
    type: String,
    default: 'com.izin_talebi.izin_talebi_spring.model.IzinTalebi'
  }
}, {
  timestamps: true,
  collection: 'izinTalepleri'
});

module.exports = mongoose.model('IzinTalebi', izinTalebiSchema); 