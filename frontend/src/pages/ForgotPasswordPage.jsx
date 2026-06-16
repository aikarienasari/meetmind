import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../services/supabaseClient'
import { container, backBtn, card, title, btn } from '../styles/authStyles'
import { Input } from '../components/auth/Input'

/**
 * Halaman Forgot Password.
 *
 * Backend tidak punya endpoint ini, jadi FE memakai Supabase auth langsung:
 *   supabase.auth.resetPasswordForEmail(email, { redirectTo })
 *
 * Supabase akan mengirim email berisi link ke {origin}/reset-password
 * dengan token recovery. User klik → masuk ke ResetPasswordPage.
 *
 * Catatan: Supabase project harus dikonfigurasi agar allow redirect URL
 * {origin}/reset-password di Auth → URL Configuration → Redirect URLs.
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      toast.error('Email tidak valid')
      return
    }
    if (!isSupabaseConfigured()) {
      toast.error(
        'Supabase belum dikonfigurasi di FE. Hubungi admin untuk set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY.'
      )
      return
    }

    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (error) throw error
      setSent(true)
      toast.success('Email reset password telah dikirim')
    } catch (err) {
      console.error('[forgotPassword]', err)
      toast.error(err.message || 'Gagal mengirim email reset')
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
        <h2 style={title}>LUPA PASSWORD</h2>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
              Kami telah mengirim link reset password ke <strong>{email}</strong>.
              Cek inbox (dan folder spam) untuk melanjutkan.
            </p>
            <button style={btn} onClick={() => navigate('/login')}>
              Kembali ke Login
            </button>
          </div>
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
              Masukkan email akun Anda. Kami akan mengirim link untuk reset password.
            </p>
            <Input
              label="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
            />
            <button disabled={loading} style={btn} onClick={handleSubmit}>
              {loading ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
