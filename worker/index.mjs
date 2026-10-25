// Cloudflare Worker: sayt (public/ — static assets) + ariza API + Telegram webhook
import { createBot, arizaniTekshirish, webhookSecret } from "../lib/arizabot.mjs";
import { kvStorage } from "../lib/kvStorage.mjs";

function botYarat(env) {
  return createBot({ token: env.BOT_TOKEN, chatId: env.CHAT_ID, storage: kvStorage(env) });
}

// POST /api/konsultatsiya — saytdagi formadan kelgan ariza
async function konsultatsiya(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return Response.json({ success: false, message: "Noto'g'ri so'rov" }, { status: 400 });
  }

  const { ariza, xato } = arizaniTekshirish(body);
  if (xato) {
    return Response.json({ success: false, message: xato }, { status: 400 });
  }

  try {
    await botYarat(env).arizaYuborish(ariza);
    return Response.json({ success: true, message: "Ariza Telegramga yuborildi" });
  } catch (e) {
    console.error(e.message);
    return Response.json({ success: false, message: "Telegramga yuborishda xato" }, { status: 500 });
  }
}

// POST /telegram/<maxfiy yo'l> — Telegram webhook
async function telegram(request, env, ctx, yol) {
  const secret = await webhookSecret(env.BOT_TOKEN);
  if (yol !== secret.slice(0, 32) || request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  const update = await request.json();
  // Telegramga darhol javob qaytaramiz, qayta ishlash fonda davom etadi
  ctx.waitUntil(botYarat(env).yangilanish(update));
  return new Response("OK");
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/konsultatsiya") {
      return konsultatsiya(request, env);
    }
    if (request.method === "POST" && url.pathname.startsWith("/telegram/")) {
      return telegram(request, env, ctx, url.pathname.slice("/telegram/".length));
    }

    return env.ASSETS.fetch(request);
  }
};
