import React, { useState } from 'react'
import { toast } from 'react-toastify'
import * as Sentry from '@sentry/react'
import { exportPDF, exportDOCX } from '../services/exportService'

/**
 * Modal Export PDF & DOCX (task 3.25).
 *
 * Props:
 *   - open: boolean
 *   - result: object (MeetingResultResponse)
 *   - onClose: () => void
 *
 * Pilihan mode:
 *   - ringkas → hanya summary + action items + recommendations
 *   - lengkap → semua + full transcript + diarized
 */
export default function ExportModal({ open, result, onClose }) {
  const [mode, setMode] = useState('ringkas')
  const [format, setFormat] = useState('pdf')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleExport = async () => {
    if (!result) {
      toast.error('Belum ada hasil rapat untuk diekspor')
      return
    }
    setLoading(true)
    try {
      let filename
      if (format === 'pdf') {
        filename = exportPDF(result, mode)
      } else {
        filename = await exportDOCX(result, mode)
      }
      toast.success(`Berhasil download: ${filename}`)
      onClose()
    } catch (err) {
      console.error('[export]', err)
      Sentry.captureException(err)
      toast.error('Gagal membuat file: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const backdropStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,25,45,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  }
  const modalStyle = {
    background: '#fff',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
    fontFamily: "'Segoe UI', sans-serif",
  }
  const optionBtnStyle = (active) => ({
    flex: 1,
    padding: '14px 12px',
    borderRadius: 10,
    border: active ? '2px solid #1a73e8' : '2px solid #e1e8f5',
    background: active ? '#eaf1fe' : '#f8fafc',
    color: '#333',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  })

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <h3 style={{ margin: 0, color: '#1a3c6e', fontSize: 18, fontWeight: 700 }}>
            Export Hasil Rapat
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#888',
              lineHeight: 1,
            }}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        {/* Mode selection */}
        <p style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>
          KONTEN:
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setMode('ringkas')}
            style={optionBtnStyle(mode === 'ringkas')}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Ringkas</div>
            <div style={{ fontSize: 11, color: '#666' }}>
              Summary + action items + rekomendasi
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode('lengkap')}
            style={optionBtnStyle(mode === 'lengkap')}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Lengkap</div>
            <div style={{ fontSize: 11, color: '#666' }}>
              Semua + transkrip & diarization
            </div>
          </button>
        </div>

        {/* Format selection */}
        <p style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>
          FORMAT FILE:
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setFormat('pdf')}
            style={optionBtnStyle(format === 'pdf')}
          >
            <div style={{ fontWeight: 600, fontSize: 13 }}>PDF</div>
            <div style={{ fontSize: 11, color: '#666' }}>.pdf — untuk dibagikan</div>
          </button>
          <button
            type="button"
            onClick={() => setFormat('docx')}
            style={optionBtnStyle(format === 'docx')}
          >
            <div style={{ fontWeight: 600, fontSize: 13 }}>DOCX</div>
            <div style={{ fontSize: 11, color: '#666' }}>.docx — bisa diedit</div>
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              border: '1px solid #e1e8f5',
              background: '#fff',
              color: '#555',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            style={{
              flex: 2,
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              background: '#1a73e8',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Membuat file...' : `Download ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}
