# STAR FIT

Fitnes va sog'lomlashtirish markazi sayti + saytdan kelgan arizalarni Telegramga yuboruvchi bot.

## Tuzilma
- `public/` — sayt (index.html, style.css, script.js, images/)
- `functions/` — Cloudflare Pages Functions
  - `api/konsultatsiya.js` — `POST /api/konsultatsiya`, formadagi arizani qabul qiladi
  - `telegram/[secret].js` — Telegram webhook
- `lib/arizabot.mjs` — bot mantiqi (Tasdiqlash/Bekor tugmalari, `/arizalar`, `/statistika`)
- `lib/kvStorage.mjs` — arizalarni Cloudflare KV'da saqlash
- `backend/server.js` — faqat kompyuterda sinash uchun (Express + polling)

## Cloudflare Pages sozlamalari
- Build command: bo'sh
- Build output directory: `public`
- Environment variables (Secret): `BOT_TOKEN`, `CHAT_ID`
- KV namespace binding: `ARIZALAR_KV`

Deploydan keyin Telegram webhook bir marta o'rnatiladi (`createBot(...).webhookOrnatish("https://<loyiha>.pages.dev")`).

## Kompyuterda sinash
```bash
cd backend
npm install
cp .env.example .env   # BOT_TOKEN va CHAT_ID ni yozing
npm start              # http://localhost:3000
```
Webhook o'rnatilgan bo'lsa, lokal server pollingni yoqmaydi (Cloudflare'dagi botga xalaqit bermaydi).
