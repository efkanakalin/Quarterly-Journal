-- ============================================================
-- Blog Post #2: Quarterly Journal Özelleştirme Rehberi
--
-- Çalıştırma: Supabase Dashboard → SQL Editor → paste & run.
-- Author lookup: profiles tablosundan username='turtletrader'.
-- ============================================================

INSERT INTO blog_posts (
  author_id,
  title,
  slug,
  excerpt,
  cover_image_url,
  body,
  read_minutes,
  published,
  published_at
) VALUES (
  (SELECT id FROM profiles WHERE username = 'turtletrader' LIMIT 1),
  'Quarterly Journal Özelleştirme Rehberi: Arayüz ve Trade Parametreleri',
  'qt-journal-ozellestirme-rehberi',
  'Quarterly Journal''ı kendi stratejinize göre özelleştirin: tema, dil, parite, giriş modelleri ve zaman dilimleri filtreleri.',
  '/blog/qt-customization-cover.png',
  $body$
Quarterly Journal, işlem kayıt sürecini hızlandırmak ve ekrandaki bilgi kirliliğini önlemek amacıyla tamamen kişiselleştirilebilir bir altyapı sunar. Platformu kendi stratejinize göre özelleştirmek için aşağıdaki adımları izleyebilirsiniz.

## 1. Tema ve Dil Ayarları

Platformun sol alt köşesinde yer alan **My Profile** sekmesi üzerinden temel arayüz tercihlerini düzenleyebilirsiniz.

- **Dil Seçeneği:** Kullanıcı arayüzünü Türkçe (TR) veya İngilizce (EN) olarak ayarlayabilirsiniz.
- **Tema Seçeneği:** Göz yorgunluğunu azaltmak veya kişisel tercihinize uyum sağlamak için **Dark Mode** (Koyu Tema) ile aydınlık tema arasında hızlıca geçiş yapabilirsiniz.

![Tema ve dil ayarları](/blog/qt-customization-theme.png)

## 2. Parite (Pairs) Seçimi

Menüden **Customization** paneline girdiğinizde karşınıza çıkan **Pairs** sekmesi, sadece işlem yaptığınız enstrümanları filtrelemenizi sağlar.

- Endeksler, kripto, emtia veya forex majörleri arasından sadece aktif olarak trade ettiğiniz pariteleri seçin.
- İşlem ekleme (**Add Trade**) ekranında yalnızca burada seçtiğiniz pariteler listelenir. Böylece uzun listeler arasında vakit kaybetmezsiniz.

## 3. Giriş Modelleri (Entries)

**Entries** sekmesi, stratejinize dahil olmayan konseptleri sistemden tamamen gizlemenizi sağlar.

- Örneğin Quarterly Theory veya SMC/ICT konseptleri altındaki spesifik giriş modellerini (SSMT, MMXM, PO3, CVD vb.) işaretleyebilirsiniz.
- Panelin üstünde de belirtildiği gibi sadece seçtiğiniz öğeler işlem eklerken karşınıza çıkar. Kullanmadığınız formasyonlar veya indikatörler kalabalık yaratmaz.

![Giriş modelleri](/blog/qt-customization-entries.png)

## 4. Zaman Dilimleri (Timeframes)

Grafik okuma alışkanlıklarınızı sisteme entegre etmek için **Timeframes** sekmesini kullanın.

- Sadece analiz yaptığınız ve işlem aldığınız periyotları (örn. 90M, 6H, 1D) işaretleyin.
- Kullanmadığınız alt veya üst zaman dilimlerini (örn. 30S, 2M, 1Mo) kapalı tutarak veri girişi ve raporlama ekranlarınızı tamamen sadeleştirebilirsiniz.

![Zaman dilimleri](/blog/qt-customization-timeframes.png)
$body$,
  3,
  true,
  now()
);
