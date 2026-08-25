# 🚂 Railsort Level Editor

**Railsort Level Editor**, Unity tabanlı *Railsort* tren ve bulmaca oyunu için geliştirilmiş, tamamen tarayıcı üzerinden çalışan (Client-Side) modern ve görsel bir seviye tasarım aracıdır.

---

## ✨ Özellikler

### 🎨 Görsel Ray ve Harita Tasarımı
- **İnteraktif Grid:** Boyutlandırılabilir grid alanı ve hassas yerleşimler için **Half Grid (0.5 adımlı)** desteği.
- **Ray (Spline) Çizimi:** Köşe yuvarlama (Corner Radius), kapalı devre (Closed Loop) raylar ve kalınlık ayarları.
- **Tümünü Taşı (Move All):** Tüm rayları ve depoları harita üzerinde koordinatlarını bozmadan topluca sürükleyip taşıma.

### 🏢 İstasyon ve Tren (Depot & Wagon) Yönetimi
- **Depo Yerleşimi & Yönü:** 4 farklı giriş yönü (*North, East, South, West*) ve klavyeden hızlı rotasyon (`R` tuşu).
- **Kilitli Depo & Anahtar:** Kilitli istasyonlar için anahtar rengi ve anahtar modeli eşleştirmesi.
- **Vagon Dizilimi:** 11 farklı renk, boş slotlar ve soru işaretli gizli vagonlar (`H` tuşu).
- **Hassas Konumlandırma:** Klavye yön tuşları veya `I, J, K, L` tuşları ile seçili depoyu veya noktayı milimetrik kaydırma.

### 💾 Bağımsız Workspace & Veri Yönetimi
- **Otomatik Tarayıcı Kaydı (LocalStorage):** Sunucuya ihtiyaç duymadan yapılan tüm değişiklikler tarayıcı hafızasında saklanır.
- **Bölüm Yönetimi:** Sınırsız yeni bölüm ekleme (`+`) ve silme (`🗑️`).
- **Workspace Yedekleme (ZIP):** Tüm seviyeleri tek bir tıkla `.zip` (JSON) olarak dışa aktarma (**Export Workspace**) ve içe aktarma (**Import Workspace**).

### 🎮 Unity Doğrudan Export
- **Tek Tıkla Asset Üretimi:** Tasarlanan tüm bölümleri Unity'nin doğrudan okuyabildiği `.asset` (YAML) formatında `.zip` olarak indirir.
- **Dönüştürme Çarpanları:** Grid Multiplier ve Corner Multiplier ayarlarıyla Unity dünyasına tam ölçekli aktarım.
- **Otomatik Model & Tip Eşleme:** Vagon tiplerini ve anahtar modellerini benzersiz ve dengeli bir şekilde dağıtarak Unity formatına uyarlar.

---

## ⌨️ Kısayol Tuşları

| Kısayol | İşlev |
|---|---|
| `Ctrl + Z` | Geri Al (Undo) |
| `Ctrl + Y` / `Ctrl + Shift + Z` | İleri Al (Redo) |
| `R` | Seçili Depoyu Döndür (Rotate) |
| `H` | Seçili Vagonun Gizlilik Durumunu Aç/Kapat (Hidden Toggle) |
| `Ok Tuşları` | Tüm Haritayı Adım Adım Kaydır |
| `I, J, K, L` | Seçili Nesneyi (Depot / Ray Noktası) İnce Kaydır |

---

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için:

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Canlı (Production) build alın
npm run build
```

---

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Dosya / ZIP İşleme:** [JSZip](https://stuk.github.io/jszip/) & [FileSaver.js](https://github.com/eligrey/FileSaver.js/)
- **Stil & Tasarım:** Vanilla CSS (Modern Dark Mode UI)
