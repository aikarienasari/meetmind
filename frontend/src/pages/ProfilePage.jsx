import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import {
  getProfile,
  updateDisplayName,
  uploadAvatar,
  setNotifications,
} from '../services/profileService'
import { container, backBtn, card, title, btn, inputStyle, labelStyle } from '../styles/authStyles'

/**
 * Halaman Profil.
 *
 * Kebutuhan (3.27):
 *  - Edit nama (full_name)           → profileService.updateDisplayName
 *  - Upload foto ke Supabase Storage → profileService.uploadAvatar
 *  - Toggle notifikasi               → profileService.setNotifications
 *
 * Tombol "Tes Sentry" di footer memenuhi deliverable 4.01 (capture test error).
 */
export default function ProfilePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingNotif, setSavingNotif] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState('')

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const data = await getProfile()
      setProfile(data)
      setFullName(data.full_name || '')
      setNotifEnabled(data.notifications_enabled ?? true)
      setAvatarUrl(data.avatar_url || '')
    } catch (err) {
      console.error('[profile]', err)
      toast.error(err.message || 'Gagal memuat profil')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }
    setSavingName(true)
    try {
      await updateDisplayName(fullName.trim())
      toast.success('Nama berhasil disimpan')
      setProfile((p) => ({ ...p, full_name: fullName.trim() }))
    } catch (err) {
      console.error('[profile.saveName]', err)
      toast.error(err.message || 'Gagal menyimpan nama')
    } finally {
      setSavingName(false)
    }
  }

  const handleToggleNotif = async (next) => {
    setNotifEnabled(next)
    setSavingNotif(true)
    try {
      await setNotifications(next)
      toast.success(next ? 'Notifikasi diaktifkan' : 'Notifikasi dinonaktifkan')
    } catch (err) {
      console.error('[profile.toggleNotif]', err)
      // Rollback UI
      setNotifEnabled(!next)
      toast.error(err.message || 'Gagal mengubah notifikasi')
    } finally {
      setSavingNotif(false)
    }
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 2MB')
      return
    }

    setUploadingPhoto(true)
    try {
      const url = await uploadAvatar(file)
      setAvatarUrl(url)
      setProfile((p) => ({ ...p, avatar_url: url }))
      toast.success('Foto profil berhasil diunggah')
    } catch (err) {
      console.error('[profile.photo]', err)
      toast.error(err.message || 'Gagal upload foto')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleTestSentry = () => {
    try {
      throw new Error('[TEST] Sentry test exception dari ProfilePage')
    } catch (err) {
      Sentry.captureException(err)
      toast.success('Test error dikirim ke Sentry (cek dashboard Sentry).')
    }
  }

  if (loading) {
    return (
      <div style={container}>
        <div style={card}>
          <p style={{ color: '#555' }}>Memuat profil...</p>
        </div>
      </div>
    )
  }

  const emailInitial = (profile?.email || '?')[0]?.toUpperCase() || '?'

  return (
    <div style={{ ...container, alignItems: 'flex-start', paddingTop: 40 }}>
      <div onClick={() => navigate('/meetings')} style={backBtn}>
        ←
      </div>

      <div style={{ ...card, width: 420, margin: '0 auto' }}>
        <h2 style={title}>PROFIL</h2>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: avatarUrl
                ? `#e1e8f5`
                : 'linear-gradient(135deg, #1a73e8, #1557b0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 36,
              fontWeight: 700,
              overflow: 'hidden',
              border: '3px solid #1a73e8',
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              emailInitial
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            style={{
              padding: '6px 18px',
              borderRadius: 20,
              border: '2px solid #1a73e8',
              background: 'transparent',
              color: '#1a73e8',
              fontWeight: 600,
              fontSize: 12,
              cursor: uploadingPhoto ? 'wait' : 'pointer',
              opacity: uploadingPhoto ? 0.6 : 1,
            }}
          >
            {uploadingPhoto ? 'Mengunggah...' : 'Ganti Foto'}
          </button>
        </div>

        {/* Email (read-only) */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>email:</label>
          <input
            value={profile?.email || ''}
            readOnly
            style={{ ...inputStyle, background: '#eef2f7', color: '#888', cursor: 'not-allowed' }}
          />
        </div>

        {/* Edit Nama */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>nama:</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={inputStyle}
            placeholder="Nama tampilan"
          />
        </div>
        <button
          onClick={handleSaveName}
          disabled={savingName}
          style={{ ...btn, marginTop: 0, marginBottom: 20 }}
        >
          {savingName ? 'Menyimpan...' : 'Simpan Nama'}
        </button>

        {/* Toggle Notifikasi */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            border: '1px solid #e1e8f5',
            borderRadius: 8,
            background: '#f8fafc',
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Notifikasi Email</div>
            <div style={{ fontSize: 11, color: '#888' }}>
              {savingNotif ? 'Menyimpan...' : 'Aktifkan ringkasan rapat via email'}
            </div>
          </div>
          <label
            style={{
              position: 'relative',
              display: 'inline-block',
              width: 44,
              height: 24,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={notifEnabled}
              onChange={(e) => handleToggleNotif(e.target.checked)}
              disabled={savingNotif}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                inset: 0,
                background: notifEnabled ? '#1a73e8' : '#c8d6e8',
                borderRadius: 24,
                transition: '0.2s',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: notifEnabled ? 23 : 3,
                width: 18,
                height: 18,
                background: '#fff',
                borderRadius: '50%',
                transition: '0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </label>
        </div>

        {/* Tombol Test Sentry (deliverable 4.01) */}
        <button
          onClick={handleTestSentry}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px dashed #c8d6e8',
            background: 'transparent',
            color: '#888',
            fontSize: 11,
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          Kirim test error ke Sentry (dev only)
        </button>
      </div>
    </div>
  )
}
