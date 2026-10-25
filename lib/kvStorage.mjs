// Arizalar Cloudflare KV'da bitta "arizalar" kalitida JSON massiv sifatida saqlanadi
export function kvStorage(env) {
  return {
    async oqish() {
      return (await env.ARIZALAR_KV.get("arizalar", "json")) || [];
    },
    async yozish(arizalar) {
      await env.ARIZALAR_KV.put("arizalar", JSON.stringify(arizalar));
    }
  };
}
