import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey || supabaseServiceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not set. Some server-side operations may fail.');
}

// Server-side Supabase client (uses service role key for admin operations)
export const supabaseServer = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

