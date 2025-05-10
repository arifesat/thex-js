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
  requestedDates: {
    type: String,
    required: true
  },
  requestStatus: {
    type: String,
    enum: ['Bekliyor', 'Onaylandı', 'Reddedildi'],
    default: 'Bekliyor'
  },
  requestDesc: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'izinTalepleri'
});

module.exports = mongoose.model('IzinTalebi', izinTalebiSchema); 