import React from 'react'
import * as Sentry from '@sentry/react'

/**
 * ErrorBoundary yang otomatis mengirim exception ke Sentry + menampilkan
 * fallback UI yang ramah pengguna. Pakai @sentry/react builtin untuk
 * meminimalkan boilerplate.
 *
 * Catatan: kalau Sentry belum diinit (DSN kosong), ErrorBoundary tetap berjalan
 * dan menangkap error tapi tidak mengirim ke server Sentry.
 */
export default function SentryErrorBoundary({ children, fallback: customFallback }) {
  const fallback =
    customFallback ||
    (({ error, resetError }) => (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f4fa',
          fontFamily: "'Segoe UI', sans-serif",
          color: '#333',
          padding: 24,
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            maxWidth: 480,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid #e1e8f5',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#e74c3c', marginBottom: 12 }}>
            Terjadi kesalahan tak terduga
          </h2>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 16 }}>
            Tim sudah mendapat notifikasi otomatis. Silakan coba lagi.
          </p>
          <pre
            style={{
              background: '#f8fafc',
              padding: 12,
              borderRadius: 8,
              fontSize: 11,
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: 160,
              color: '#888',
              marginBottom: 16,
            }}
          >
            {error?.message || 'Unknown error'}
          </pre>
          <button
            onClick={resetError}
            style={{
              padding: '10px 24px',
              borderRadius: 20,
              border: 'none',
              background: '#1a73e8',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Coba lagi
          </button>
        </div>
      </div>
    ))

  return (
    <Sentry.ErrorBoundary fallback={fallback} showDialog>
      {children}
    </Sentry.ErrorBoundary>
  )
}
