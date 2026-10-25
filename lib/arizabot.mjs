// STAR FIT arizalar boti — umumiy mantiq.
// Cloudflare Pages Functions (KV bilan) va lokal Express server (JSON fayl bilan) ikkalasi ham shuni ishlatadi.
// storage: { oqish(): Promise<Ariza[]>, yozish(arizalar): Promise<void> }

const HOLAT = {
  yangi: "🕐 Yangi",
  tasdiqlandi: "✅ Tasdiqlandi",
  bekor: "❌ Bekor qilindi"
};

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

function kun(iso) {
  return new Date(iso).toLocaleDateString("uz-UZ", { timeZone: "Asia/Tashkent" });
}

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

// Webhook manzili va Telegram yuboradigan maxfiy kalit tokendan hosil qilinadi
export async function webhookSecret(token) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function arizaniTekshirish(body) {
  const { ism, tel, maqsad } = body || {};
  if (!ism || !tel || !maqsad) return { xato: "Ma'lumotlar to'liq emas" };
  if (String(ism).length > 100 || String(tel).length > 30 || String(maqsad).length > 100) {
    return { xato: "Ma'lumotlar juda uzun" };
  }
  return {
    ariza: {
      ism: String(ism).trim(),
      tel: String(tel).trim(),
      maqsad: String(maqsad).trim()
    }
  };
}

export function createBot({ token, chatId, storage }) {
  const CHAT_ID = String(chatId);
  const API = `https://api.telegram.org/bot${token}`;

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

  // === Saytdan kelgan arizani saqlash va adminga yuborish ===
  async function arizaYuborish({ ism, tel, maqsad }) {
    const arizalar = await storage.oqish();
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
    await storage.yozish(arizalar);
    return ariza;
  }

  // === Tugma bosilganda ===
  async function tugmaBosildi(cb) {
    const [amal, idStr] = (cb.data || "").split(":");
    const arizalar = await storage.oqish();
    const ariza = arizalar.find((a) => a.id === Number(idStr));

    if (!cb.message || String(cb.message.chat.id) !== CHAT_ID || !ariza || amal === "yangi" || !HOLAT[amal]) {
      return tg("answerCallbackQuery", {
        callback_query_id: cb.id,
        text: "Ariza topilmadi"
      });
    }

    ariza.holat = amal;
    await storage.yozish(arizalar);

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
  async function statistikaMatni() {
    const arizalar = await storage.oqish();
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

  async function oxirgiArizalarMatni() {
    const oxirgilar = (await storage.oqish()).slice(-10).reverse();
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
    const chat = String(msg.chat.id);
    const matn = (msg.text || "").trim();

    // Bot faqat admin chatiga xizmat qiladi
    if (chat !== CHAT_ID) {
      return tg("sendMessage", {
        chat_id: chat,
        text: "Bu bot faqat STAR FIT saytidan kelgan arizalarni yuboradi.\n" +
          `Sizning chat ID: ${chat}`
      });
    }

    let javob;
    if (matn.startsWith("/statistika")) {
      javob = await statistikaMatni();
    } else if (matn.startsWith("/arizalar")) {
      javob = await oxirgiArizalarMatni();
    } else {
      javob =
        `👋 Assalomu alaykum! Men STAR FIT arizalar botiman.\n\n` +
        `Saytdan yangi ariza kelishi bilan shu yerga yuboraman.\n\n` +
        `/arizalar — oxirgi 10 ta ariza\n` +
        `/statistika — arizalar soni`;
    }

    return tg("sendMessage", { chat_id: CHAT_ID, text: javob, parse_mode: "HTML" });
  }

  async function yangilanish(u) {
    try {
      if (u.callback_query) await tugmaBosildi(u.callback_query);
      else if (u.message) await xabarKeldi(u.message);
    } catch (e) {
      console.error("Yangilanishni qayta ishlashda xato:", e.message);
    }
  }

  async function buyruqlarniOrnatish() {
    await tg("setMyCommands", {
      commands: [
        { command: "arizalar", description: "Oxirgi 10 ta ariza" },
        { command: "statistika", description: "Arizalar soni" }
      ]
    });
    const men = await tg("getMe", {});
    return men.username;
  }

  // === Long polling: kompyuterda (localhost) ishlatish uchun ===
  async function polling() {
    const info = await tg("getWebhookInfo", {});
    if (info.url) {
      console.warn(
        "Botda webhook o'rnatilgan (Cloudflare'dagi sayt ishlayapti).\n" +
        "Polling yoqilmadi — arizalar baribir Telegramga yuboriladi."
      );
      return;
    }

    const username = await buyruqlarniOrnatish();
    console.log(`Bot polling rejimida ishga tushdi: @${username}`);

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
          await yangilanish(u);
        }
      } catch (e) {
        console.error("Polling xatosi:", e.message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  // === Webhook'ni o'rnatish (deploydan keyin bir marta) ===
  async function webhookOrnatish(baseUrl) {
    const secret = await webhookSecret(token);
    const username = await buyruqlarniOrnatish();
    await tg("setWebhook", {
      url: `${baseUrl.replace(/\/+$/, "")}/telegram/${secret.slice(0, 32)}`,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"]
    });
    return username;
  }

  return { arizaYuborish, yangilanish, polling, webhookOrnatish };
}
