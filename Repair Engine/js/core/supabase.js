// File: /js/core/supabase.js
// Supabase Client Wrapper (ES2022 module compatible)
import { CONFIG } from '../../config/config.js';

let supabaseClient = null;

export function getSupabase() {
  if (supabaseClient) return supabaseClient;
  
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    return supabaseClient;
  }
  
  // Fallback stub for graceful offline/pre-initialization handling
  console.warn('Supabase SDK not loaded yet on window.');
  return null;
}

