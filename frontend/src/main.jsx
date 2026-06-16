import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import SentryErrorBoundary from './components/SentryErrorBoundary.jsx'

// ── Sentry init ──────────────────────────────────────────────
// DSN opsional. Jika tidak diset (dev tanpa akses Sentry), lewati init.
// Production wajib set VITE_SENTRY_DSN di Vercel env.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.2,
    beforeSend(event) {
      // Jangan kirim event di mode development jika DSN explicit test.
      if (import.meta.env.DEV && !SENTRY_DSN) return null
      return event
    },
  })
  console.info('[sentry] initialized in', import.meta.env.MODE, 'mode')
} else {
  console.warn('[sentry] VITE_SENTRY_DSN kosong — Sentry di-skip (mode dev OK, prod WAJIB set).')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SentryErrorBoundary>
      <App />
    </SentryErrorBoundary>
  </StrictMode>
)
