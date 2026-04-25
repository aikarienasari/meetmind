import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#f0f4fa', minHeight: '100vh', color: '#333' }}>

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', background: '#f0f4fa', position: 'sticky', top: 0, zIndex: 100
      }}>
        <span style={{ fontWeight: 700, fontSize: 20, color: '#1a73e8' }}>MeetMind</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#" style={{ color: '#555', textDecoration: 'none', fontSize: 15 }}>About Us</a>
          <a href="#" style={{ color: '#555', textDecoration: 'none', fontSize: 15 }}>Contact</a>
          {localStorage.getItem('token') ? (
            <>
              <button style={{
                padding: '8px 22px', borderRadius: 20, border: 'none',
                background: '#1a73e8', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}
              onClick={() => navigate('/meetings')}>Go to Meetings</button>
              <button style={{
                padding: '8px 22px', borderRadius: 20, border: '2px solid #e74c3c',
                background: 'transparent', color: '#e74c3c', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                window.location.reload();
              }}>Sign Out</button>
            </>
          ) : (
            <>
              <button style={{
                padding: '8px 22px', borderRadius: 20, border: '2px solid #1a73e8',
                background: 'transparent', color: '#1a73e8', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}
              onClick={() => navigate('/login')}>Sign In</button>
              <button style={{
                padding: '8px 22px', borderRadius: 20, border: 'none',
                background: '#1a73e8', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}
              onClick={() => navigate('/register')}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '48px 40px 40px', maxWidth: 900, margin: '0 auto'
      }}>
        <div style={{ flex: 1, paddingRight: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1a3c6e', lineHeight: 1.3, marginBottom: 16 }}>
            Temukan potensi penuh setiap percakapan saat ide terhubung otomatis
          </h1>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>
            MeetMind hadir untuk memastikan tidak ada detail yang terlewat. Dari transkripsi real-time hingga analisis teks otomatis yang mendalam, kami membantu Anda fokus pada diskusi, kami menangani dokumentasinya.
          </p>
        </div>
        <div style={{ flexShrink: 0, width: 200, height: 180, background: 'linear-gradient(135deg,#e0eaff,#c9daf8)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Brain/AI illustration placeholder */}
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="56" fill="#c2d4f8" />
            <ellipse cx="60" cy="62" rx="32" ry="28" fill="#1a73e8" opacity="0.15"/>
            <path d="M36 58 Q42 38 60 38 Q78 38 84 58 Q90 78 60 86 Q30 78 36 58Z" fill="#1a73e8" opacity="0.25"/>
            <circle cx="60" cy="60" r="14" fill="#1a73e8" opacity="0.5"/>
            {/* sound wave lines */}
            <line x1="94" y1="45" x2="106" y2="45" stroke="#1a73e8" strokeWidth="3" strokeLinecap="round"/>
            <line x1="96" y1="55" x2="110" y2="55" stroke="#1a73e8" strokeWidth="3" strokeLinecap="round"/>
            <line x1="94" y1="65" x2="108" y2="65" stroke="#1a73e8" strokeWidth="3" strokeLinecap="round"/>
            <line x1="96" y1="75" x2="106" y2="75" stroke="#1a73e8" strokeWidth="3" strokeLinecap="round"/>
            {/* chat bubble */}
            <rect x="50" y="22" width="28" height="18" rx="8" fill="#1a73e8" opacity="0.7"/>
            <circle cx="57" cy="31" r="2" fill="white"/>
            <circle cx="64" cy="31" r="2" fill="white"/>
            <circle cx="71" cy="31" r="2" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Image Gallery Row */}
      <section style={{ padding: '0 40px 48px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Rooms', bg: '#b0c4de' },
            { label: 'Virtual Agent', bg: '#8fa8d4' },
            { label: 'Clips', bg: '#a0b8d8' },
            { label: 'Phone', bg: '#90a8c8' },
          ].map((item, i) => (
            <div key={i} style={{
              height: 160, borderRadius: 12, background: item.bg,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
              padding: 10, overflow: 'hidden', position: 'relative'
            }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,0.35)',
                padding: '2px 8px', borderRadius: 10, alignSelf: 'flex-start'
              }}>{item.label}</span>
              {/* Decorative person silhouette */}
              <div style={{
                position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: 60, height: 90, background: 'rgba(255,255,255,0.15)', borderRadius: '50% 50% 0 0'
              }}/>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #3a6fd8, #1a3c8e)',
        padding: '48px 40px', textAlign: 'center', color: '#fff'
      }}>
        <p style={{ fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, opacity: 0.8 }}>MeetMind</p>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
          See what MeetMind can do for your business
        </h2>
        <button style={{
          padding: '12px 36px', borderRadius: 30, border: '2px solid #fff',
          background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 16,
          cursor: 'pointer', letterSpacing: 0.5
        }} onClick={()=>navigate('/meetings')}>
          Start Meeting!
        </button>
      </section>

      {/* Feature Cards */}
      <section style={{ padding: '48px 40px', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Card 1 - Real-Time Transcription */}
        <div style={{
          background: '#e8eef8', borderRadius: 16, padding: '24px 28px',
          display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a73e8', marginBottom: 8 }}>Real-Time Meeting Transcription</h3>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7 }}>
              MeetMind secara otomatis mengubah percakapan rapat menjadi teks secara real-time dengan akurasi tinggi. Tim tidak perlu lagi mencatat manual karena semua diskusi langsung terdokumentasi selama rapat berlangsung.
            </p>
          </div>
          <div style={{
            width: 130, height: 100, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #c5d8f8, #a8c4f0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}>
            {/* Illustration placeholder */}
            <svg width="80" height="70" viewBox="0 0 80 70" fill="none">
              <rect x="10" y="15" width="60" height="40" rx="8" fill="#1a73e8" opacity="0.2"/>
              <rect x="18" y="25" width="40" height="3" rx="2" fill="#1a73e8" opacity="0.6"/>
              <rect x="18" y="32" width="30" height="3" rx="2" fill="#1a73e8" opacity="0.5"/>
              <rect x="18" y="39" width="35" height="3" rx="2" fill="#1a73e8" opacity="0.4"/>
              <circle cx="60" cy="20" r="10" fill="#1a73e8" opacity="0.3"/>
              <circle cx="55" cy="55" r="8" fill="#4a90d9" opacity="0.4"/>
            </svg>
          </div>
        </div>

        {/* Card 2 - AI Summary */}
        <div style={{
          background: '#e8eef8', borderRadius: 16, padding: '24px 28px',
          display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: 130, height: 100, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #b8d0f0, #95b8e8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}>
            <svg width="80" height="70" viewBox="0 0 80 70" fill="none">
              <ellipse cx="40" cy="35" rx="28" ry="22" fill="#1a73e8" opacity="0.15"/>
              <circle cx="30" cy="30" r="8" fill="#4a90d9" opacity="0.4"/>
              <circle cx="50" cy="38" r="10" fill="#1a73e8" opacity="0.3"/>
              <path d="M20 50 Q40 42 60 50" stroke="#1a73e8" strokeWidth="2" opacity="0.5" fill="none"/>
              <rect x="32" y="20" width="20" height="4" rx="2" fill="#1a73e8" opacity="0.5"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a73e8', marginBottom: 8 }}>AI Smart Meeting Summary</h3>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7 }}>
              Setelah rapat selesai, MeetMind langsung menghasilkan ringkasan rapat yang jelas dan terstruktur menggunakan AI. Hal ini membantu tim memahami poin penting dengan cepat tanpa harus membaca seluruh transkrip rapat.
            </p>
          </div>
        </div>

        {/* Card 3 - Action Items */}
        <div style={{
          background: '#e8eef8', borderRadius: 16, padding: '24px 28px',
          display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a73e8', marginBottom: 8 }}>Automatic Action Items Tracking</h3>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7 }}>
              MeetMind secara otomatis mengekstrak tugas dan langkah selanjutnya (action items) dari hasil rapat. Dengan begitu setiap anggota tim tahu apa yang harus dikerjakan setelah meeting, sehingga rapat tidak berhenti hanya pada diskusi.
            </p>
          </div>
          <div style={{
            width: 130, height: 100, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #c8d8f8, #a0bcec)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}>
            <svg width="80" height="70" viewBox="0 0 80 70" fill="none">
              <circle cx="40" cy="35" r="22" fill="#1a73e8" opacity="0.15"/>
              <circle cx="40" cy="35" r="14" fill="#1a73e8" opacity="0.2"/>
              <path d="M30 35 L37 42 L52 28" stroke="#1a73e8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" fill="none"/>
              <circle cx="60" cy="20" r="6" fill="#4a90d9" opacity="0.35"/>
              <circle cx="18" cy="50" r="5" fill="#4a90d9" opacity="0.3"/>
            </svg>
          </div>
        </div>

      </section>
    </div>
  );
}