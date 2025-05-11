# İzin Yönetimi Sistemi

Bu proje, şirketlerin çalışan izinlerini yönetmek için geliştirilmiş modern bir web uygulamasıdır. Yapay zeka destekli özellikleriyle, izin taleplerinin daha akıllı ve verimli bir şekilde yönetilmesini sağlar.

## 🚀 Kullanılan Teknolojiler

### Backend
- **Node.js & Express.js**: Hızlı ve ölçeklenebilir API geliştirme
- **MongoDB & Mongoose**: Veritabanı yönetimi
- **JWT & Bcrypt**: Güvenli kimlik doğrulama ve yetkilendirme
- **OpenAI API**: Yapay zeka entegrasyonu
- **CORS**: Cross-origin resource sharing desteği
- **Dotenv**: Ortam değişkenleri yönetimi

### Frontend
- **React.js**: Modern ve reaktif kullanıcı arayüzü
- **Material-UI (MUI)**: Hazır UI bileşenleri ve tema desteği
- **React Router**: Sayfa yönlendirme ve navigasyon
- **Axios**: HTTP istekleri yönetimi
- **Date-fns**: Tarih işlemleri

## 🤖 Yapay Zeka Entegrasyonu

**Akıllı İzin Onaylama**: Yapay zeka, geçmiş izin verilerini analiz ederek, izin taleplerinin uygunluğunu değerlendirir.


### Prompt Örnekleri

```javascript
// İzin talebi değerlendirme promptu
const evaluationPrompt = `
  Geçmiş izin verilerine göre, aşağıdaki izin talebinin uygunluğunu değerlendir:
  - Çalışan: ${employeeName}
  - İzin Türü: ${leaveType}
  - Süre: ${duration}
  - Tarih: ${date}
`;

// Otomatik yanıt oluşturma promptu
const responsePrompt = `
  Aşağıdaki izin talebi için profesyonel bir yanıt oluştur:
  - Talep Eden: ${requester}
  - İzin Nedeni: ${reason}
  - Durum: ${status}
`;
```

## 🛠️ Kurulum

1. Backend kurulumu:
```bash
cd backend
npm install
npm run dev
```

2. Frontend kurulumu:
```bash
cd frontend
npm install
npm start
```

3. `.env` dosyasını oluşturun:
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

## 📝 Özellikler

- Kullanıcı kimlik doğrulama ve yetkilendirme
- İzin talebi oluşturma ve yönetme
- Yapay zeka destekli izin değerlendirme
- İzin takvimi görüntüleme
- Raporlama ve analiz
- Responsive tasarım

## 🔒 Güvenlik

- JWT tabanlı kimlik doğrulama
- Şifreli veri depolama
- CORS koruması
- API rate limiting
- Input validasyonu

## 📈 Performans İyileştirmeleri

- MongoDB indeksleme
- React lazy loading
- API response caching
- Image optimization
- Code splitting
