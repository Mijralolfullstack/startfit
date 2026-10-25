// Lokal ishlab chiqish serveri: sayt + /api/konsultatsiya + bot (polling).
// Doimiy hosting Cloudflare Pages'da (functions/ papkasi) — bu fayl faqat kompyuterda sinash uchun.
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("BOT_TOKEN yoki CHAT_ID topilmadi!");
  process.exit(1);
}

// Arizalar kompyuterda oddiy JSON faylda saqlanadi
const DB_FILE = path.join(__dirname, "arizalar.json");
const faylStorage = {
  async oqish() {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    } catch (e) {
      return [];
    }
  },
  async yozish(arizalar) {
    fs.writeFileSync(DB_FILE, JSON.stringify(arizalar, null, 2));
  }
};

async function main() {
  const { createBot, arizaniTekshirish } = await import("../lib/arizabot.mjs");
  const bot = createBot({ token: BOT_TOKEN, chatId: CHAT_ID, storage: faylStorage });

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Saytdan kelgan arizani Telegramga yuborish
  app.post("/api/konsultatsiya", async (req, res) => {
    const { ariza, xato } = arizaniTekshirish(req.body);
    if (xato) {
      return res.status(400).json({ success: false, message: xato });
    }

    try {
      const yuborilgan = await bot.arizaYuborish(ariza);
      console.log(`Ariza #${yuborilgan.id} Telegramga yuborildi`);
      res.json({ success: true, message: "Ariza Telegramga yuborildi" });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, message: "Telegramga yuborishda xato" });
    }
  });

  // Sayt fayllari (faqat public/ papkasi)
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} manzilida ishlayapti`);
    bot.polling().catch((e) => {
      console.error("Botni ishga tushirib bo'lmadi:", e.message);
    });
  });
}

main();
