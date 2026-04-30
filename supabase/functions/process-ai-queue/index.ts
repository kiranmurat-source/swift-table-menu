// Edge Function: process-ai-queue
// Worker draining pgmq.ai_queue. Invoked every ~10s by pg_cron.
// Concurrency: global=5, photo=3, desc=5, import=1.
// Auth: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY> (new sb_secret_ format)
//   OR Bearer <SERVICE_ROLE_KEY_LEGACY> (old JWT format, optional fallback).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { callOpenAI, buildEnhancePrompt, splitDataUrl, EnhanceOptions } from "../_shared/openai_image.ts";
import { callGemini } from "../_shared/gemini_image.ts";
import { callAnthropic, AnthropicDescriptionInput } from "../_shared/anthropic_text.ts";
import { callGeminiVision } from "../_shared/gemini_vision.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SERVICE_ROLE_KEY_LEGACY = Deno.env.get("SERVICE_ROLE_KEY_LEGACY");

const GLOBAL_CAP = 5;
const PER_TYPE_CAP: Record<string, number> = {
  photo_enhance: 3,
  description_writer: 5,
  menu_import: 1,
};
const VISIBILITY_TIMEOUT_S = 600;
const STORAGE_BUCKET = "menu-images";

type JobType = "photo_enhance" | "description_writer" | "menu_import";

interface JobRow {
  id: string;
  restaurant_id: string;
  user_id: string | null;
  job_type: JobType;
  status: string;
  provider: string | null;
  input_data: Record<string, unknown>;
  attempt_count: number;
  max_attempts: number;
  credit_cost: number;
  credits_charged: boolean;
}

interface QueueMessage {
  msg_id: number;
  read_ct: number;
  message: { job_id: string; job_type: JobType };
}

interface HandlerOutput {
  result_data: Record<string, unknown>;
  output_log: Record<string, unknown>;
}

// PNG header reader: bytes 16-23 hold width/height (big-endian, 32-bit each).
// Returns null for non-PNG or any decode failure (column accepts NULL).
function readPngDimensions(b64: string): { width: number; height: number } | null {
  try {
    const head = atob(b64.slice(0, 64));
    if (head.charCodeAt(0) !== 0x89 || head.charCodeAt(1) !== 0x50) return null;
    const w = (head.charCodeAt(16) << 24) | (head.charCodeAt(17) << 16) | (head.charCodeAt(18) << 8) | head.charCodeAt(19);
    const h = (head.charCodeAt(20) << 24) | (head.charCodeAt(21) << 16) | (head.charCodeAt(22) << 8) | head.charCodeAt(23);
    if (w <= 0 || h <= 0 || w > 16384 || h > 16384) return null;
    return { width: w, height: h };
  } catch {
    return null;
  }
}

function mimeToExt(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}

function categorizeError(err: unknown): { code: string; message: string } {
  const msg = err instanceof Error ? err.message : String(err);

  if (/_NOT_CONFIGURED$/.test(msg)) return { code: "PROVIDER_ERROR", message: msg };
  if (/_ERROR_429$/.test(msg)) return { code: "RATE_LIMITED", message: msg };
  if (/_ERROR_4\d\d$/.test(msg)) return { code: "INVALID_INPUT", message: msg };
  if (/_ERROR_5\d\d$/.test(msg)) return { code: "PROVIDER_ERROR", message: msg };
  if (/^STORAGE_/.test(msg)) return { code: "STORAGE_ERROR", message: msg };
  if (/^INVALID_INPUT/.test(msg)) return { code: "INVALID_INPUT", message: msg };
  return { code: "INTERNAL_ERROR", message: msg };
}

// ----- Capacity -----

async function fetchInflightCounts(supabase: SupabaseClient): Promise<{
  global: number;
  per_type: Record<string, number>;
}> {
  const { data, error } = await supabase
    .from("ai_jobs")
    .select("job_type")
    .eq("status", "processing");

  if (error) {
    throw new Error(`STORAGE_INFLIGHT_QUERY: ${error.message}`);
  }

  const per_type: Record<string, number> = {
    photo_enhance: 0,
    description_writer: 0,
    menu_import: 0,
  };
  for (const row of data ?? []) {
    const jt = (row as { job_type: string }).job_type;
    if (jt in per_type) per_type[jt] += 1;
  }
  return { global: data?.length ?? 0, per_type };
}

// ----- pgmq via SQL (Supabase JS does not surface pgmq RPCs as named methods) -----

async function pgmqRead(supabase: SupabaseClient, qty: number): Promise<QueueMessage[]> {
  const { data, error } = await supabase.rpc("ai_queue_read", { p_qty: qty, p_vt: VISIBILITY_TIMEOUT_S });
  if (error) {
    throw new Error(`PGMQ_READ: ${error.message}`);
  }
  return (data ?? []) as QueueMessage[];
}

async function pgmqDelete(supabase: SupabaseClient, msgId: number): Promise<void> {
  const { error } = await supabase.rpc("ai_queue_delete", { p_msg_id: msgId });
  if (error) {
    console.error(`[process-ai-queue] pgmq.delete(${msgId}) failed: ${error.message}`);
  }
}

async function pgmqSend(supabase: SupabaseClient, payload: { job_id: string; job_type: string }): Promise<void> {
  const { error } = await supabase.rpc("ai_queue_send", { p_payload: payload });
  if (error) {
    console.error(`[process-ai-queue] pgmq.send failed: ${error.message}`);
  }
}

// ----- Locking + state transitions -----

async function lockAndStartJob(
  supabase: SupabaseClient,
  jobId: string,
): Promise<JobRow | null> {
  const { data, error } = await supabase.rpc("ai_queue_lock_start", { p_job_id: jobId });
  if (error) {
    throw new Error(`LOCK_START: ${error.message}`);
  }
  if (!data || (Array.isArray(data) && data.length === 0)) return null;
  return Array.isArray(data) ? (data[0] as JobRow) : (data as JobRow);
}

async function completeJob(
  supabase: SupabaseClient,
  job: JobRow,
  output: HandlerOutput,
): Promise<void> {
  const { error } = await supabase.rpc("ai_queue_complete_job", {
    p_job_id: job.id,
    p_result_data: output.result_data,
    p_output_log: output.output_log,
    p_action_type:
      job.job_type === "photo_enhance"
        ? "photo_enhance"
        : job.job_type === "description_writer"
        ? "menu_description"
        : "menu_import",
  });
  if (error) {
    throw new Error(`COMPLETE_JOB: ${error.message}`);
  }
}

async function retryJob(supabase: SupabaseClient, jobId: string): Promise<void> {
  const { error } = await supabase
    .from("ai_jobs")
    .update({ status: "queued" })
    .eq("id", jobId);
  if (error) {
    console.error(`[process-ai-queue] retryJob update failed: ${error.message}`);
  }
}

async function failJob(
  supabase: SupabaseClient,
  jobId: string,
  errorMessage: string,
  errorCode: string,
): Promise<void> {
  const { error } = await supabase
    .from("ai_jobs")
    .update({
      status: "failed",
      error_message: errorMessage.slice(0, 1000),
      error_code: errorCode,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
  if (error) {
    console.error(`[process-ai-queue] failJob update failed: ${error.message}`);
  }
}

// ----- Handlers -----

async function handlePhoto(supabase: SupabaseClient, job: JobRow): Promise<HandlerOutput> {
  const input = job.input_data as {
    image: string;
    options?: EnhanceOptions;
    source_id?: string | null;
  };
  if (!input?.image) {
    throw new Error("INVALID_INPUT_NO_IMAGE");
  }

  const { mime, data } = splitDataUrl(input.image);
  const prompt = buildEnhancePrompt(input.options ?? {});

  const provider = job.provider ?? "openai";
  let result: { base64: string; mime: string };
  if (provider === "openai") {
    result = await callOpenAI({ base64: data, mimeType: mime, prompt });
  } else if (provider === "gemini") {
    result = await callGemini({ base64: data, mimeType: mime, prompt });
  } else {
    throw new Error(`INVALID_INPUT_UNKNOWN_PROVIDER_${provider}`);
  }

  // Restaurant slug for storage path
  const { data: rest, error: restErr } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("id", job.restaurant_id)
    .single();
  if (restErr || !rest?.slug) {
    throw new Error(`STORAGE_NO_SLUG: ${restErr?.message ?? "missing"}`);
  }

  const ext = mimeToExt(result.mime);
  const filePath = `${rest.slug}/library/enhanced-${job.id}.${ext}`;
  const fileName = filePath.split("/").pop() || `enhanced-${job.id}.${ext}`;

  const binary = Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0));
  const upload = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, binary, {
      contentType: result.mime,
      upsert: false,
    });
  if (upload.error) {
    throw new Error(`STORAGE_UPLOAD: ${upload.error.message}`);
  }

  const dims = readPngDimensions(result.base64);

  const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  const publicUrl = pub?.publicUrl ?? null;

  const { data: mlRow, error: mlErr } = await supabase
    .from("media_library")
    .insert({
      restaurant_id: job.restaurant_id,
      file_name: fileName,
      file_path: filePath,
      file_size: binary.byteLength,
      file_type: result.mime,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      ai_enhanced: true,
      original_id: input.source_id ?? null,
    })
    .select("id")
    .single();

  if (mlErr || !mlRow) {
    // Roll back storage
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]).catch(() => {});
    throw new Error(`STORAGE_DB_INSERT: ${mlErr?.message ?? "insert returned no row"}`);
  }

  return {
    result_data: {
      media_library_id: mlRow.id,
      file_name: fileName,
      file_path: filePath,
      file_size: binary.byteLength,
      public_url: publicUrl,
      mime_type: result.mime,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
    },
    output_log: {
      provider,
      mime: result.mime,
      bytes: binary.byteLength,
    },
  };
}

async function handleDescription(_: SupabaseClient, job: JobRow): Promise<HandlerOutput> {
  const input = job.input_data as AnthropicDescriptionInput & { item_id?: string };
  if (!input?.name_tr) {
    throw new Error("INVALID_INPUT_NO_NAME");
  }

  const out = await callAnthropic(input);

  return {
    result_data: {
      description: out.description,
      item_id: input.item_id ?? null,
      usage: out.usage,
    },
    output_log: {
      length: out.description.length,
      tone: input.tone ?? "descriptive",
      input_tokens: out.usage.input_tokens,
      output_tokens: out.usage.output_tokens,
    },
  };
}

async function handleMenuImport(_: SupabaseClient, job: JobRow): Promise<HandlerOutput> {
  const input = job.input_data as { images?: string[]; image_count?: number };
  if (!input?.images || !Array.isArray(input.images)) {
    throw new Error("INVALID_INPUT_NO_IMAGES");
  }

  const out = await callGeminiVision(input.images);

  return {
    result_data: {
      categories: out.categories,
      stats: out.stats,
    },
    output_log: {
      image_count: input.images.length,
      category_count: out.stats.category_count,
      item_count: out.stats.item_count,
    },
  };
}

// ----- Main -----

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const validKeys = [SUPABASE_SERVICE_ROLE_KEY, SERVICE_ROLE_KEY_LEGACY].filter(Boolean) as string[];
  const isValid = !!authHeader && validKeys.some((key) => authHeader === `Bearer ${key}`);
  if (!isValid) {
    console.warn("[process-ai-queue] auth rejected");
    return new Response(JSON.stringify({ ok: false, error: "FORBIDDEN" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let drained = 0;
  let succeeded = 0;
  let failed = 0;
  let retried = 0;
  let skipped = 0;

  try {
    // Capacity
    const inflight = await fetchInflightCounts(supabase);
    const globalRemaining = Math.max(0, GLOBAL_CAP - inflight.global);
    const perTypeRemaining: Record<string, number> = {
      photo_enhance: Math.max(0, PER_TYPE_CAP.photo_enhance - inflight.per_type.photo_enhance),
      description_writer: Math.max(0, PER_TYPE_CAP.description_writer - inflight.per_type.description_writer),
      menu_import: Math.max(0, PER_TYPE_CAP.menu_import - inflight.per_type.menu_import),
    };
    const sumPerType =
      perTypeRemaining.photo_enhance + perTypeRemaining.description_writer + perTypeRemaining.menu_import;
    const readQty = Math.min(globalRemaining, sumPerType);

    if (readQty <= 0) {
      console.log(
        `[process-ai-queue] no capacity (global_inflight=${inflight.global}, per_type=${JSON.stringify(inflight.per_type)})`,
      );
      return new Response(
        JSON.stringify({ ok: true, drained: 0, reason: "NO_CAPACITY" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const messages = await pgmqRead(supabase, readQty);
    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, drained: 0, reason: "EMPTY_QUEUE" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let localGlobal = globalRemaining;

    for (const msg of messages) {
      const { msg_id, message } = msg;
      const jobId = message?.job_id;
      if (!jobId) {
        console.error(`[process-ai-queue] malformed message (no job_id), msg_id=${msg_id}`);
        await pgmqDelete(supabase, msg_id);
        skipped += 1;
        continue;
      }

      // Capacity guard (in case multi-type drain exhausts mid-loop)
      if (localGlobal <= 0) {
        console.log(`[process-ai-queue] global cap exhausted mid-loop, releasing msg_id=${msg_id}`);
        // Don't delete — let visibility timeout return it
        skipped += 1;
        continue;
      }

      let job: JobRow | null;
      try {
        job = await lockAndStartJob(supabase, jobId);
      } catch (e) {
        console.error(`[process-ai-queue] lock failed for job=${jobId}: ${(e as Error).message}`);
        skipped += 1;
        continue;
      }

      if (!job) {
        // Status was not 'queued' (cancelled, completed, processing). Drop the message.
        console.log(`[process-ai-queue] job=${jobId} not queued — drop message`);
        await pgmqDelete(supabase, msg_id);
        skipped += 1;
        continue;
      }

      // Per-type cap re-check (lockAndStartJob already flipped to 'processing'; if we
      // bail now we must roll back to 'queued')
      if (perTypeRemaining[job.job_type] <= 0) {
        console.log(`[process-ai-queue] per-type cap exhausted for ${job.job_type}, rollback`);
        await retryJob(supabase, job.id); // back to 'queued'
        // Do NOT delete msg — let vt expire
        skipped += 1;
        continue;
      }

      perTypeRemaining[job.job_type] -= 1;
      localGlobal -= 1;
      drained += 1;

      console.log(
        `[process-ai-queue] dispatch job=${job.id} type=${job.job_type} provider=${job.provider} attempt=${job.attempt_count}/${job.max_attempts}`,
      );

      try {
        let output: HandlerOutput;
        if (job.job_type === "photo_enhance") {
          output = await handlePhoto(supabase, job);
        } else if (job.job_type === "description_writer") {
          output = await handleDescription(supabase, job);
        } else if (job.job_type === "menu_import") {
          output = await handleMenuImport(supabase, job);
        } else {
          throw new Error(`INVALID_INPUT_UNKNOWN_TYPE_${job.job_type}`);
        }

        await completeJob(supabase, job, output);
        await pgmqDelete(supabase, msg_id);
        succeeded += 1;
        console.log(`[process-ai-queue] success job=${job.id}`);
      } catch (e) {
        const { code, message } = categorizeError(e);
        const isLast = job.attempt_count >= job.max_attempts;
        if (isLast) {
          await failJob(supabase, job.id, message, code);
          await pgmqDelete(supabase, msg_id);
          failed += 1;
          console.error(`[process-ai-queue] FAIL job=${job.id} code=${code} msg=${message}`);
        } else {
          await retryJob(supabase, job.id);
          await pgmqDelete(supabase, msg_id);
          await pgmqSend(supabase, { job_id: job.id, job_type: job.job_type });
          retried += 1;
          console.warn(
            `[process-ai-queue] RETRY job=${job.id} attempt=${job.attempt_count}/${job.max_attempts} code=${code} msg=${message}`,
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, drained, succeeded, failed, retried, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[process-ai-queue] fatal: ${msg}`);
    return new Response(
      JSON.stringify({ ok: false, error: msg, drained, succeeded, failed, retried, skipped }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
