# STAR FIT

Fitnes va sog'lomlashtirish markazi sayti + saytdan kelgan arizalarni Telegramga yuboruvchi bot.

## Tuzilma
- `index.html`, `style.css`, `script.js`, `images/` — sayt (glassmorphism dizayn)
- `backend/server.js` — `POST /api/konsultatsiya` arizani qabul qiladi
- `backend/bot.js` — Telegram bot: arizani yuboradi, Tasdiqlash/Bekor tugmalari, `/arizalar`, `/statistika`

## Ishga tushirish
```bash
cd backend
npm install
cp .env.example .env   # BOT_TOKEN va CHAT_ID ni yozing
npm start
```
Keyin `index.html` ni oching (masalan, Live Server orqali).

Bot faqat `CHAT_ID` dagi chatga ariza yuboradi va faqat o'sha chatdagi buyruqlarga javob beradi.
