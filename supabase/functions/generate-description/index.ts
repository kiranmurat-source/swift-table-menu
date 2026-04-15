import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MENU_DESCRIPTION_COST = 15;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "https://tabbled.com",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      },
    });
  }

  try {
    const { restaurant_id, item_id, name_tr, category_name, price, allergens, is_vegetarian, calories, tone, currentDesc } = await req.json();

    if (!restaurant_id || !item_id || !name_tr) {
      return new Response(JSON.stringify({ error: "Missing params" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://tabbled.com" },
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
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://tabbled.com" },
      });
    }

    const totalCredits = rest.ai_credits_total ?? 0;
    const usedCredits = rest.ai_credits_used ?? 0;
    const remaining = totalCredits - usedCredits;

    if (remaining < MENU_DESCRIPTION_COST) {
      return new Response(JSON.stringify({ error: `Yetersiz AI kredisi. Gerekli: ${MENU_DESCRIPTION_COST}, kalan: ${remaining}.`, code: "INSUFFICIENT_CREDITS", usage: usedCredits, limit: totalCredits }), {
        status: 402,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://tabbled.com" },
      });
    }

    // Ton rehberi
    const toneGuide: Record<string, string> = {
      elegant: "Şık, rafine, lüks restoran tarzında. Kısa ve etkileyici.",
      casual: "Samimi, sıcak, kafe/bistro tarzında. Arkadaşça ve davetkar.",
      descriptive: "Detaylı, bilgilendirici, malzemeleri ve pişirme tekniğini anlatan.",
    };
    const selectedTone = toneGuide[tone] || toneGuide["descriptive"];

    // Claude API çağrısı
    const allergenText = allergens && allergens.length > 0 ? `Alerjenler: ${allergens.join(", ")}. ` : "";
    const vegText = is_vegetarian ? "Bu vejetaryen bir üründür. " : "";
    const calText = calories ? `${calories} kcal. ` : "";
    const currentDescText = currentDesc && currentDesc.trim().length > 0
      ? `\nMevcut açıklama (bunu iyileştir): ${currentDesc}`
      : "";

    const prompt = `Sen profesyonel bir restoran menü yazarısın. Türkiye'deki restoranlar için iştah açıcı, profesyonel menü açıklamaları yazıyorsun.

Kurallar:
- SADECE Türkçe yaz
- 1-3 cümle (40-120 karakter arası ideal, max 200 karakter)
- İştah açıcı, duygusal, görsel imgeler kullan
- Malzemeleri, pişirme tekniğini veya sunumu vurgula
- Abartma, klişe ifadelerden kaçın ("eşsiz", "muhteşem", "benzersiz" gibi)
- Emoji KULLANMA
- Fiyat veya kalori bilgisi YAZMA (bunlar zaten ayrı gösteriliyor)
- HTML tag'i KULLANMA, düz metin yaz
- Allerjen bilgisi YAZMA (bunlar zaten ayrı gösteriliyor)
- Restoran adı YAZMA
- Sadece açıklama metnini döndür, başka hiçbir şey yazma

Ürün: ${name_tr}
Kategori: ${category_name || "Belirtilmemiş"}
Fiyat: ₺${price}
${allergenText}${vegText}${calText}${currentDescText}

Ton: ${selectedTone}

Bu ürün için kısa, iştah açıcı bir menü açıklaması yaz.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const claudeData = await claudeRes.json();

    if (!claudeRes.ok) {
      return new Response(JSON.stringify({ error: "AI servisi hatası: " + (claudeData.error?.message || "Bilinmeyen hata") }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://tabbled.com" },
      });
    }

    const description = claudeData.content?.[0]?.text?.trim() || "";

    if (!description) {
      return new Response(JSON.stringify({ error: "Açıklama üretilemedi" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://tabbled.com" },
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
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://tabbled.com" },
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
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://tabbled.com" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://tabbled.com" },
    });
  }
});
