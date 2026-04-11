import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PLAN_LIMITS: Record<string, number> = {
  pro: 150,
  premium: 999999,
};

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

    // Plan ve kullanım kontrolü
    const { data: rest, error: restErr } = await supabase
      .from("restaurants")
      .select("current_plan, ai_usage_count, ai_usage_reset_at")
      .eq("id", restaurant_id)
      .single();

    if (restErr || !rest) {
      return new Response(JSON.stringify({ error: "Restaurant not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://tabbled.com" },
      });
    }

    const plan = (rest.current_plan || "").toLowerCase();
    const limit = PLAN_LIMITS[plan];

    if (!limit) {
      return new Response(JSON.stringify({ error: "Bu özellik Pro veya Premium planlarda kullanılabilir.", code: "PLAN_REQUIRED" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://tabbled.com" },
      });
    }

    // Aylık reset kontrolü
    let currentCount = rest.ai_usage_count || 0;
    const resetAt = new Date(rest.ai_usage_reset_at);
    const now = new Date();
    const monthDiff = (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth());

    if (monthDiff >= 1) {
      currentCount = 0;
      await supabase.from("restaurants").update({ ai_usage_count: 0, ai_usage_reset_at: now.toISOString() }).eq("id", restaurant_id);
    }

    if (currentCount >= limit) {
      return new Response(JSON.stringify({ error: `Aylık AI kullanım limitinize ulaştınız (${limit}). Premium'a geçerek sınırsız kullanabilirsiniz.`, code: "LIMIT_REACHED", usage: currentCount, limit }), {
        status: 429,
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

    // Kullanım sayacını artır
    await supabase.from("restaurants").update({ ai_usage_count: currentCount + 1 }).eq("id", restaurant_id);

    return new Response(JSON.stringify({
      success: true,
      description,
      usage: currentCount + 1,
      limit: plan === "premium" ? "unlimited" : limit,
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
