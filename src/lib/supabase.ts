import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://qmnrawqvkwehufebbkxp.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbnJhd3F2a3dlaHVmZWJia3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTk5OTQsImV4cCI6MjA5MDc5NTk5NH0.cQeGl66uJAy3Q4FpAgh6hgNImEx4RsVK-CfBuukJuEc';

export { supabaseUrl };
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
