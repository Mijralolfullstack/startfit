import { createBot, webhookSecret } from "../../lib/arizabot.mjs";
import { kvStorage } from "../../lib/kvStorage.mjs";

// POST /telegram/<maxfiy yo'l> — Telegram webhook
export async function onRequestPost({ request, env, params, waitUntil }) {
  const secret = await webhookSecret(env.BOT_TOKEN);
  if (
    params.secret !== secret.slice(0, 32) ||
    request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== secret
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  const update = await request.json();
  const bot = createBot({ token: env.BOT_TOKEN, chatId: env.CHAT_ID, storage: kvStorage(env) });
  // Telegramga darhol javob qaytaramiz, qayta ishlash fonda davom etadi
  waitUntil(bot.yangilanish(update));
  return new Response("OK");
}
