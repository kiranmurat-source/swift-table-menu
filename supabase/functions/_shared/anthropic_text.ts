// Shared helper: Anthropic Claude Haiku menu description writer.
// Used by generate-description (synchronous) and process-ai-queue worker (async).
// Pure function: throws Error on failure.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-haiku-4-5-20251001";

export interface AnthropicDescriptionInput {
  name_tr: string;
  category_name?: string | null;
  price?: number | string | null;
  allergens?: string[] | null;
  is_vegetarian?: boolean | null;
  calories?: number | null;
  tone?: string | null;
  currentDesc?: string | null;
}

export interface AnthropicDescriptionResult {
  description: string;
  usage: { input_tokens: number; output_tokens: number };
}

const TONE_GUIDE: Record<string, string> = {
  elegant: "Şık, rafine, lüks restoran tarzında. Kısa ve etkileyici.",
  casual: "Samimi, sıcak, kafe/bistro tarzında. Arkadaşça ve davetkar.",
  descriptive: "Detaylı, bilgilendirici, malzemeleri ve pişirme tekniğini anlatan.",
};

export function buildDescriptionPrompt(input: AnthropicDescriptionInput): string {
  const selectedTone = TONE_GUIDE[input.tone ?? ""] || TONE_GUIDE["descriptive"];

  const allergenText =
    input.allergens && input.allergens.length > 0 ? `Alerjenler: ${input.allergens.join(", ")}. ` : "";
  const vegText = input.is_vegetarian ? "Bu vejetaryen bir üründür. " : "";
  const calText = input.calories ? `${input.calories} kcal. ` : "";
  const currentDescText =
    input.currentDesc && input.currentDesc.trim().length > 0
      ? `\nMevcut açıklama (bunu iyileştir): ${input.currentDesc}`
      : "";

  return `Sen profesyonel bir restoran menü yazarısın. Türkiye'deki restoranlar için iştah açıcı, profesyonel menü açıklamaları yazıyorsun.

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

Ürün: ${input.name_tr}
Kategori: ${input.category_name || "Belirtilmemiş"}
Fiyat: ₺${input.price ?? ""}
${allergenText}${vegText}${calText}${currentDescText}

Ton: ${selectedTone}

Bu ürün için kısa, iştah açıcı bir menü açıklaması yaz.`;
}

export async function callAnthropic(input: AnthropicDescriptionInput): Promise<AnthropicDescriptionResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_NOT_CONFIGURED");
  }

  const prompt = buildDescriptionPrompt(input);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("[anthropic_text] failed:", res.status, data?.error?.message);
    throw new Error(`ANTHROPIC_ERROR_${res.status}`);
  }

  const description: string = (data?.content?.[0]?.text || "").trim();
  if (!description) {
    throw new Error("ANTHROPIC_EMPTY_RESPONSE");
  }

  return {
    description,
    usage: {
      input_tokens: data?.usage?.input_tokens ?? 0,
      output_tokens: data?.usage?.output_tokens ?? 0,
    },
  };
}
