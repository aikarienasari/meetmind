/**
 * Profile Service
 *
 * Menggunakan Supabase client langsung karena backend tidak menyediakan endpoint
 * profil/reset-password. Operasi:
 *   - getProfile        → baca user + user_metadata
 *   - updateDisplayName → update user_metadata.full_name
 *   - uploadAvatar      → upload ke bucket 'avatars' + set user_metadata.avatar_url
 *   - setNotifications  → update user_metadata.notifications_enabled
 *
 * ── Catatan penting soal sesi ────────────────────────────────────
 * Backend /auth/login hanya mengembalikan access_token (tanpa refresh_token).
 * Supabase JS v2 butuh refresh_token valid untuk setSession → auth.updateUser
 * akan throw "Auth session missing!" kalau session belum ada.
 *
 * Workaround di service ini:
 *   - getProfile: pakai auth.getUser(jwt) dengan token eksplisit (bypass session)
 *   - updateUser*: pakai raw HTTP PUT ke /auth/v1/user dengan header Authorization
 *   - storage upload: pakai client dengan global Authorization header (Storage
 *     API respect header ini, tidak butuh session GoTrue)
 */
import { createClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from './supabaseClient'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const AVATAR_BUCKET = 'avatars'

const getAccessToken = () => {
  const t = localStorage.getItem('token')
  if (!t) throw new Error('Belum login. Token tidak ditemukan.')
  return t
}

/**
 * Buat client Supabase satu kali per-request dengan Authorization header
 * global. Semua request (storage, auth.getUser bila dipanggil dengan jwt)
 * otomatis authenticated dengan token user.
 *
 * Tidak menggunakan session GoTrue (persistSession:false) — kita 100%
 * authorization-header based.
 */
const userClient = () => {
  const access_token = getAccessToken()
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

/**
 * Raw HTTP call ke endpoint GoTrue untuk update user_metadata.
 * Dipakai karena auth.updateUser() SDK butuh session aktif (yang tidak bisa
 * kita bentuk tanpa refresh_token).
 *
 * Endpoint: PUT {SUPABASE_URL}/auth/v1/user
 * Headers : Authorization Bearer + apikey (anon key)
 * Body    : { data: { ...metadata } }   ← "data" = user_metadata
 */
const rawUpdateUserMetadata = async (metadata) => {
  const access_token = getAccessToken()
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: metadata }),
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const body = await res.json()
      msg = body?.msg || body?.message || body?.error_description || msg
    } catch (_) {
      /* ignore parse error */
    }
    throw new Error(msg)
  }
  return res.json()
}

/**
 * Ambil user saat ini + metadata.
 */
export const getProfile = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase belum dikonfigurasi. Cek VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY.')
  }
  const access_token = getAccessToken()
  const client = userClient()

  // getUser(jwt) — oper token eksplisit, bypass session check.
  const { data, error } = await client.auth.getUser(access_token)
  if (error) throw new Error('Gagal mengambil profil: ' + error.message)

  const user = data?.user
  if (!user) throw new Error('User tidak ditemukan')

  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || '',
    avatar_url: user.user_metadata?.avatar_url || '',
    notifications_enabled: user.user_metadata?.notifications_enabled ?? true,
  }
}

/**
 * Update nama tampilan (disimpan di user_metadata.full_name).
 */
export const updateDisplayName = async (fullName) => {
  await rawUpdateUserMetadata({ full_name: fullName })
  // Baca ulang supaya return shape konsisten
  return getProfile()
}

/**
 * Toggle notifikasi (disimpan di user_metadata.notifications_enabled).
 */
export const setNotifications = async (enabled) => {
  await rawUpdateUserMetadata({ notifications_enabled: enabled })
  return getProfile()
}

/**
 * Upload foto profil ke bucket 'avatars/{userId}/avatar.{ext}'.
 * Storage API respect header Authorization global, jadi tidak butuh session.
 * Setelah upload, update user_metadata.avatar_url lewat raw HTTP.
 */
export const uploadAvatar = async (file) => {
  if (!file) throw new Error('File tidak boleh kosong')
  const client = userClient()
  const access_token = getAccessToken()

  // Ambil user_id lewat getUser(jwt) — tidak butuh session.
  const { data: ud, error: userErr } = await client.auth.getUser(access_token)
  if (userErr || !ud?.user) {
    throw new Error('User tidak ditemukan: ' + (userErr?.message || 'unknown'))
  }
  const userId = ud.user.id

  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  // Path pattern: {userId}/avatar.{ext} — sesuai policy RLS
  // (storage.foldername(name))[1] == auth.uid()::text
  const path = `${userId}/avatar.${ext}`

  const { error: upErr } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || `image/${ext}`,
    })
  if (upErr) {
    throw new Error('Gagal upload foto: ' + upErr.message)
  }

  const { data: pub } = client.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  const publicUrl = pub?.publicUrl
  if (!publicUrl) throw new Error('URL publik tidak tersedia setelah upload')

  // Update user_metadata.avatar_url lewat raw HTTP (bypass session).
  try {
    await rawUpdateUserMetadata({ avatar_url: publicUrl })
  } catch (err) {
    console.warn('[profileService] avatar terupload tapi metadata gagal diupdate:', err.message)
  }

  return publicUrl
}
