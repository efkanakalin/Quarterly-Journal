# QT Journal

**Quarterly Theory (QT) çerçevesinde işlem yapan trader'lar için trade journal uygulaması.**

Klasik journal'lardan farkı:
- Trade'i fiyat olayı değil, **zaman koordinatı** olarak modeller (session, session quarter, 90m micro quarter)
- Konfirmasyon zinciri (TF + Tip) yapısal veri olarak saklanır — SQL ile sorgulanabilir
- QT-native: Asia/London/NY AM/NY PM session'ları, 15 konfirmasyon tipi, 5 hata tipi

## Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Charts | Recharts |
| CSV | PapaParse |
| Date/Time | date-fns + date-fns-tz |

## Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Supabase projesi oluştur

1. [supabase.com](https://supabase.com) → New Project
2. Project URL ve anon key'i kopyala

### 3. Environment variables

```bash
cp .env.example .env
# .env dosyasını düzenle
```

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Veritabanı migration

Supabase Dashboard → SQL Editor → `supabase/migrations/001_initial_schema.sql` içeriğini yapıştır ve çalıştır.

### 5. Google OAuth kurulumu

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID
2. Application type: **Web application**
3. Authorized redirect URIs: `https://your-project-id.supabase.co/auth/v1/callback`
4. Supabase Dashboard → Authentication → Providers → Google → Client ID & Secret gir

### 6. Geliştirme sunucusu

```bash
npm run dev
# http://localhost:5173
```

## CSV Import

Tradovate → Hesap Ayarları (dişli ikon) → Reports → **Performance** sekmesi → Tarih aralığı seç → Download CSV

> CSV'deki tüm zaman damgaları Türkiye saatinde (Europe/Istanbul) gelir. Uygulama bunları otomatik olarak **New York saatine (America/New_York)** çevirir — DST (yaz/kış saati geçişi) dahil. Sabit offset kullanılmaz.

## Deploy (Cloudflare Pages)

1. GitHub'a push et
2. Cloudflare Pages → Connect to Git → qt-journal repo
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Environment variables: `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` ekle

## Lisans

MIT — Ücretsiz, açık kaynak
