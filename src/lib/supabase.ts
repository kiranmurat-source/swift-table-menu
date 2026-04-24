import { createClient } from '@supabase/supabase-js';

// Read from Vite env (browser / Vite SSG build) or Node process env
// (Vercel Serverless Function runtime). Both paths fall back to the
// hardcoded public anon-key defaults so the client works if env vars
// are missing — same as prior behavior.
const viteEnv =
  typeof import.meta !== 'undefined'
    ? ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {})
    : {};
const nodeEnv: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {};

const supabaseUrl =
  viteEnv.VITE_SUPABASE_URL ||
  nodeEnv.VITE_SUPABASE_URL ||
  nodeEnv.SUPABASE_URL ||
  'https://qmnrawqvkwehufebbkxp.supabase.co';
const supabaseAnonKey =
  viteEnv.VITE_SUPABASE_ANON_KEY ||
  nodeEnv.VITE_SUPABASE_ANON_KEY ||
  nodeEnv.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbnJhd3F2a3dlaHVmZWJia3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTk5OTQsImV4cCI6MjA5MDc5NTk5NH0.cQeGl66uJAy3Q4FpAgh6hgNImEx4RsVK-CfBuukJuEc';

export { supabaseUrl };
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
