import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || supabaseUrl === 'REPLACE_ME' || !supabaseAnonKey || supabaseAnonKey === 'REPLACE_ME') {
  document.body.innerHTML = `
    <div style="font-family:system-ui;max-width:480px;margin:60px auto;padding:24px;border:2px solid #f97316;border-radius:12px;background:#fff7ed">
      <h2 style="color:#c2410c;margin:0 0 8px">Missing Supabase keys</h2>
      <p style="color:#7c2d12;font-size:14px;margin:0 0 12px">
        Open <code>frontend/web-frontend/.env</code> and fill in your real Supabase URL and anon key.
        See <strong>SETUP.md Part 6</strong> for where to find them.
      </p>
      <code style="display:block;background:#fef3c7;padding:12px;border-radius:8px;font-size:12px;white-space:pre">VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:8787</code>
    </div>`
  throw new Error('Supabase env vars not set — see frontend/web-frontend/.env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
