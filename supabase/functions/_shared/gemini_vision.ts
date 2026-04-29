// Shared helper: Gemini 2.5 Flash vision (menu OCR/structuring).
// Used by import-menu (synchronous) and process-ai-queue worker (async).
// Env var name kept as GOOGLE_AI_API_KEY to match existing deployment.

const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

export interface VisionMenuItem {
  name_tr: string;
  description_tr: string | null;
  price: number | null;
}

export interface VisionMenuCategory {
  name_tr: string;
  items: VisionMenuItem[];
}

export interface VisionMenuResult {
  categories: VisionMenuCategory[];
  stats: {
    category_count: number;
    item_count: number;
  };
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

interface RawResponse {
  categories?: Array<{
    name_tr?: unknown;
    items?: Array<{
      name_tr?: unknown;
      description_tr?: unknown;
      price?: unknown;
    }>;
  }>;
}

export async function callGeminiVision(images: string[]): Promise<VisionMenuResult> {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error("GEMINI_NOT_CONFIGURED");
  }

  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("INVALID_INPUT_NO_IMAGES");
  }
  if (images.length > 10) {
    throw new Error("INVALID_INPUT_TOO_MANY_IMAGES");
  }

  const parts: unknown[] = [];
  for (const img of images) {
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
    console.error("[gemini_vision] failed:", res.status, data?.error?.message);
    throw new Error(`GEMINI_VISION_ERROR_${res.status}`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("GEMINI_VISION_EMPTY_RESPONSE");

  let parsed: RawResponse;
  try {
    parsed = JSON.parse(text) as RawResponse;
  } catch {
    throw new Error("GEMINI_VISION_INVALID_JSON");
  }

  const categories: VisionMenuCategory[] = (parsed.categories || [])
    .filter((c) => c?.name_tr && typeof c.name_tr === "string")
    .map((c) => ({
      name_tr: (c.name_tr as string).trim(),
      items: (c.items || [])
        .filter((it) => it?.name_tr && typeof it.name_tr === "string")
        .map((it) => ({
          name_tr: (it.name_tr as string).trim(),
          description_tr:
            typeof it.description_tr === "string" && it.description_tr.trim() !== ""
              ? (it.description_tr as string).trim()
              : null,
          price:
            typeof it.price === "number" && Number.isFinite(it.price)
              ? (it.price as number)
              : null,
        })),
    }));

  return {
    categories,
    stats: {
      category_count: categories.length,
      item_count: categories.reduce((s, c) => s + c.items.length, 0),
    },
  };
}
