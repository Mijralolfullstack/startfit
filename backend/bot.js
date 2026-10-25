const fs = require("fs");
const path = require("path");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = String(process.env.CHAT_ID);
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const DB_FILE = path.join(__dirname, "arizalar.json");

// === Arizalarni saqlash (oddiy JSON fayl) ===
function arizalarniOqish() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}

function arizalarniYozish(arizalar) {
  fs.writeFileSync(DB_FILE, JSON.stringify(arizalar, null, 2));
}

// Foydalanuvchi kiritgan matnni Telegram HTML uchun xavfsiz qilish
function esc(matn) {
  return String(matn)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function vaqt(iso) {
  return new Date(iso).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });
}

async function tg(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram ${method}: ${data.description}`);
  }
  return data.result;
}

const HOLAT = {
  yangi: "🕐 Yangi",
  tasdiqlandi: "✅ Tasdiqlandi",
  bekor: "❌ Bekor qilindi"
};

function arizaMatni(a) {
  return (
    `🆕 <b>YANGI KONSULTATSIYA #${a.id}</b>\n\n` +
    `👤 Ism: <b>${esc(a.ism)}</b>\n` +
    `📞 Telefon: <code>${esc(a.tel)}</code>\n` +
    `🎯 Maqsad: ${esc(a.maqsad)}\n` +
    `🕒 Vaqt: ${vaqt(a.vaqt)}\n\n` +
    `Holat: <b>${HOLAT[a.holat]}</b>`
  );
}

function tugmalar(a) {
  if (a.holat !== "yangi") return { inline_keyboard: [] };
  return {
    inline_keyboard: [[
      { text: "✅ Tasdiqlash", callback_data: `tasdiqlandi:${a.id}` },
      { text: "❌ Bekor qilish", callback_data: `bekor:${a.id}` }
    ]]
  };
}

// === Saytdan kelgan arizani saqlash va adminga yuborish ===
async function arizaYuborish({ ism, tel, maqsad }) {
  const arizalar = arizalarniOqish();
  const ariza = {
    id: arizalar.length ? arizalar[arizalar.length - 1].id + 1 : 1,
    ism,
    tel,
    maqsad,
    vaqt: new Date().toISOString(),
    holat: "yangi"
  };

  const xabar = await tg("sendMessage", {
    chat_id: CHAT_ID,
    text: arizaMatni(ariza),
    parse_mode: "HTML",
    reply_markup: tugmalar(ariza)
  });

  ariza.messageId = xabar.message_id;
  arizalar.push(ariza);
  arizalarniYozish(arizalar);
  return ariza;
}

// === Tugma bosilganda ===
async function tugmaBosildi(cb) {
  const [amal, idStr] = (cb.data || "").split(":");
  const arizalar = arizalarniOqish();
  const ariza = arizalar.find((a) => a.id === Number(idStr));

  if (!cb.message || String(cb.message.chat.id) !== CHAT_ID || !ariza || amal === "yangi" || !HOLAT[amal]) {
    return tg("answerCallbackQuery", {
      callback_query_id: cb.id,
      text: "Ariza topilmadi"
    });
  }

  ariza.holat = amal;
  arizalarniYozish(arizalar);

  await tg("editMessageText", {
    chat_id: CHAT_ID,
    message_id: cb.message.message_id,
    text: arizaMatni(ariza),
    parse_mode: "HTML",
    reply_markup: tugmalar(ariza)
  });
  await tg("answerCallbackQuery", {
    callback_query_id: cb.id,
    text: HOLAT[amal]
  });
}

// === Buyruqlar ===
function kun(iso) {
  return new Date(iso).toLocaleDateString("uz-UZ", { timeZone: "Asia/Tashkent" });
}

function statistikaMatni() {
  const arizalar = arizalarniOqish();
  const bugun = kun(new Date().toISOString());
  const bugungi = arizalar.filter((a) => kun(a.vaqt) === bugun);
  const soni = (holat) => arizalar.filter((a) => a.holat === holat).length;

  return (
    `📊 <b>Arizalar statistikasi</b>\n\n` +
    `Bugun: <b>${bugungi.length}</b>\n` +
    `Jami: <b>${arizalar.length}</b>\n\n` +
    `🕐 Yangi: ${soni("yangi")}\n` +
    `✅ Tasdiqlangan: ${soni("tasdiqlandi")}\n` +
    `❌ Bekor qilingan: ${soni("bekor")}`
  );
}

function oxirgiArizalarMatni() {
  const oxirgilar = arizalarniOqish().slice(-10).reverse();
  if (!oxirgilar.length) return "Hozircha arizalar yo'q.";

  return (
    `📋 <b>Oxirgi ${oxirgilar.length} ta ariza</b>\n\n` +
    oxirgilar
      .map(
        (a) =>
          `#${a.id} ${HOLAT[a.holat].split(" ")[0]} <b>${esc(a.ism)}</b> — <code>${esc(a.tel)}</code>\n` +
          `${esc(a.maqsad)} · ${vaqt(a.vaqt)}`
      )
      .join("\n\n")
  );
}

async function xabarKeldi(msg) {
  const chatId = String(msg.chat.id);
  const matn = (msg.text || "").trim();

  // Bot faqat admin chatiga xizmat qiladi
  if (chatId !== CHAT_ID) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "Bu bot faqat STAR FIT saytidan kelgan arizalarni yuboradi.\n" +
        `Sizning chat ID: ${chatId}`
    });
  }

  let javob;
  if (matn.startsWith("/statistika")) {
    javob = statistikaMatni();
  } else if (matn.startsWith("/arizalar")) {
    javob = oxirgiArizalarMatni();
  } else {
    javob =
      `👋 Assalomu alaykum! Men STAR FIT arizalar botiman.\n\n` +
      `Saytdan yangi ariza kelishi bilan shu yerga yuboraman.\n\n` +
      `/arizalar — oxirgi 10 ta ariza\n` +
      `/statistika — arizalar soni`;
  }

  return tg("sendMessage", { chat_id: CHAT_ID, text: javob, parse_mode: "HTML" });
}

// === Long polling: Telegramdan yangilanishlarni olib turish ===
async function botniIshgaTushirish() {
  await tg("deleteWebhook", {});
  await tg("setMyCommands", {
    commands: [
      { command: "arizalar", description: "Oxirgi 10 ta ariza" },
      { command: "statistika", description: "Arizalar soni" }
    ]
  });
  const men = await tg("getMe", {});
  console.log(`Bot ishga tushdi: @${men.username}`);

  let offset = 0;
  while (true) {
    try {
      const yangilanishlar = await tg("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message", "callback_query"]
      });

      for (const u of yangilanishlar) {
        offset = u.update_id + 1;
        try {
          if (u.callback_query) await tugmaBosildi(u.callback_query);
          else if (u.message) await xabarKeldi(u.message);
        } catch (e) {
          console.error("Yangilanishni qayta ishlashda xato:", e.message);
        }
      }
    } catch (e) {
      console.error("Polling xatosi:", e.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

module.exports = { arizaYuborish, botniIshgaTushirish };
