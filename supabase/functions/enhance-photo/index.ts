// Edge Function: enhance-photo
// Yemek fotoğrafını Gemini 2.5 Flash Image (image editing) ile iyileştirir:
// aydınlatma, beyaz dengesi, renk canlılığı, detay keskinliği. Yemek içeriği
// asla değiştirilmez (yeni yemek üretme / ekleme / kaldırma yasak).
//
// Request:  { image: base64 or data URL, restaurant_id: string }
// Response: { ok, enhanced_base64, mime_type, credits_remaining }
// Not: Bu fonksiyon kredi düşmez ve media_library'ye yazmaz — frontend kaydet
// dedikten sonra yaparız (kullanıcı önizlemede iptal edebilir). Ancak kredi
// kontrolü burada yapılır (kullanıcı krediler bitmişken API'yi çağıramasın).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

type AngleOpt = "original" | "45" | "90";
type LightingOpt = "original" | "studio" | "natural";
type SurfaceOpt = "original" | "wood" | "light_marble" | "dark_marble" | "white" | "black";

interface EnhanceOptions {
  angle?: AngleOpt;
  lighting?: LightingOpt;
  surface?: SurfaceOpt;
}

interface EnhanceRequest {
  image: string;
  restaurant_id: string;
  options?: EnhanceOptions;
}

function buildPrompt(opts: EnhanceOptions = {}): string {
  const angle = opts.angle ?? "original";
  const lighting = opts.lighting ?? "original";
  const surface = opts.surface ?? "original";

  const lines: string[] = [
    "Enhance this food photograph for a restaurant menu.",
    "",
    "Baseline enhancements (always apply):",
    "- Correct white balance and exposure so the dish looks appetizing",
    "- Increase color vibrancy slightly without oversaturating",
    "- Sharpen food textures for appetizing detail",
  ];

  if (angle === "45") {
    lines.push("- Change the camera angle to a 45-degree three-quarter view of the dish, keeping the same dish and plating");
  } else if (angle === "90") {
    lines.push("- Change the camera angle to a 90-degree top-down (flat lay / bird's-eye) view of the dish");
  }

  if (lighting === "studio") {
    lines.push("- Apply professional studio lighting: soft, even, diffused, with no harsh shadows");
  } else if (lighting === "natural") {
    lines.push("- Apply warm natural lighting as if shot near a window: soft daylight, gentle warm tones, subtle natural shadows");
  }

  if (surface !== "original") {
    const surfaceMap: Record<Exclude<SurfaceOpt, "original">, string> = {
      wood: "a warm natural wood table surface",
      light_marble: "a light/white marble countertop with subtle veining",
      dark_marble: "a dark marble countertop with subtle veining",
      white: "a clean plain white surface",
      black: "a clean plain matte black surface",
    };
    lines.push(`- Replace the background and surface under the dish with ${surfaceMap[surface]}. Keep the dish itself unchanged.`);
  } else {
    lines.push("- Clean up distracting elements in the existing background gently, keep the same surface");
  }

  lines.push(
    "",
    "Critical constraints (never violate):",
    "- Keep the original dish exactly the same - do not change, add, or remove any food items",
    "- Do not alter plating, garnish, or portions",
    "- This must remain an authentic real restaurant dish photo",
    "Return ONLY the enhanced image, no text.",
  );

  return lines.join("\n");
}

function splitDataUrl(input: string): { mime: string; data: string } {
  if (input.startsWith("data:")) {
    const mime = input.slice(5, input.indexOf(";"));
    const data = input.split(",")[1];
    return { mime, data };
  }
  return { mime: "image/jpeg", data: input };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const body = (await req.json()) as EnhanceRequest;
    const { image, restaurant_id, options } = body;

    if (!image || !restaurant_id) {
      return new Response(
        JSON.stringify({ error: "image ve restaurant_id gerekli" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Kredi kontrolü
    const { data: rest, error: restErr } = await supabase
      .from("restaurants")
      .select("ai_credits_total, ai_credits_used")
      .eq("id", restaurant_id)
      .single();

    if (restErr || !rest) {
      return new Response(
        JSON.stringify({ error: "Restoran bulunamadı" }),
        { status: 404, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const PHOTO_ENHANCE_COST = 20;
    const remaining = (rest.ai_credits_total ?? 0) - (rest.ai_credits_used ?? 0);
    if (remaining < PHOTO_ENHANCE_COST) {
      return new Response(
        JSON.stringify({ error: `Yetersiz AI kredisi. Gerekli: ${PHOTO_ENHANCE_COST}, kalan: ${remaining}.` }),
        { status: 402, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    // Gemini 2.5 Flash Image çağrısı
    const { mime, data } = splitDataUrl(image);
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GOOGLE_AI_API_KEY}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType: mime, data } },
              { text: buildPrompt(options) },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
        },
      }),
    });

    const geminiJson = await geminiRes.json();
    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: geminiJson?.error?.message || "Gemini API hatası" }),
        { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const parts = geminiJson?.candidates?.[0]?.content?.parts ?? [];
    let enhancedBase64: string | null = null;
    let enhancedMime = "image/png";
    for (const p of parts) {
      if (p?.inlineData?.data) {
        enhancedBase64 = p.inlineData.data;
        enhancedMime = p.inlineData.mimeType || enhancedMime;
        break;
      }
    }

    if (!enhancedBase64) {
      return new Response(
        JSON.stringify({ error: "İyileştirilmiş görsel alınamadı" }),
        { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        enhanced_base64: enhancedBase64,
        mime_type: enhancedMime,
        credits_remaining: remaining, // henüz düşmedi, frontend kaydederse düşecek
      }),
      { headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  }
});
