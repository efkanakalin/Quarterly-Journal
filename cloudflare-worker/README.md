# QT Journal — Tradovate Proxy Worker

Quarterly Journal'ın Tradovate hesaplarını senkronize edebilmesi için ince
bir Cloudflare Worker. Tradovate API'si tarayıcıdan CORS izni vermediği
için, tüm istekler bu Worker üzerinden geçer. Frontend her isteğe Supabase
JWT'sini `Authorization: Bearer …` header'ı olarak ekler; Worker token'ı
HS256 ile doğrular ve sadece geçerli kullanıcılar için Tradovate'e proxy
yapar.

## Endpoints

Tüm endpoint'ler `POST` ve auth zorunlu. OAuth `exchange-code` artık yok —
kullanıcı access token'ı Tradovate'ten manuel alıp UI'ya yapıştırıyor.

| Path                          | Body                                                   | Returns                              |
|-------------------------------|--------------------------------------------------------|--------------------------------------|
| `/tradovate/refresh-token`    | `{ refresh_token }`                                    | TradovateTokenResponse               |
| `/tradovate/accounts`         | `{ tradovate_access_token }`                           | TradovateAccount[]                   |
| `/tradovate/fills`            | `{ tradovate_access_token, account_id, from, to }`     | `{ fills, contracts }`               |
| `/health`                     | _empty_                                                | `{ ok: true, user: <supabaseUserId>}`|

## Environment

`wrangler.toml` içinde `[vars]` olarak duran public değişkenler:

```
TRADOVATE_API_BASE       = "https://live.tradovateapi.com/v1"
TRADOVATE_DEMO_API_BASE  = "https://demo.tradovateapi.com/v1"
ALLOWED_ORIGIN           = "https://quarterlyjournal.org"
```

Secret olarak set edilmesi gereken TEK değer:

```bash
wrangler secret put SUPABASE_JWT_SECRET   # Supabase: Settings → API → JWT Secret
```

OAuth `client_id/secret` artık gereksiz — manuel-token akışı kullanılıyor.
Worker Supabase'e doğrudan bağlanmaz, sadece JWT'yi imza üzerinden doğrular.

## Local development

```bash
cd cloudflare-worker
npm install
wrangler login                 # bir kerelik
npm run dev                    # localhost:8787
```

Local çalıştırırken secret'ı `.dev.vars` dosyasından okur:

```
SUPABASE_JWT_SECRET=...
```

`.dev.vars` git tarafından izlenmez (root `.gitignore`'daki `*.local`/`.env`
benzer kuralla kapsanır; kapsanmıyorsa elle ignore edin).

## Deploy

```bash
npm run deploy
```

Deploy sonrası worker URL'sini frontend `.env`'sine yazın:

```
VITE_TRADOVATE_WORKER_URL=https://qt-journal-tradovate-proxy.<account>.workers.dev
```

Custom domain bağlamak isterseniz `wrangler.toml`'a route ekleyebilir,
ardından `ALLOWED_ORIGIN`'i frontend domain'iniz ile güncelleyebilirsiniz.

## Type check

```bash
npm run typecheck
```

`tsc --noEmit` ile sıkı strict mod tipleme — `noUnusedLocals`,
`noUnusedParameters`, `noImplicitOverride` aktif.
