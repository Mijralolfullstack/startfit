# STAR FIT

Fitnes va sog'lomlashtirish markazi sayti + saytdan kelgan arizalarni Telegramga yuboruvchi bot.

## Tuzilma
- `public/` — sayt (index.html, style.css, script.js, images/)
- `worker/index.mjs` — Cloudflare Worker: sayt, `POST /api/konsultatsiya` (forma arizasi) va Telegram webhook
- `wrangler.jsonc` — Worker sozlamalari (assets: `public/`, KV: `ARIZALAR_KV`)
- `lib/arizabot.mjs` — bot mantiqi (Tasdiqlash/Bekor tugmalari, `/arizalar`, `/statistika`)
- `lib/kvStorage.mjs` — arizalarni Cloudflare KV'da saqlash
- `backend/server.js` — faqat kompyuterda sinash uchun (Express + polling)

## Cloudflare Workers
- Sayt: https://startfit.yetqazibber.workers.dev
- GitHub'ga har push'da Cloudflare o'zi qayta deploy qiladi.
- Secrets (Settings → Variables and Secrets): `BOT_TOKEN`, `CHAT_ID`

Deploydan keyin Telegram webhook bir marta o'rnatiladi (`createBot(...).webhookOrnatish("https://startfit.yetqazibber.workers.dev")`).

## Kompyuterda sinash
```bash
cd backend
npm install
cp .env.example .env   # BOT_TOKEN va CHAT_ID ni yozing
npm start              # http://localhost:3000
```
Webhook o'rnatilgan bo'lsa, lokal server pollingni yoqmaydi (Cloudflare'dagi botga xalaqit bermaydi).
