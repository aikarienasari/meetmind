import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    '[supabaseClient] VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diset. ' +
      'Fitur profil & reset password tidak akan berfungsi sampai env diisi.'
  )
}

const notConfiguredError = () => ({
  data: null,
  error: new Error('Supabase belum dikonfigurasi'),
})

const fallbackSupabase = {
  auth: {
    resetPasswordForEmail: async () => notConfiguredError(),
    updateUser: async () => notConfiguredError(),
    getSession: async () => notConfiguredError(),
    signOut: async () => notConfiguredError(),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }),
  },
}

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : fallbackSupabase

export const isSupabaseConfigured = () => Boolean(url && anonKey)
