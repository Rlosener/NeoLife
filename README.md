# NeoLife | Proje ve yaşam web sitesi

NeoLife, gayrimenkul ve yaşam projelerini Türkçe, görsel ağırlıklı çok sayfalı bir web deneyiminde sunan statik web projesidir. Bu depo, masaüstü ve mobil ekranlarda marka anlatımını, proje keşfini ve iletişim akışını bir araya getirir.

## Tasarım yaklaşımı

- Sıcak kırık beyaz yüzeyler ve koyu metinlerle sakin, okunaklı bir görsel hiyerarşi kurulur.
- Büyük proje fotoğrafları ve geniş görsel alanları içerik anlatımının merkezindedir.
- Tipografi, başlık ile açıklama metnini net biçimde ayırır; Bootstrap ızgarası farklı ekran genişliklerinde sayfa düzenini taşır.
- Hakkımızda, projeler, hizmetler, blog ve iletişim sayfaları ortak görsel dili sürdürür.
- Mevcut tema bileşenleri korunur; tasarım ve performans güncellemelerinin kanıtı `design-qa.md` dosyasında tutulur.

## Teknik yapı

- HTML sayfaları ve Bootstrap tabanlı responsive yerleşim
- Yerel CSS ve JavaScript dosyaları
- Swiper, Magnific Popup ve tema içindeki mevcut etkileşim kitaplıkları
- Proje görselleri ve marka varlıkları `assets/` altında
- Apache için kök dizindeki `.htaccess`; yayınlanan sunucuda gerekli modüllerin etkin olması ayrıca doğrulanmalıdır

Başlıca giriş sayfaları `index.html`, `about.html`, `project-grid.html`, `project-details.html`, `services-grid.html`, `blog-standard.html` ve `contact.html` dosyalarıdır.

## Yerel önizleme

Python 3 ile depo kökünde statik sunucu başlatın:

```bash
python3 -m http.server 8000
```

Ardından [http://localhost:8000](http://localhost:8000) adresini açın. Sunucu tarafında iletişim, analytics veya üretim hosting yapılandırması bu önizlemeye dahil değildir.

## Geliştirme notları

- Sayfalar arası düzeni değiştirirken header, footer, mobil menü ve ortak tema stillerini birlikte kontrol edin.
- Görsel yollarını ve dosya adlarını değiştirmeden önce bunların HTML, CSS ve JavaScript içindeki kullanımlarını arayın.
- Görsel optimizasyonu mevcut görünümü koruyacak şekilde yapılır; kaynak tasarım varlıkları `assets/archive/unused-assets` altında saklanabilir.
- `design-qa.md`, tamamlanan görsel ve performans çalışmalarının kapsamını ve doğrulama sınırlarını kaydeder.

## Sınırlar

Bu depo, sayfaların yerel statik sunucuda açılabildiğini gösterir. Canlı alan adı, Apache modülleri, iletişim e-postasının teslimi, analitik sağlayıcısı ve üretim performansı ayrı ortamda doğrulanmalıdır.
