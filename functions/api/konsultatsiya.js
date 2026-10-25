import { createBot, arizaniTekshirish } from "../../lib/arizabot.mjs";
import { kvStorage } from "../../lib/kvStorage.mjs";

// POST /api/konsultatsiya — saytdagi formadan kelgan ariza
export async function onRequestPost({ request, env }) {
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
    const bot = createBot({ token: env.BOT_TOKEN, chatId: env.CHAT_ID, storage: kvStorage(env) });
    await bot.arizaYuborish(ariza);
    return Response.json({ success: true, message: "Ariza Telegramga yuborildi" });
  } catch (e) {
    console.error(e.message);
    return Response.json({ success: false, message: "Telegramga yuborishda xato" }, { status: 500 });
  }
}
