import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey);

// Simple key-value helpers backed by a single 'prep_data' table (key text primary key, value jsonb).
export async function getKey(key, fallback) {
  const { data, error } = await supabase.from('prep_data').select('value').eq('key', key).maybeSingle();
  if (error || !data) return fallback;
  return data.value;
}

export async function setKey(key, value) {
  const { error } = await supabase.from('prep_data').upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) console.error('Supabase save error:', error.message);
}
