// Shared helper: Gemini 2.5 Flash Image edit.
// Used by enhance-photo (synchronous) and process-ai-queue worker (async).
// NOTE: env var name kept as GOOGLE_AI_API_KEY (matches existing deployment) — not GEMINI_API_KEY.
// Pure function: throws Error on failure.

const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

export interface GeminiImageOpts {
  base64: string;
  mimeType: string;
  prompt: string;
}

export interface GeminiImageResult {
  base64: string;
  mime: string;
}

export async function callGemini(opts: GeminiImageOpts): Promise<GeminiImageResult> {
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
    console.error("[gemini_image] edit failed:", res.status, json?.error?.message);
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
