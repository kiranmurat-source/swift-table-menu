// Shared helper: OpenAI image edit (gpt-image-1.5).
// Used by enhance-photo (synchronous) and process-ai-queue worker (async).
// Pure function: throws Error on failure with messages like "OPENAI_NOT_CONFIGURED",
// "OPENAI_ERROR_<status>", "OPENAI_NO_IMAGE_RETURNED".

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

export interface OpenAIImageOpts {
  base64: string;
  mimeType: string;
  prompt: string;
}

export interface OpenAIImageResult {
  base64: string;
  mime: string;
}

export async function callOpenAI(opts: OpenAIImageOpts): Promise<OpenAIImageResult> {
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
    console.error("[openai_image] edit failed:", res.status, errText);
    throw new Error(`OPENAI_ERROR_${res.status}`);
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OPENAI_NO_IMAGE_RETURNED");
  }

  return { base64: b64, mime: "image/png" };
}

// Prompt builder shared between enhance-photo and worker. Pure.
export type AngleOpt = "original" | "45" | "90";
export type LightingOpt = "original" | "studio" | "natural";
export type SurfaceOpt = "original" | "wood" | "light_marble" | "dark_marble" | "white" | "black";

export interface EnhanceOptions {
  angle?: AngleOpt;
  lighting?: LightingOpt;
  surface?: SurfaceOpt;
}

export function buildEnhancePrompt(opts: EnhanceOptions = {}): string {
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

export function splitDataUrl(input: string): { mime: string; data: string } {
  if (input.startsWith("data:")) {
    const mime = input.slice(5, input.indexOf(";"));
    const data = input.split(",")[1];
    return { mime, data };
  }
  return { mime: "image/jpeg", data: input };
}
