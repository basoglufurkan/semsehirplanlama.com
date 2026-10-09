# Sem Şehir Planlama — Web Sitesi

Şehir Plancısı Semina Dağlı Başoğlu için hazırlanmış, animasyonlu tek sayfa web sitesi.

**Teknolojiler:** Vite · GSAP (ScrollTrigger, SplitText, DrawSVG) · Lenis (yumuşak kaydırma)

## Geliştirme

```bash
npm install
npm run dev
```

## Yayın için derleme

```bash
npm run build
```

Çıktı `dist/` klasörüne yazılır; herhangi bir statik barındırma servisine yüklenebilir.

## Dosya yapısı

- `index.html` — tüm sayfa içeriği (metinler burada)
- `src/main.js` — başlangıç noktası
- `src/js/plan.js` — kendini çizen imar planı üreticisi
- `src/js/intro.js` — açılış ekranı ve giriş animasyonu
- `src/js/scroll.js` — kaydırmaya bağlı animasyonlar
- `src/js/ui.js` — menü, imleç, SSS, iletişim formu
- `src/styles/` — stiller (renkler `base.css` başında)

## Güncellenmesi gerekenler

`index.html` içinde `TODO` ile işaretli yerler:

- Hakkımızda bölümündeki "Planlanan alan" ve "Kurum ve belediye" sayıları
- Projeler bölümündeki örnek projeler
- Fotoğraf: `public/semina.jpg` ekleyip `index.html` içindeki `<img>` satırını açın
