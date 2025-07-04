# Kelime Oyunu - Scrabble Benzeri Mobil Oyun

## 📱 Proje Hakkında

Bu proje, **React Native** ve **Expo** kullanılarak geliştirilmiş, çok oyunculu kelime oyunudur. Scrabble benzeri oyun mekaniği ile kullanıcılar gerçek zamanlı olarak birbirleriyle kelime yarışması yapabilir.

## 🎮 Oyun Özellikleri

- **Çok Oyunculu Oyun**: Firebase ile gerçek zamanlı çok oyunculu oyun
- **Eşleşme Sistemi**: Farklı süre seçenekleri ile rakip arama
- **Kelime Doğrulama**: Türkçe kelime sözlüğü ile kelime kontrolü
- **Puan Sistemi**: Harf değerleri ve özel alan bonusları
- **Kullanıcı Profili**: Kazanma oranı ve oyun geçmişi takibi
- **Farklı Zaman Modları**: 2 dakika, 5 dakika, 12 saat, 24 saat

## 🎯 Oyun Kuralları

### Oyun Tahtası
- **15x15** karelik oyun tahtası
- **Özel alanlar**: 
  - `H²` ve `H³`: Harf puanını 2x ve 3x katına çıkarır
  - `K²` ve `K³`: Kelime puanını 2x ve 3x katına çıkarır
  - `★`: Merkez kare (başlangıç noktası)

### Taş Dağılımı
Türkçe alfabeye göre harf dağılımı:
- A: 12 adet (1 puan)
- E: 8 adet (1 puan)
- K, N, R, T: 5-6 adet (1 puan)
- Joker (*): 2 adet (0 puan)

### Puanlama
- Her harfin kendine özel puanı vardır
- Özel alanlar puan çarpanları sağlar
- Geçerli kelimeler Türkçe sözlükten kontrol edilir

## 🏗️ Teknik Yapı

### Frontend
- **React Native**: Mobil uygulama geliştirme
- **Expo**: Geliştirme ve deployment platformu
- **TypeScript**: Tip güvenliği
- **Expo Router**: Navigasyon yönetimi

### Backend
- **Firebase Authentication**: Kullanıcı kimlik doğrulama
- **Firebase Firestore**: Gerçek zamanlı veritabanı
- **Real-time Updates**: Oyun durumu senkronizasyonu

### Özel Algoritmalar
- **Kelime Doğrulama**: Türkçe kelime sözlüğü ile kontrol
- **Hamle Validasyonu**: Yasal hamle kontrolü
- **Puan Hesaplama**: Harf ve alan bonusları

## 🚀 Kurulum

### Gereksinimler
- Node.js (v16 veya üzeri)
- npm veya yarn
- Expo CLI
- Firebase hesabı

### Kurulum Adımları

1. **Projeyi klonlayın**
   ```bash
   git clone [repository-url]
   cd kelime
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Firebase yapılandırması**
   - `src/firebase/firebaseConfig.ts` dosyasında Firebase yapılandırma bilgilerinizi ekleyin
   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-auth-domain",
     projectId: "your-project-id",
     storageBucket: "your-storage-bucket",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id"
   };
   ```

4. **Uygulamayı çalıştırın**
   ```bash
   npm start
   ```

## 📱 Kullanım

### Kayıt ve Giriş
1. Uygulama açıldığında kayıt ol veya giriş yap
2. Kullanıcı adı ve şifre ile hesap oluştur

### Oyun Başlatma
1. Ana sayfadan "Yeni Oyun" seç
2. Oyun süresini belirle (2dk, 5dk, 12sa, 24sa)
3. Eşleşme bulunana kadar bekle
4. Rakip bulunduğunda oyun başlar

### Oyun Oynama
1. Sıran geldiğinde taşlarını tahta üzerine yerleştir
2. Geçerli kelimeler oluştur
3. Hamle yap ve puanını al
4. Rakibinin hamlesi için bekle

### Oyun Takibi
- **Aktif Oyunlar**: Devam eden oyunları görüntüle
- **Biten Oyunlar**: Geçmiş oyunları ve sonuçları incele
- **İstatistikler**: Başarı oranını takip et

## 🎨 Ekran Görüntüleri

### Ana Sayfa
- Kullanıcı karşılama ekranı
- Başarı oranı gösterimi
- Oyun menüsü

### Oyun Ekranı
- 15x15 oyun tahtası
- Harf çekme alanı
- Puan durumu
- Sıra göstergesi

### Eşleşme Ekranı
- Süre seçenekleri
- Rakip arama durumu

## 📂 Proje Yapısı

```
kelime/
├── app/                    # Sayfa bileşenleri
│   ├── index.tsx          # Ana sayfa
│   ├── game.tsx           # Oyun ekranı
│   ├── newgame.tsx        # Yeni oyun
│   ├── matchmaking.tsx    # Eşleşme
│   ├── activegames.tsx    # Aktif oyunlar
│   └── completedgames.tsx # Biten oyunlar
├── assets/                # Varlıklar
│   ├── kelimeler.json     # Türkçe kelime sözlüğü
│   └── images/           # Görsel varlıklar
├── components/            # Yeniden kullanılabilir bileşenler
├── src/firebase/          # Firebase yapılandırması
├── utils/                 # Yardımcı fonksiyonlar
│   └── gameValidation.ts  # Oyun doğrulama
└── constants/            # Sabit değerler
```

## 🔧 Geliştirici Notları

### Önemli Dosyalar
- `game.tsx`: Ana oyun mantığı ve UI
- `gameValidation.ts`: Hamle doğrulama algoritmaları
- `firebaseConfig.ts`: Firebase bağlantı ayarları
- `kelimeler.json`: Türkçe kelime veritabanı

### API Endpoints
- **Authentication**: Firebase Auth
- **Game State**: Firestore koleksiyonları
- **Real-time Updates**: Firestore listeners

### Performans Optimizasyonu
- Lazy loading ile hızlı başlangıç
- Optimized re-renders
- Efficient state management

## 🐛 Bilinen Sorunlar

1. Kelime sözlüğü dosyası (`kelimeler.json`) boş - güncellenmesi gerekiyor
2. Firebase yapılandırma bilgileri eksik
3. Bazı animasyonlar optimize edilebilir

## 🔜 Gelecek Özellikler

- [ ] Sesli bildirimler
- [ ] Daha zengin animasyonlar
- [ ] Sosyal medya paylaşımı
- [ ] Turnuva modu
- [ ] Arkadaş sistemi
- [ ] Günlük görevler

## 📝 Lisans

Bu proje özel bir projedir. Ticari kullanım için izin alınması gerekmektedir.

## 👥 Katkıda Bulunanlar

- **Furkan** - Geliştirici
- **Ela** - Kod geliştirme

## 📞 İletişim

Herhangi bir sorunuz için:
- GitHub Issues üzerinden bildirim yapabilirsiniz
- Geliştirici ile doğrudan iletişime geçebilirsiniz

---

**Not**: Bu README dosyası proje gelişimi sürecinde güncellenecektir. Kurulum ve kullanım talimatlarını takip ederken güncel sürümü kontrol etmeyi unutmayın.
