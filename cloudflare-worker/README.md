# QT Journal — Tradovate Proxy Worker

Quarterly Journal'ın Tradovate hesaplarını senkronize edebilmesi için ince
bir Cloudflare Worker. Tradovate API'si tarayıcıdan CORS izni vermediği
için, tüm istekler bu Worker üzerinden geçer. Frontend her isteğe Supabase
JWT'sini `Authorization: Bearer …` header'ı olarak ekler; Worker token'ı
HS256 ile doğrular ve sadece geçerli kullanıcılar için Tradovate'e proxy
yapar.

## Endpoints

Tüm endpoint'ler `POST` ve auth zorunlu.

| Path                          | Body                                                   | Returns                              |
|-------------------------------|--------------------------------------------------------|--------------------------------------|
| `/tradovate/exchange-code`    | `{ code, redirect_uri }`                               | TradovateTokenResponse               |
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

Secret olarak set edilmesi gerekenler:

```bash
wrangler secret put TRADOVATE_CLIENT_ID
wrangler secret put TRADOVATE_CLIENT_SECRET
wrangler secret put SUPABASE_JWT_SECRET   # Supabase: Settings → API → JWT Secret
```

`SUPABASE_URL` envoke şu an kullanılmıyor — Worker Supabase'e doğrudan
bağlanmaz, sadece JWT'yi imza üzerinden doğrular.

## Local development

```bash
cd cloudflare-worker
npm install
wrangler login                 # bir kerelik
npm run dev                    # localhost:8787
```

Local çalıştırırken secret'ları `.dev.vars` dosyasından okur:

```
TRADOVATE_CLIENT_ID=...
TRADOVATE_CLIENT_SECRET=...
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
