import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../services/supabaseClient'
import { container, backBtn, card, title, btn } from '../styles/authStyles'
import { Input } from '../components/auth/Input'

/**
 * Halaman Reset Password (tujuan dari link email Supabase).
 *
 * Saat user klik link di email, Supabase mengarahkan ke:
 *   {origin}/reset-password?...[tokens / type=recovery]
 *
 * Supabase JS auto-parse hash & query, lalu menyetel sesi sementara.
 * Setelah itu kita panggil supabase.auth.updateUser({ password }).
 *
 * Backend tidak terlibat — flow ini sepenuhnya via Supabase auth client.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  // Supabase mengembalikan token recovery via hash (#access_token=...).
  // detectImplicitFlow akan menyetel session otomatis. Kita tunggu event.
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError('Supabase belum dikonfigurasi.')
      return
    }

    let unsub = () => {}

    // Cek session awal — kalau sudah ada (link tipe code), pakai langsung.
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        setReady(true)
      }
    })

    // Dengari SIGNED_IN / PASSWORD_RECOVERY untuk implicit flow.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (session) setReady(true)
      }
    })
    unsub = () => listener.subscription.unsubscribe()

    // Timeout fallback — kalau setelah 8 detik belum dapat session, tetap
    // izinkan user submit (supabase.auth.updateUser mungkin bisa pakai PKCE).
    const t = setTimeout(() => setReady(true), 8000)
    return () => {
      unsub()
      clearTimeout(t)
    }
  }, [params])

  const handleSubmit = async () => {
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    if (password !== confirm) {
      toast.error('Password dan konfirmasi tidak cocok')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password berhasil direset. Silakan login.')
      // Bersihkan session recovery agar user harus login ulang.
      await supabase.auth.signOut()
      navigate('/login')
    } catch (err) {
      console.error('[resetPassword]', err)
      toast.error(err.message || 'Gagal reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={container}>
      <div onClick={() => navigate('/login')} style={backBtn}>
        ←
      </div>

      <div style={card}>
        <h2 style={title}>RESET PASSWORD</h2>

        {error ? (
          <p style={{ color: '#e74c3c', fontSize: 13, lineHeight: 1.6 }}>{error}</p>
        ) : (
          <>
            <p
              style={{
                fontSize: 13,
                color: '#555',
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              Masukkan password baru untuk akun Anda.
            </p>
            <Input
              label="password baru"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="konfirmasi password"
              type="password"
              name="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button
              disabled={loading || !ready}
              style={{ ...btn, opacity: ready ? 1 : 0.6 }}
              onClick={handleSubmit}
            >
              {loading ? 'Menyimpan...' : ready ? 'Reset Password' : 'Menyiapkan...'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
