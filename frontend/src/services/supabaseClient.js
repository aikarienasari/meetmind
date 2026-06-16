import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    '[supabaseClient] VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diset. ' +
      'Fitur profil & reset password tidak akan berfungsi sampai env diisi.'
  )
}

export const supabase = createClient(url || '', anonKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export const isSupabaseConfigured = () => Boolean(url && anonKey)
