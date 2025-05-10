const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is missing!');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const analyzeIzinTalebi = async (izinTalebi, calisanBilgileri, departmanKotalari) => {
  try {
    const prompt = `
İzin Talebi Analizi:

Çalışan Bilgileri:
- Ad Soyad: ${calisanBilgileri.adSoyad}
- Çalışan ID: ${calisanBilgileri.calisanId}
- Kıdem: ${calisanBilgileri.kidem} yıl
- Kalan İzin Hakkı: ${calisanBilgileri.remainingDays} gün

Talep Detayları:
- Talep Tarihi: ${izinTalebi.requestedDates}
- Açıklama: ${izinTalebi.requestDesc}

Departman Kotası:
- İstenen tarihlerde departman kotası: ${departmanKotalari.kalanKota} kişi
- Toplam departman kotası: ${departmanKotalari.toplamKota} kişi

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
          content: "Sen bir İK uzmanısın. İzin taleplerini şu kriterlere göre değerlendiriyorsun: 1) Kıdem sıralaması 2) Departman kotası 3) Çalışanın kalan izin hakkı 4) Talebin aciliyeti ve önceliği"
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