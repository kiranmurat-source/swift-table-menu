// Edge Function: enhance-photo
// Yemek fotoğrafını plan-bazlı sağlayıcı routing ile iyileştirir:
//   - Basic plan        → OpenAI gpt-image-1.5 (quality=high, input_fidelity=high)
//   - Premium/Enterprise → Gemini 2.5 Flash Image
// Provider call logic lives in _shared/openai_image.ts and _shared/gemini_image.ts —
// shared with the process-ai-queue worker.
//
// Request:  { image: base64 or data URL, restaurant_id: string, options? }
// Response: { ok, enhanced_base64, mime_type, credits_remaining }
// Not: kredi düşmez, media_library'ye yazmaz — frontend kaydet sonrası yapılır.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  callOpenAI,
  buildEnhancePrompt,
  splitDataUrl,
  type EnhanceOptions,
} from "../_shared/openai_image.ts";
import { callGemini } from "../_shared/gemini_image.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const JSON_HEADERS = { "Content-Type": "application/json", ...CORS_HEADERS };

type PlanTier = "basic" | "premium" | "enterprise";

interface EnhanceRequest {
  image: string;
  restaurant_id: string;
  options?: EnhanceOptions;
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
    const prompt = buildEnhancePrompt(options);

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
