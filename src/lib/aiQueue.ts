import { supabase } from './supabase';

export type AIJobType = 'photo_enhance' | 'description_writer' | 'menu_import';

export type AIJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface AIJobRow {
  id: string;
  status: AIJobStatus;
  result_data: Record<string, unknown> | null;
  error_code: string | null;
  error_message: string | null;
  attempt_count: number;
}

export interface EnqueueResult {
  job_id: string;
  status: 'queued';
  credit_cost: number;
  credits_remaining_after_charge: number;
}

export type EnqueueErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'INVALID_JOB_TYPE'
  | 'NO_RESTAURANT_FOR_USER'
  | 'RESTAURANT_INACTIVE'
  | 'INVALID_IMAGE_COUNT'
  | 'INSUFFICIENT_CREDITS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNKNOWN';

export interface EnqueueError {
  code: EnqueueErrorCode;
  message: string;
  userMessage: string;
}

const USER_MESSAGES: Record<EnqueueErrorCode, string> = {
  NOT_AUTHENTICATED: 'Lütfen tekrar giriş yapın.',
  INVALID_JOB_TYPE: 'Geçersiz işlem türü.',
  NO_RESTAURANT_FOR_USER: 'Restoran bulunamadı.',
  RESTAURANT_INACTIVE: 'Aboneliğiniz aktif değil. Lütfen plan yenileme için bizimle iletişime geçin.',
  INVALID_IMAGE_COUNT: 'Geçersiz fotoğraf sayısı (1-10 arası olmalı).',
  INSUFFICIENT_CREDITS: 'AI krediniz yetersiz. Plan yükselterek daha fazla kullanım hakkı kazanabilirsiniz.',
  RATE_LIMIT_EXCEEDED: 'Çok hızlı istek gönderildi. Birkaç saniye bekleyip tekrar deneyin.',
  UNKNOWN: 'Bilinmeyen bir hata oluştu. Tekrar deneyin.',
};

function parseRpcError(rawMessage: string): EnqueueError {
  // RPC errors come through as "INSUFFICIENT_CREDITS: have 5, need 20" etc.
  // Match the prefix before the first ":"
  const match = rawMessage.match(/^([A-Z_]+)(?::|$)/);
  const prefix = match?.[1];
  const code: EnqueueErrorCode =
    prefix && prefix in USER_MESSAGES ? (prefix as EnqueueErrorCode) : 'UNKNOWN';
  return {
    code,
    message: rawMessage,
    userMessage: USER_MESSAGES[code],
  };
}

export async function enqueueAIJob(
  jobType: AIJobType,
  inputData: Record<string, unknown>,
): Promise<{ ok: true; data: EnqueueResult } | { ok: false; error: EnqueueError }> {
  const { data, error } = await supabase.rpc('enqueue_ai_job', {
    p_job_type: jobType,
    p_input_data: inputData,
  });

  if (error) {
    return { ok: false, error: parseRpcError(error.message) };
  }
  if (!data || typeof data !== 'object' || !('job_id' in data)) {
    return { ok: false, error: parseRpcError('UNKNOWN: malformed response') };
  }
  return { ok: true, data: data as EnqueueResult };
}

export async function cancelAIJob(jobId: string): Promise<{ ok: boolean; message?: string }> {
  const { data, error } = await supabase.rpc('cancel_ai_job', { p_job_id: jobId });
  if (error) return { ok: false, message: error.message };
  if (!data || typeof data !== 'object') return { ok: false, message: 'malformed response' };
  return { ok: true };
}

/**
 * Subscribe to a single ai_jobs row. Calls onUpdate for every status change.
 * Returns an unsubscribe function. Also performs a one-shot fetch after
 * subscription succeeds to handle the race where the worker completes the job
 * before the realtime subscription is fully attached.
 */
export function subscribeToJob(
  jobId: string,
  onUpdate: (row: AIJobRow) => void,
): () => void {
  const channel = supabase
    .channel(`ai-job-${jobId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ai_jobs',
        filter: `id=eq.${jobId}`,
      },
      (payload) => {
        onUpdate(payload.new as AIJobRow);
      },
    )
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // One-shot fetch to catch jobs that completed before subscribe finished
        const { data, error } = await supabase
          .from('ai_jobs')
          .select('id, status, result_data, error_code, error_message, attempt_count')
          .eq('id', jobId)
          .single();
        if (!error && data) {
          onUpdate(data as AIJobRow);
        }
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export interface InFlightJobQuery {
  restaurantId: string;
  jobType: AIJobType;
  /** JSONB containment filter on input_data, e.g. { source_id: '<uuid>' } for PhotoEnhance. */
  inputDataFilter?: Record<string, string>;
}

const RESUME_WINDOW_MS = 5 * 60 * 1000;

/**
 * Queries ai_jobs for any in-flight (queued/processing) or recently-completed
 * job matching the filter. Returns the most recent matching row, or null.
 *
 * - Window: jobs created in the last 5 minutes
 * - Statuses included: queued, processing, completed
 * - Excluded: failed, cancelled (user already saw the outcome)
 */
export async function findResumableJob(
  query: InFlightJobQuery,
): Promise<AIJobRow | null> {
  let q = supabase
    .from('ai_jobs')
    .select('id, status, result_data, error_code, error_message, attempt_count')
    .eq('restaurant_id', query.restaurantId)
    .eq('job_type', query.jobType)
    .in('status', ['queued', 'processing', 'completed'])
    .gte('created_at', new Date(Date.now() - RESUME_WINDOW_MS).toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (query.inputDataFilter) {
    q = q.contains('input_data', query.inputDataFilter);
  }

  const { data, error } = await q.maybeSingle();
  if (error || !data) return null;
  return data as AIJobRow;
}

/**
 * Mark a job's result as consumed (user accepted/saw it). Persisted in
 * localStorage so subsequent mounts don't re-surface the same preview.
 */
export function markJobConsumed(jobId: string): void {
  try {
    localStorage.setItem(`tabbled:ai-job:consumed:${jobId}`, '1');
  } catch {
    // localStorage may be unavailable (private browsing, SSR); silent fail OK.
  }
}

/**
 * Check whether a completed job's result has been consumed.
 */
export function isJobConsumed(jobId: string): boolean {
  try {
    return localStorage.getItem(`tabbled:ai-job:consumed:${jobId}`) === '1';
  } catch {
    return false;
  }
}
