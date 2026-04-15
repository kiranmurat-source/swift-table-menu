import { supabase } from './supabase';

export const AI_CREDIT_COSTS = {
  menuDescription: 15,
  photoEnhance: 20,
  menuImportPerFile: 50,
} as const;

export const PLAN_AI_CREDITS: Record<string, number> = {
  basic: 60,
  premium: 150,
  enterprise: 300,
};

export type AiActionType = 'menu_description' | 'photo_enhance' | 'menu_import';

/**
 * Atomik kredi tüketir. DB tarafında consume_ai_credits RPC'si UPDATE ... SET
 * ai_credits_used = ai_credits_used + amount çalıştırır (race-condition yok).
 * Yetersiz kredi varsa null döner.
 */
export async function consumeAICredits(args: {
  restaurantId: string;
  amount: number;
  actionType: AiActionType;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}): Promise<{ creditsUsed: number; creditsTotal: number } | null> {
  const { data, error } = await supabase.rpc('consume_ai_credits', {
    p_restaurant_id: args.restaurantId,
    p_amount: args.amount,
    p_action_type: args.actionType,
    p_input: args.input ?? {},
    p_output: args.output ?? {},
  });
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { creditsUsed: row.credits_used, creditsTotal: row.credits_total };
}
