// Edge Function: import-menu
// Restoran menü fotoğraflarını Gemini 2.5 Flash vision API'sine gönderir,
// structured JSON olarak kategori + ürün listesi döner. DB'ye YAZMAZ —
// sadece önizleme için veri üretir. Frontend kullanıcı onayladıktan sonra
// ayrı bir çağrı ile DB'ye yazar.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

interface GeminiItem {
  name_tr: string;
  description_tr: string | null;
  price: number | null;
}

interface GeminiCategory {
  name_tr: string;
  items: GeminiItem[];
}

interface GeminiResponse {
  categories: GeminiCategory[];
}

const PROMPT = `Bu bir restoran menüsünün fotoğrafı/fotoğraflarıdır. Menüdeki tüm kategorileri ve ürünleri çıkar.

Her ürün için şunları belirle:
- Kategori adı (Türkçe, mümkünse menüde yazdığı gibi; yoksa uygun Türkçe kategori adı)
- Ürün adı (Türkçe, menüde yazdığı gibi)
- Açıklama (Türkçe, varsa; yoksa null)
- Fiyat (sayı olarak, sadece TL miktarı; bulunamazsa null)

JSON formatında döndür:
{
  "categories": [
    {
      "name_tr": "Başlangıçlar",
      "items": [
        {
          "name_tr": "Mercimek Çorbası",
          "description_tr": "Geleneksel kırmızı mercimek çorbası",
          "price": 95
        }
      ]
    }
  ]
}

Kurallar:
- Sadece JSON döndür, başka hiçbir metin ekleme.
- Fiyatı bulamadığın ürünlerde "price": null yaz.
- Menüde olmayan ürün üretme; yalnızca fotoğrafta gördüğünü çıkar.
- Kalori, alerjen, besin değeri gibi bilgileri asla üretme.
- Aynı isimde tekrarlayan kategorileri birleştir.`;

async function callGemini(images: string[]): Promise<GeminiResponse> {
  const parts: unknown[] = [];
  for (const img of images) {
    // "data:image/jpeg;base64,xxxx" veya ham base64 olabilir
    const cleaned = img.includes(",") ? img.split(",")[1] : img;
    const mime = img.startsWith("data:") ? img.slice(5, img.indexOf(";")) : "image/jpeg";
    parts.push({
      inlineData: { mimeType: mime, data: cleaned },
    });
  }
  parts.push({ text: PROMPT });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini API error (${res.status})`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini boş yanıt döndürdü");

  try {
    return JSON.parse(text) as GeminiResponse;
  } catch {
    throw new Error("Gemini yanıtı geçerli JSON değil");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "images array gerekli (base64 veya data URL)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    if (images.length > 10) {
      return new Response(
        JSON.stringify({ error: "Maksimum 10 görsel desteklenir" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const parsed = await callGemini(images);

    // Basit doğrulama/temizlik
    const cleaned: GeminiResponse = {
      categories: (parsed.categories || [])
        .filter((c) => c?.name_tr && typeof c.name_tr === "string")
        .map((c) => ({
          name_tr: c.name_tr.trim(),
          items: (c.items || [])
            .filter((it) => it?.name_tr && typeof it.name_tr === "string")
            .map((it) => ({
              name_tr: it.name_tr.trim(),
              description_tr:
                typeof it.description_tr === "string" && it.description_tr.trim() !== ""
                  ? it.description_tr.trim()
                  : null,
              price: typeof it.price === "number" && Number.isFinite(it.price) ? it.price : null,
            })),
        })),
    };

    return new Response(
      JSON.stringify({
        ok: true,
        categories: cleaned.categories,
        stats: {
          category_count: cleaned.categories.length,
          item_count: cleaned.categories.reduce((s, c) => s + c.items.length, 0),
        },
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
