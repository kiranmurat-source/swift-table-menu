// Edge Function: import-menu
// Restoran menü fotoğraflarını Gemini 2.5 Flash vision API'sine gönderir,
// structured JSON olarak kategori + ürün listesi döner. DB'ye YAZMAZ —
// frontend kullanıcı onayladıktan sonra ayrı bir çağrı ile DB'ye yazar.
// Provider call logic _shared/gemini_vision.ts'de — process-ai-queue worker ile paylaşılıyor.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGeminiVision } from "../_shared/gemini_vision.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};
const JSON_HEADERS = { "Content-Type": "application/json", ...CORS_HEADERS };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "images array gerekli (base64 veya data URL)" }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    if (images.length > 10) {
      return new Response(
        JSON.stringify({ error: "Maksimum 10 görsel desteklenir" }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const result = await callGeminiVision(images);

    return new Response(
      JSON.stringify({
        ok: true,
        categories: result.categories,
        stats: result.stats,
      }),
      { headers: JSON_HEADERS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
});
