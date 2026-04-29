// Edge Function: generate-description
// Anthropic Claude Haiku ile Türkçe menü açıklaması üretir.
// Provider call logic _shared/anthropic_text.ts'de — process-ai-queue worker ile paylaşılıyor.
// Mevcut davranış: kredi düşümü server-side (consume_ai_credits). Bu PR'de değiştirilmiyor;
// PR3'te frontend bu fonksiyonu çağırmayı bırakınca server-side deduction kaldırılacak.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAnthropic } from "../_shared/anthropic_text.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MENU_DESCRIPTION_COST = 15;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://tabbled.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};
const JSON_HEADERS = { "Content-Type": "application/json", ...CORS_HEADERS };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { restaurant_id, item_id, name_tr, category_name, price, allergens, is_vegetarian, calories, tone, currentDesc } = await req.json();

    if (!restaurant_id || !item_id || !name_tr) {
      return new Response(JSON.stringify({ error: "Missing params" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Kredi kontrolü (ön kontrol — gerçek düşüm AI çağrısı başarılıysa)
    const { data: rest, error: restErr } = await supabase
      .from("restaurants")
      .select("ai_credits_total, ai_credits_used")
      .eq("id", restaurant_id)
      .single();

    if (restErr || !rest) {
      return new Response(JSON.stringify({ error: "Restaurant not found" }), {
        status: 404,
        headers: JSON_HEADERS,
      });
    }

    const totalCredits = rest.ai_credits_total ?? 0;
    const usedCredits = rest.ai_credits_used ?? 0;
    const remaining = totalCredits - usedCredits;

    if (remaining < MENU_DESCRIPTION_COST) {
      return new Response(JSON.stringify({ error: `Yetersiz AI kredisi. Gerekli: ${MENU_DESCRIPTION_COST}, kalan: ${remaining}.`, code: "INSUFFICIENT_CREDITS", usage: usedCredits, limit: totalCredits }), {
        status: 402,
        headers: JSON_HEADERS,
      });
    }

    let description: string;
    try {
      const out = await callAnthropic({
        name_tr,
        category_name,
        price,
        allergens,
        is_vegetarian,
        calories,
        tone,
        currentDesc,
      });
      description = out.description;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[generate-description] anthropic error:", msg);
      return new Response(JSON.stringify({ error: "AI servisi hatası: " + msg }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }

    // Atomik kredi düş
    const { data: consumed, error: consumeErr } = await supabase.rpc("consume_ai_credits", {
      p_restaurant_id: restaurant_id,
      p_amount: MENU_DESCRIPTION_COST,
      p_action_type: "menu_description",
      p_input: { item_id, name_tr, tone },
      p_output: { length: description.length },
    });

    if (consumeErr) {
      return new Response(JSON.stringify({ error: "Kredi düşürülemedi: " + consumeErr.message }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }

    const row = Array.isArray(consumed) ? consumed[0] : consumed;
    const newUsed = row?.credits_used ?? usedCredits + MENU_DESCRIPTION_COST;

    return new Response(JSON.stringify({
      success: true,
      description,
      usage: newUsed,
      limit: totalCredits,
    }), {
      headers: JSON_HEADERS,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});
