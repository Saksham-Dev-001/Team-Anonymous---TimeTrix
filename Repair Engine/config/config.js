// File: /config/config.js
// Production runtime configuration for TimeTrix (by Team Anonymous)

export const CONFIG = {
  APP_NAME: 'TimeTrix',
  TEAM_NAME: 'Team Anonymous',
  APP_VERSION: '1.0.0',
  SUPABASE_URL: window.__ENV?.SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: window.__ENV?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
  VAPID_PUBLIC_KEY: window.__ENV?.VAPID_PUBLIC_KEY || '',
  DEFAULT_TIMEZONE: 'Asia/Kolkata',
  DEFAULT_LOCALE: 'en-IN'
};

