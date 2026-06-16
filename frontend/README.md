# MeetMind Frontend

Antarmuka web untuk **MeetMind** — aplikasi rekaman meeting yang otomatis
mentranskripsi audio, merangkum diskusi, dan menghasilkan action items &
rekomendasi dengan bantuan AI.

Dibangun dengan **React 19 + Vite**, terhubung ke backend FastAPI
(repositori `FastAPI-TTS-Summary-AI`) dan Supabase sebagai Auth + Storage.

---

## Fitur

- **Autentikasi** — Registrasi, login, lupa password, reset password
  (Supabase Auth + GoTrue)
- **Rekaman Meeting** — Capture audio via WebSocket, transkripsi otomatis
- **Riwayat Meeting** — Daftar semua meeting yang pernah direkam
- **AI Panel** — Ringkasan, action items, dan rekomendasi dari transkrip
- **Edit Transkrip Inline** — Perbaiki hasil transkripsi langsung di UI
  dengan auto-save
- **Regenerasi Summary** — Minta AI membuat ulang ringkasan (batas 3× per
  meeting, disimpan di localStorage)
- **Export PDF & DOCX** — Unduh hasil meeting dalam format Ringkas atau
  Lengkap (lazy-loaded untuk bundle size optimal)
- **Profil Pengguna** — Edit nama, upload foto (bucket Supabase Storage),
  toggle notifikasi
- **Landing Page** — Halaman publik responsif untuk pengunjung
- **Sentry Error Monitoring** — Pelacakan error otomatis (opsional via DSN)

---

## Tech Stack

| Area            | Library                          |
| --------------- | -------------------------------- |
| Framework       | React 19                         |
| Build tool      | Vite 8 (rolldown)                |
| Routing         | react-router-dom 7               |
| State           | zustand 5                        |
| Auth & Storage  | @supabase/supabase-js 2          |
| Error tracking  | @sentry/react 10                 |
| Export          | jspdf + docx                     |
| Styling         | Tailwind CSS + inline styles     |
| Toast           | react-toastify 11                |

---

## Struktur Proyek

```
src/
├── main.jsx                      # Entry, Sentry init, ErrorBoundary wrap
├── App.jsx                       # Routing
├── index.css
│
├── pages/                        # Halaman (route-level)
│   ├── HomePage.jsx              # Landing page wrapper
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── ForgotPasswordPage.jsx    # Kirim email reset
│   ├── ResetPasswordPage.jsx     # Set password baru dari link email
│   ├── MeetingsPage.jsx          # Rekaman + riwayat
│   ├── ProfilePage.jsx           # Profil + tombol Test Sentry
│   └── NotFoundPage.jsx
│
├── components/
│   ├── LandingPage.jsx           # Landing publik (responsif)
│   ├── MeetingsSubComps.jsx      # AIPanel: edit transkrip, regen, export
│   ├── MeetingHistory.jsx        # Daftar riwayat
│   ├── ExportModal.jsx           # Modal pilihan export (lazy-loaded)
│   ├── SentryErrorBoundary.jsx   # Wrapper Sentry.ErrorBoundary
│   ├── ProtectedRoute.jsx        # Guard route butuh login
│   └── auth/                     # LoginForm, RegisterForm, Input, GoogleButton
│
├── services/                     # API layer (pure functions, fetch-based)
│   ├── authService.js            # /auth/signup, /auth/login → localStorage
│   ├── meetingService.js         # /meetings/{id} GET/PATCH + regen counter
│   ├── profileService.js         # Supabase user metadata + Storage upload
│   ├── exportService.js          # jsPDF + docx generators
│   └── supabaseClient.js         # Singleton client untuk Forgot/Reset
│
├── hooks/
│   └── useWebSocketRecorder.js   # Capture + stream audio ke backend
│
├── styles/
│   └── authStyles.js             # Shared style objects untuk auth pages
│
└── utils/
```

---

## Persiapan Lokal

### Prasyarat

- Node.js ≥ 20
- Backend FastAPI berjalan (lihat `FastAPI-TTS-Summary-AI/README.md`)
- Supabase project dengan tabel `meetings` + bucket Storage `avatars`
  (skema ada di `FastAPI-TTS-Summary-AI/supabase_schema.sql`)

### Install & Run

```bash
# 1. Install dependency
npm install

# 2. Salin env template
cp .env.example .env

# 3. Isi nilai di .env (lihat tabel di bawah)

# 4. Jalankan dev server
npm run dev        # http://localhost:5173

# 5. Build production
npm run build      # output ke dist/

# 6. Preview build production
npm run preview
```

### Catatan untuk WSL / Linux

Jika `npm install` dijalankan di Windows lalu `npm run dev` di WSL
(atau sebaliknya), Vite bisa gagal load binding native rolldown
(`Cannot find module '@rolldown/binding-linux-x64-gnu'`).

Solusi: hapus `node_modules` dan jalankan `npm install` ulang dari
environment yang sama dengan yang dipakai untuk `npm run dev`.

---

## Environment Variables

Semua env yang dipakai Vite harus berawalan `VITE_`. Lihat `.env.example`
untuk template lengkap.

| Variable                  | Wajib | Deskripsi                                              |
| ------------------------- | :---: | ------------------------------------------------------ |
| `VITE_BACKEND_URL`        |  ✅   | URL backend FastAPI (dev: `http://localhost:8000`)     |
| `VITE_WS_URL`             |  ✅   | URL WebSocket backend (dev: `ws://localhost:8000`)     |
| `VITE_API_KEY`            |  ✅   | X-API-Key untuk endpoint backend (sama dengan `API_KEYS` di backend) |
| `VITE_SUPABASE_URL`       |  ✅*  | Project URL Supabase. *Wajib untuk Profil & Reset Password |
| `VITE_SUPABASE_ANON_KEY`  |  ✅*  | Anon key Supabase. *Wajib untuk Profil & Reset Password |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️  | Service role key (tidak diekspos ke client via VITE_)  |
| `VITE_SENTRY_DSN`         |  ❌   | DSN Sentry. Kosongkan di dev untuk skip init           |

> **Penting:** Jangan commit file `.env` yang berisi nilai asli.
> Hanya `.env.example` yang aman di-commit.

---

## Konvensi Kode

### Services (`src/services/`)

Setiap service adalah kumpulan *pure async function* yang membungkus `fetch`
atau Supabase client. Tidak menyimpan state — komponen yang memanggil yang
bertanggung jawab menyimpan hasil di state sendiri.

Pola umum:

```javascript
const BASE_URL = import.meta.env.VITE_BACKEND_URL
const API_KEY  = import.meta.env.VITE_API_KEY

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: localStorage.getItem('token') ? `Bearer ${...}` : '',
  'X-API-Key': API_KEY,
})

export const getSomething = async (id) => {
  const res = await fetch(`${BASE_URL}/api/v1/something/${id}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(/* ... */)
  return res.json()
}
```

### Auth & Token

Backend `/auth/login` hanya mengembalikan `access_token` (tanpa
`refresh_token`). Token disimpan di `localStorage('token')` dan dipasang
sebagai `Authorization: Bearer <token>` di setiap request.

Karena Supabase JS SDK v2 membutuhkan session (refresh_token) untuk
`auth.updateUser()`, modul `profileService.js` mengakali ini dengan:

1. Membuat Supabase client per-request dengan header `Authorization` global.
2. Memakai `auth.getUser(jwt)` dengan JWT eksplisit (bypass session check).
3. Untuk update `user_metadata`, langsung `PUT /auth/v1/user` lewat HTTP
   mentah (Storage API juga respect header Authorization global).

Detail lengkap ada di komentar header `src/services/profileService.js`.

### Regenerasi Summary — Counter Limit

Batas 3× regenerasi per meeting tidak disimpan di backend, melainkan di
`localStorage` dengan key `regen_count:{meetingId}`. Fungsi helper ada di
`src/services/meetingService.js` (`getRegenCount`, `bumpRegenCount`,
`canRegenerate`).

### Code Splitting

`ExportModal.jsx` di-lazy-load dengan `React.lazy()` supaya library berat
(jsPDF, docx) tidak masuk main bundle. Prefetch terjadi saat tombol Export
diklik untuk pertama kalinya.

---

## Deployment

Target production: **Vercel**.

1. Push repository ke GitHub.
2. Import project di Vercel, set root directory ke `frontend/`.
3. Tambahkan semua env dari `.env.example` di **Project Settings →
   Environment Variables** (gunakan nilai production).
4. Build command default (`npm run build`) dan output dir (`dist/`) sudah
   cocok — tidak perlu override.
5. Set `VITE_SENTRY_DSN` dengan DSN project Sentry Anda untuk mulai
   menerima error report dari production.

---

## Tugas FE-1 yang Diimplementasi

| ID    | Fitur                          | Lokasi Utama                                    |
| ----- | ------------------------------ | ----------------------------------------------- |
| 3.19  | Edit Transkrip Inline          | `components/MeetingsSubComps.jsx` (AIPanel)     |
| 3.25  | Export PDF & DOCX              | `components/ExportModal.jsx`, `services/exportService.js` |
| 3.26  | Regenerasi Summary             | `components/MeetingsSubComps.jsx`, `services/meetingService.js` |
| 3.27  | Halaman Profil                 | `pages/ProfilePage.jsx`, `services/profileService.js` |
| 3.29  | Landing Page                   | `components/LandingPage.jsx`                    |
| 3.30  | Reset Password Flow            | `pages/ForgotPasswordPage.jsx`, `pages/ResetPasswordPage.jsx` |
| 4.01  | Sentry Error Monitoring        | `main.jsx`, `components/SentryErrorBoundary.jsx` |
| 4.03  | Deploy Production (Vercel)     | Konfigurasi di dashboard Vercel + `.env.example` |

---

## Troubleshooting

### `403 Forbidden` saat login

Backend menolak `X-API-Key`. Pastikan nilai `VITE_API_KEY` di `.env` sama
dengan salah satu nilai di `API_KEYS` backend.

### `401 Unauthorized` saat login

User belum terdaftar di Supabase project yang aktif. Daftarkan akun baru
melalui halaman `/register` atau aktifkan email confirmation di Supabase
Dashboard jika perlu.

### `Auth session missing!` di halaman Profil

Terjadi bila `profileService.js` mencoba memakai `auth.updateUser()` tanpa
session aktif. Sudah ditangani dengan raw HTTP PUT ke `/auth/v1/user` —
pastikan Anda memakai versi terbaru file ini.

### Build gagal: `Cannot find module '@rolldown/binding-...'`

Binding native Vite tidak cocok dengan platform. Hapus `node_modules/` dan
jalankan `npm install` ulang dari OS yang sama dengan yang menjalankan
`npm run dev`.

---

## Lisensi

Internal — bagian dari proyek PPL MeetMind.
