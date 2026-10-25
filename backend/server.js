require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("BOT_TOKEN yoki CHAT_ID topilmadi!");
  process.exit(1);
}

const { arizaYuborish, botniIshgaTushirish } = require("./bot");

// Saytdan kelgan arizani Telegramga yuborish
app.post("/api/konsultatsiya", async (req, res) => {
  try {
    const { ism, tel, maqsad } = req.body || {};

    if (!ism || !tel || !maqsad) {
      return res.status(400).json({
        success: false,
        message: "Ma'lumotlar to'liq emas"
      });
    }

    if (String(ism).length > 100 || String(tel).length > 30 || String(maqsad).length > 100) {
      return res.status(400).json({
        success: false,
        message: "Ma'lumotlar juda uzun"
      });
    }

    const ariza = await arizaYuborish({
      ism: String(ism).trim(),
      tel: String(tel).trim(),
      maqsad: String(maqsad).trim()
    });
    console.log(`Ariza #${ariza.id} Telegramga yuborildi`);

    res.json({
      success: true,
      message: "Ariza Telegramga yuborildi"
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "Telegramga yuborishda xato"
    });
  }
});

app.get("/", (req, res) => {
  res.send("STARFIT server ishlayapti!");
});

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} manzilida ishlayapti`);
  botniIshgaTushirish().catch((e) => {
    console.error("Botni ishga tushirib bo'lmadi:", e.message);
  });
});
