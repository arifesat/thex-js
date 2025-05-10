const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is missing!');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// İş günü hesaplama fonksiyonu
const calculateWorkingDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const day = date.getDay();
    // 0 = Pazar, 6 = Cumartesi
    if (day !== 0) { // Sadece Pazar günü tatil
      workingDays++;
    }
  }
  
  return workingDays;
};

// Kıdem hesaplama fonksiyonu
const calculateSeniority = (startDate) => {
  const start = new Date(startDate);
  const referenceDate = new Date('2024-01-01');
  const diffTime = Math.abs(referenceDate - start);
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  return diffYears;
};

// İzin hakkı hesaplama fonksiyonu
const calculateLeaveRights = (seniority) => {
  if (seniority < 1) return 0; // 1 yıldan az kıdem
  if (seniority <= 5) return 14; // 1-5 yıl arası
  if (seniority < 15) return 20; // 5-15 yıl arası
  return 26; // 15 yıl ve üzeri
};

// Yasaklı dönem kontrolü
const isRestrictedPeriod = (startDate, endDate) => {
  const restrictedPeriods = [
    { start: '2024-06-18', end: '2024-07-02', reason: 'Ankara Otoyol Projesi Teslim Dönemi' },
    { start: '2024-09-08', end: '2024-09-22', reason: 'İstanbul Marina Projesi Teslim Dönemi' },
    { start: '2024-12-03', end: '2024-12-17', reason: 'İzmir Konut Projesi Teslim Dönemi' },
    { start: '2024-12-01', end: '2025-01-15', reason: 'Performans Değerlendirme Dönemi' }
  ];

  const requestStart = new Date(startDate);
  const requestEnd = new Date(endDate);

  for (const period of restrictedPeriods) {
    const periodStart = new Date(period.start);
    const periodEnd = new Date(period.end);
    
    if (requestStart <= periodEnd && requestEnd >= periodStart) {
      return { isRestricted: true, reason: period.reason };
    }
  }

  return { isRestricted: false };
};

// Yaz kotası kontrolü
const isSummerQuotaExceeded = (startDate, endDate, requestedDays) => {
  const summerStart = new Date('2024-06-01');
  const summerEnd = new Date('2024-08-31');
  const requestStart = new Date(startDate);
  const requestEnd = new Date(endDate);

  if (requestStart >= summerStart && requestEnd <= summerEnd) {
    return requestedDays > 6;
  }
  return false;
};

// Köprü izni kontrolü
const checkBridgeHoliday = (startDate, endDate) => {
  const holidays = [
    '2024-04-23', // 23 Nisan
    '2024-05-01', // 1 Mayıs
    '2024-05-19', // 19 Mayıs
    '2024-07-15', // 15 Temmuz
    '2024-08-30', // 30 Ağustos
    '2024-10-29', // 29 Ekim
    '2025-01-01'  // 1 Ocak
  ];

  const requestStart = new Date(startDate);
  const requestEnd = new Date(endDate);

  for (const holiday of holidays) {
    const holidayDate = new Date(holiday);
    const dayBefore = new Date(holidayDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(holidayDate);
    dayAfter.setDate(dayAfter.getDate() + 1);

    if (requestStart <= dayBefore && requestEnd >= dayAfter) {
      return true;
    }
  }
  return false;
};

const analyzeIzinTalebi = async (izinTalebi, calisanBilgileri, departmanKotalari) => {
  try {
    // İzin tarihlerini parse et
    const [startDate, endDate] = izinTalebi.requestedDates.split('-').map(date => {
      const [day, month, year] = date.split('.');
      return `${year}-${month}-${day}`;
    });

    // İş günü sayısını hesapla
    const requestedWorkingDays = calculateWorkingDays(startDate, endDate);

    // Kıdem ve izin hakkı hesapla
    const seniority = calculateSeniority(calisanBilgileri.startDate);
    const leaveRights = calculateLeaveRights(seniority);

    // Yasaklı dönem kontrolü
    const restrictedPeriod = isRestrictedPeriod(startDate, endDate);

    // Yaz kotası kontrolü
    const summerQuotaExceeded = isSummerQuotaExceeded(startDate, endDate, requestedWorkingDays);

    // Köprü izni kontrolü
    const isBridgeHoliday = checkBridgeHoliday(startDate, endDate);

    const prompt = `
İzin Talebi Analizi:

Çalışan Bilgileri:
- Ad Soyad: ${calisanBilgileri.adSoyad}
- Çalışan ID: ${calisanBilgileri.calisanId}
- İşe Başlama Tarihi: ${calisanBilgileri.startDate}
- Kıdem: ${seniority} yıl
- Yıllık İzin Hakkı: ${leaveRights} gün
- Kalan İzin Hakkı: ${calisanBilgileri.remainingDays} gün

Talep Detayları:
- Talep Tarihi: ${izinTalebi.requestedDates}
- İstenen İş Günü Sayısı: ${requestedWorkingDays} gün (Pazar günleri hariç)
- Açıklama: ${izinTalebi.requestDesc}

Departman Kotası:
- İstenen tarihlerde departman kotası: ${departmanKotalari.kalanKota} kişi
- Toplam departman kotası: ${departmanKotalari.toplamKota} kişi
- Maksimum izinli çalışan oranı: %20

Özel Durumlar:
- Köprü İzni: ${isBridgeHoliday ? 'Evet' : 'Hayır'}
- Yaz Kotası Aşımı: ${summerQuotaExceeded ? 'Evet' : 'Hayır'}
- Yasaklı Dönem: ${restrictedPeriod.isRestricted ? `Evet - ${restrictedPeriod.reason}` : 'Hayır'}

Önemli Kurallar:
1. Pazar günleri izin hakkından düşülmez
2. İlk 6 ayını doldurmamış çalışanların izin talepleri reddedilir
3. Aynı pozisyonda izin çakışması durumunda kıdem süresi uzun olana öncelik verilir
4. Yaz döneminde (1 Haziran - 31 Ağustos) maksimum 6 gün izin kullanılabilir
5. Köprü izni durumunda 1 gün otomatik uzatılır
6. Departman kotası %20'yi geçemez
7. Doğum günü izni yılda 1 gün olarak kullanılabilir
8. Acil durum izinleri (sağlık, vefat) maksimum 5 gün olarak verilir

Lütfen bu izin talebini analiz et ve aşağıdaki formatta yanıt ver:

Durum: [Onaylanmalıdır/Reddedilmelidir]
Gerekçe:
- [Gerekçe 1]
- [Gerekçe 2]
- [Gerekçe 3]

[Eğer reddedilmelidir ise:]
Alternatif Öneri: [Alternatif tarih aralığı]
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Sen bir İK uzmanısın. İzin taleplerini şu kriterlere göre değerlendiriyorsun:
1) Kıdem sıralaması ve izin hakkı
2) Departman kotası (%20 limit)
3) Yasaklı dönemler
4) Yaz kotası (maksimum 6 gün)
5) Köprü izni kuralları
6) Acil durum önceliği

Önemli Notlar:
- Pazar günleri izin hakkından düşülmez
- İlk 6 ayını doldurmamış çalışanların izin talepleri reddedilir
- Aynı pozisyonda izin çakışması durumunda kıdem süresi uzun olana öncelik verilir
- Yaz döneminde maksimum 6 gün izin kullanılabilir
- Köprü izni durumunda 1 gün otomatik uzatılır
- Departman kotası %20'yi geçemez
- Doğum günü izni yılda 1 gün olarak kullanılabilir
- Acil durum izinleri maksimum 5 gün olarak verilir`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return {
      analysis: completion.choices[0].message.content,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('İzin talebi analiz edilirken bir hata oluştu');
  }
};

module.exports = {
  analyzeIzinTalebi
}; 