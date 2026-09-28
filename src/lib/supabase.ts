import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    experimental: {
      passkey: true
    }
  }
});

// App iOS: dopo "Accedi con Apple" il guscio nativo consegna qui la sessione
window.addEventListener('native-session', (e) => {
  const { access_token, refresh_token } = (e as CustomEvent).detail ?? {};
  if (access_token) void supabase.auth.setSession({ access_token, refresh_token });
});
