# 🧠 MeetMind

> AI-powered meeting assistant — rekam, transkripsi, dan analisis rapat secara otomatis.

MeetMind adalah aplikasi web PWA yang membantu tim merekam jalannya rapat, menghasilkan transkripsi real-time, lalu menganalisisnya menggunakan AI untuk menghasilkan ringkasan, rekomendasi, dan action items secara otomatis.

---

## 📋 Tech Stack

### Frontend
| Layer | Teknologi |
|-------|-----------|
| Framework | [Vite.js](https://vitejs.dev/) + [React](https://react.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Auth Client | [Supabase Auth](https://supabase.com/docs/guides/auth) |
| HTTP Client | [Axios](https://axios-http.com/) |
| Routing | [React Router DOM](https://reactrouter.com/) |
| Target | PWA (Progressive Web App) |

### Backend
| Layer | Teknologi |
|-------|-----------|
| AI / Analisis | [Google Gemini](https://ai.google.dev/) |
| Database & Auth | [Supabase](https://supabase.com/) (PostgreSQL) |
| Hosting BE | [Railway](https://railway.app/) |
| Real-time Transcription | WebSocket |

---

## 🔗 API Endpoints

```
REST API  : https://meeting-ai-backend-production-b61e.up.railway.app
WebSocket : wss://meeting-ai-backend-production-b61e.up.railway.app
```

---

## 🚀 Cara Menjalankan (Frontend)

### Prerequisites
- Node.js >= 18
- npm >= 9

### 1. Clone Repository

```bash
git clone https://github.com/<your-username>/meetmind.git
cd meetmind
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di root project:

```env
VITE_API_URL=https://meeting-ai-backend-production-b61e.up.railway.app
VITE_WS_URL=wss://meeting-ai-backend-production-b61e.up.railway.app
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> ⚠️ Semua variabel environment Vite **wajib** menggunakan prefix `VITE_` agar dapat diakses di browser.

### 4. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`.

### 5. Build untuk Production

```bash
npm run build
npm run preview
```

---

## 📁 Struktur Folder

```
src/
├── api/
│   ├── client.js           ← Axios instance
│   └── meetings.js         ← Semua API calls ke backend
├── hooks/
│   ├── useAuth.js          ← Supabase auth hook
│   └── useRecording.js     ← WebSocket + MediaRecorder
├── lib/
│   └── supabase.js         ← Supabase client init
├── pages/
│   ├── LoginPage.jsx
│   ├── HomePage.jsx
│   ├── RecordPage.jsx
│   └── HistoryPage.jsx
├── components/
│   ├── ProtectedRoute.jsx  ← Redirect jika belum login
│   ├── MeetingCard.jsx
│   └── MeetingDetail.jsx
├── App.jsx
└── main.jsx
```

---

## 🔄 Alur Aplikasi

```
1. User buka app      → Cek Supabase Auth session
2. Belum login        → Redirect ke /login
3. Login berhasil     → Supabase memberikan user.id (UUID)
4. Mulai Rapat        → POST /api/v1/meetings/ dengan user_id
5. Backend simpan     → Return meeting_id
6. Connect WebSocket  → Stream audio real-time
7. Stop rekaman       → Backend kirim full_transcript
8. AI analisis        → POST /api/v1/meetings/{id}/finish
9. Tampilkan hasil    → Summary + rekomendasi + action items
10. History           → GET /api/v1/meetings/user/{user_id}
```

---

## 👥 Tim Pengembang

| Role | Nama |
|------|------|
| Project Manager | Ramadan |
| UI/UX Designer | Zalfa |
| Frontend Developer | Sayyid & Aika |
| Backend AI | Raka |
| Backend Database | Rakhly |
| QA Engineer | Riana |

---

## 📅 Fase Pengerjaan

| Fase | Deskripsi |
|------|-----------|
| **Fase 1** | Perancangan project |
| **Fase 2** | Desain UI/UX, setup backend, koordinasi QA & PM |
| **Fase 3** | Integrasi UI/UX oleh frontend developer |
| **Fase 4** | Testing oleh QA |

---

## 🛠️ Tools Kolaborasi

- **ClickUp** — manajemen tugas dan sprint
- **WhatsApp** — komunikasi urgent & pengumuman meet

---

## 📄 Lisensi

MIT License — lihat [LICENSE](./LICENSE) untuk detail.