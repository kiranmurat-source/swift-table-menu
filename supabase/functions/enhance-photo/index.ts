// Edge Function: enhance-photo
// Yemek fotoğrafını plan-bazlı sağlayıcı routing ile iyileştirir:
//   - Basic plan        → OpenAI gpt-image-1.5 (quality=high, input_fidelity=high)
//   - Premium/Enterprise → Gemini 2.5 Flash Image (mevcut davranış)
// Aydınlatma, beyaz dengesi, renk canlılığı, detay keskinliği uygulanır.
// Yemek içeriği asla değiştirilmez (yeni yemek üretme / ekleme / kaldırma yasak).
//
// Request:  { image: base64 or data URL, restaurant_id: string, options? }
// Response: { ok, enhanced_base64, mime_type, credits_remaining }
// Not: Bu fonksiyon kredi düşmez ve media_library'ye yazmaz — frontend kaydet
// dedikten sonra yaparız (kullanıcı önizlemede iptal edebilir). Ancak kredi
// kontrolü burada yapılır (kullanıcı krediler bitmişken API'yi çağıramasın).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const JSON_HEADERS = { "Content-Type": "application/json", ...CORS_HEADERS };

type AngleOpt = "original" | "45" | "90";
type LightingOpt = "original" | "studio" | "natural";
type SurfaceOpt = "original" | "wood" | "light_marble" | "dark_marble" | "white" | "black";
type PlanTier = "basic" | "premium" | "enterprise";

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

async function callGemini(opts: {
  base64: string;
  mimeType: string;
  prompt: string;
}): Promise<{ base64: string; mime: string }> {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error("GEMINI_NOT_CONFIGURED");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GOOGLE_AI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inlineData: { mimeType: opts.mimeType, data: opts.base64 } },
            { text: opts.prompt },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error("Gemini edit failed:", res.status, json?.error?.message);
    throw new Error(`GEMINI_ERROR_${res.status}`);
  }

  const parts = json?.candidates?.[0]?.content?.parts ?? [];
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
    throw new Error("GEMINI_NO_IMAGE_RETURNED");
  }

  return { base64: enhancedBase64, mime: enhancedMime };
}

async function callOpenAI(opts: {
  base64: string;
  mimeType: string;
  prompt: string;
}): Promise<{ base64: string; mime: string }> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_NOT_CONFIGURED");
  }

  const binary = Uint8Array.from(atob(opts.base64), (c) => c.charCodeAt(0));
  const blob = new Blob([binary], { type: opts.mimeType });

  const form = new FormData();
  form.append("model", "gpt-image-1.5");
  form.append("image", blob, "input.png");
  form.append("prompt", opts.prompt);
  form.append("quality", "high");
  form.append("input_fidelity", "high");
  form.append("size", "1024x1024");
  form.append("n", "1");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("OpenAI edit failed:", res.status, errText);
    throw new Error(`OPENAI_ERROR_${res.status}`);
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OPENAI_NO_IMAGE_RETURNED");
  }

  return { base64: b64, mime: "image/png" };
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
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: rest, error: restErr } = await supabase
      .from("restaurants")
      .select("ai_credits_total, ai_credits_used, current_plan, is_active")
      .eq("id", restaurant_id)
      .single();

    if (restErr || !rest) {
      return new Response(
        JSON.stringify({ error: "Restoran bulunamadı" }),
        { status: 404, headers: JSON_HEADERS },
      );
    }

    if (!rest.is_active) {
      return new Response(
        JSON.stringify({ error: "Aboneliğiniz aktif değil. Lütfen info@tabbled.com adresinden bizimle iletişime geçin." }),
        { status: 403, headers: JSON_HEADERS },
      );
    }

    const PHOTO_ENHANCE_COST = 20;
    const remaining = (rest.ai_credits_total ?? 0) - (rest.ai_credits_used ?? 0);
    if (remaining < PHOTO_ENHANCE_COST) {
      return new Response(
        JSON.stringify({ error: `Yetersiz AI kredisi. Gerekli: ${PHOTO_ENHANCE_COST}, kalan: ${remaining}.` }),
        { status: 402, headers: JSON_HEADERS },
      );
    }

    // Plan tier — defansif default 'basic'. 'pro' legacy alias → 'premium'.
    const rawPlan = rest.current_plan;
    const planTier: PlanTier =
      rawPlan === "enterprise"
        ? "enterprise"
        : rawPlan === "premium" || rawPlan === "pro"
        ? "premium"
        : "basic";

    const { mime, data } = splitDataUrl(image);
    const prompt = buildPrompt(options);

    console.log(
      `[enhance-photo] plan=${planTier} provider=${planTier === "basic" ? "openai" : "gemini"} restaurant=${restaurant_id}`,
    );

    let result: { base64: string; mime: string };
    try {
      if (planTier === "basic") {
        result = await callOpenAI({ base64: data, mimeType: mime, prompt });
      } else {
        result = await callGemini({ base64: data, mimeType: mime, prompt });
      }
    } catch (e) {
      const msg = String((e as Error)?.message || e);

      if (msg === "OPENAI_NOT_CONFIGURED" || msg === "GEMINI_NOT_CONFIGURED") {
        return new Response(
          JSON.stringify({ error: "AI servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin." }),
          { status: 503, headers: JSON_HEADERS },
        );
      }

      if (msg.startsWith("OPENAI_ERROR_4")) {
        return new Response(
          JSON.stringify({ error: "Bu fotoğraf işlenemedi. Lütfen farklı bir görsel deneyin." }),
          { status: 422, headers: JSON_HEADERS },
        );
      }

      console.error("[enhance-photo] dispatcher error:", msg);
      return new Response(
        JSON.stringify({ error: "Fotoğraf iyileştirilemedi, lütfen tekrar deneyin." }),
        { status: 502, headers: JSON_HEADERS },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        enhanced_base64: result.base64,
        mime_type: result.mime,
        credits_remaining: remaining, // henüz düşmedi, frontend kaydederse düşecek
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
