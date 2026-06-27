import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const galleryCards = [
  {
    label: 'Rooms',
    title: 'Team sync',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=720&q=80',
  },
  {
    label: 'Virtual Agent',
    title: 'AI assistant',
    image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=720&q=80',
    badge: 'How can I assist you?',
  },
  {
    label: 'Clips',
    title: 'Highlights',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=720&q=80',
    focus: true,
  },
  {
    label: 'Phone',
    title: 'Mobile notes',
    image: 'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=720&q=80',
  },
];

const featureCards = [
  {
    title: 'Real-Time Meeting Transcription',
    body: 'MeetMind secara otomatis mengubah percakapan rapat menjadi teks secara real-time dengan akurasi tinggi. Tim tidak perlu lagi mencatat manual karena semua diskusi langsung terdokumentasi selama rapat berlangsung.',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=760&q=80',
  },
  {
    title: 'AI Smart Meeting Summary',
    body: 'Setelah rapat selesai, MeetMind langsung menghasilkan ringkasan rapat yang jelas dan terstruktur menggunakan AI. Hal ini membantu tim memahami poin penting dengan cepat tanpa harus membaca seluruh transkrip rapat.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=760&q=80',
    reverse: true,
  },
  {
    title: 'Automatic Action Items Tracking',
    body: 'MeetMind secara otomatis mengekstrak tugas dan langkah selanjutnya dari hasil rapat. Setiap anggota tim tahu apa yang perlu dikerjakan setelah meeting, sehingga rapat tidak berhenti hanya pada diskusi.',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=760&q=80',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const [activeGallery, setActiveGallery] = useState(1);

  const goToMeetings = () => navigate('/meetings');
  const goToAuth = (path) => navigate(path);
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const activateGallery = (index) => setActiveGallery(index);

  return (
    <div className="landing-page">
      <style>{`
        .landing-page {
          min-height: 100vh;
          color: #19456f;
          background: #5d8db7;
          font-family: "Segoe UI", Inter, Arial, sans-serif;
        }

        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(255, 247, 248, 0.9);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(35, 91, 138, 0.09);
        }

        .landing-nav-inner {
          width: min(1120px, calc(100% - 48px));
          height: 72px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .landing-logo {
          border: 0;
          padding: 0;
          background: transparent;
          color: #1f69a5;
          font-size: 18px;
          font-weight: 850;
          letter-spacing: -0.04em;
          cursor: pointer;
          transition: color 180ms ease, transform 180ms ease;
        }

        .landing-logo:hover {
          color: #145b94;
          transform: translateY(-1px);
        }

        .landing-nav-actions {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .landing-nav-link {
          color: #2c6899;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        .landing-nav-link:hover {
          color: #145b94;
        }

        .landing-nav-link {
          transition: color 180ms ease;
        }

        .landing-nav-button {
          height: 34px;
          border-radius: 999px;
          border: 0;
          color: #fff;
          background: #4f8fc3;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          padding: 0 18px;
          box-shadow: 0 8px 18px rgba(48, 112, 168, 0.16);
          transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .landing-nav-button.secondary {
          color: #2b6fa6;
          background: #e8f2fb;
          box-shadow: none;
        }

        .landing-nav-button:hover,
        .landing-primary:hover,
        .landing-outline:hover,
        .landing-start:hover {
          transform: translateY(-2px);
        }

        .landing-nav-button:hover {
          background: #3f82b8;
          box-shadow: 0 12px 22px rgba(48, 112, 168, 0.2);
        }

        .landing-nav-button.secondary:hover {
          color: #1e6399;
          background: #dcecf8;
          box-shadow: none;
        }

        .landing-hero-wrap {
          background:
            linear-gradient(180deg, #fff7f8 0%, #fff7f8 72%, #d8e8f5 100%);
        }

        .landing-hero {
          width: min(1120px, calc(100% - 48px));
          min-height: 520px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 390px;
          align-items: center;
          gap: 56px;
          padding: 56px 0 44px;
          box-sizing: border-box;
        }

        .landing-hero-title {
          max-width: 590px;
          margin: 0 0 18px;
          color: #1f69a5;
          font-size: clamp(36px, 5vw, 58px);
          line-height: 1.12;
          font-weight: 850;
          letter-spacing: 0;
        }

        .landing-hero-text {
          max-width: 610px;
          margin: 0;
          color: #346f9f;
          font-size: 17px;
          line-height: 1.8;
          font-weight: 500;
        }

        .landing-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 30px;
          flex-wrap: wrap;
        }

        .landing-primary {
          height: 44px;
          border-radius: 999px;
          border: 0;
          background: #4f8fc3;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          padding: 0 24px;
          cursor: pointer;
          box-shadow: 0 14px 26px rgba(44, 105, 157, 0.2);
          transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .landing-primary:hover {
          background: #4385ba;
          box-shadow: 0 18px 30px rgba(44, 105, 157, 0.26);
        }

        .landing-outline {
          height: 44px;
          border-radius: 999px;
          border: 2px solid #7aa8cb;
          background: transparent;
          color: #2c6f9f;
          font-size: 15px;
          font-weight: 800;
          padding: 0 22px;
          cursor: pointer;
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
        }

        .landing-outline:hover {
          border-color: #4f8fc3;
          background: rgba(79, 143, 195, 0.08);
        }

        .landing-hero-art {
          min-height: 390px;
          display: grid;
          place-items: center;
        }

        .landing-brain {
          width: min(360px, 100%);
          height: auto;
          filter: drop-shadow(0 22px 26px rgba(24, 111, 150, 0.16));
          transition: transform 260ms ease, filter 260ms ease;
        }

        .landing-hero-art:hover .landing-brain {
          transform: translateY(-6px);
          filter: drop-shadow(0 28px 30px rgba(24, 111, 150, 0.2));
        }

        .landing-media-wrap {
          background: linear-gradient(180deg, #d8e8f5 0%, #5d8db7 22%, #5d8db7 100%);
          padding: 18px 0 0;
        }

        .landing-gallery {
          width: min(1120px, calc(100% - 48px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 22px;
        }

        .gallery-card {
          height: 255px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          background-size: cover;
          background-position: center;
          box-shadow: 0 16px 30px rgba(30, 73, 112, 0.2);
          cursor: pointer;
          transform: translateY(0);
          transition: transform 220ms ease, box-shadow 220ms ease, outline-color 220ms ease;
          outline: 2px solid transparent;
          outline-offset: 4px;
        }

        .gallery-card:hover,
        .gallery-card.active {
          transform: translateY(-8px);
          box-shadow: 0 24px 42px rgba(30, 73, 112, 0.28);
        }

        .gallery-card.active {
          outline-color: rgba(255, 255, 255, 0.72);
        }

        .gallery-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(0, 18, 35, 0.58) 0%, rgba(0, 18, 35, 0.05) 44%, rgba(0, 18, 35, 0.5) 100%);
        }

        .gallery-card:hover::before,
        .gallery-card.active::before {
          background:
            linear-gradient(180deg, rgba(0, 18, 35, 0.45) 0%, rgba(0, 18, 35, 0.01) 44%, rgba(0, 18, 35, 0.58) 100%);
        }

        .gallery-label {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 7px;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
        }

        .gallery-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fff;
        }

        .gallery-title {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 16px;
          z-index: 1;
          color: #fff;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 850;
        }

        .gallery-live {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 72px;
          z-index: 1;
          height: 32px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          background: #1284d5;
          font-size: 12px;
          font-weight: 850;
        }

        .gallery-focus {
          position: absolute;
          left: 42px;
          right: 42px;
          top: 88px;
          bottom: 78px;
          z-index: 1;
          border: 2px solid rgba(255, 255, 255, 0.74);
          border-radius: 4px;
        }

        .landing-cta {
          width: min(1120px, calc(100% - 48px));
          margin: 74px auto 0;
          text-align: center;
          color: #fff;
        }

        .landing-cta-title {
          max-width: 760px;
          margin: 0 auto 22px;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1.2;
          font-weight: 850;
          letter-spacing: 0;
        }

        .landing-start {
          height: 42px;
          min-width: 156px;
          padding: 0 24px;
          border-radius: 999px;
          border: 0;
          background: #f6f1fb;
          color: #2e76ad;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(18, 60, 96, 0.18);
          transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .landing-start:hover {
          background: #ffffff;
          box-shadow: 0 15px 28px rgba(18, 60, 96, 0.22);
        }

        .landing-features {
          width: min(1120px, calc(100% - 48px));
          margin: 34px auto 0;
          padding-bottom: 72px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .feature-card {
          min-height: 220px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 34px;
          align-items: center;
          padding: 28px 32px;
          border-radius: 14px;
          background: #eaf1f8;
          box-sizing: border-box;
          box-shadow: 0 16px 30px rgba(28, 71, 108, 0.14);
          transition: transform 220ms ease, box-shadow 220ms ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 24px 40px rgba(28, 71, 108, 0.18);
        }

        .feature-card.reverse {
          grid-template-columns: 360px minmax(0, 1fr);
        }

        .feature-copy h3 {
          margin: 0 0 10px;
          color: #2a6ea5;
          font-size: 20px;
          line-height: 1.25;
          font-weight: 850;
        }

        .feature-copy p {
          margin: 0;
          color: #2d6c9d;
          font-size: 15px;
          line-height: 1.8;
          font-weight: 500;
        }

        .feature-image {
          width: 100%;
          height: 155px;
          border-radius: 7px;
          background-size: cover;
          background-position: center;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
          transition: transform 260ms ease;
        }

        .feature-card:hover .feature-image {
          transform: scale(1.02);
        }

        @media (prefers-reduced-motion: reduce) {
          .landing-logo,
          .landing-nav-button,
          .landing-primary,
          .landing-outline,
          .landing-start,
          .landing-brain,
          .gallery-card,
          .feature-card,
          .feature-image {
            transition: none !important;
          }

          .landing-logo:hover,
          .landing-nav-button:hover,
          .landing-primary:hover,
          .landing-outline:hover,
          .landing-start:hover,
          .landing-hero-art:hover .landing-brain,
          .gallery-card:hover,
          .gallery-card.active,
          .feature-card:hover,
          .feature-card:hover .feature-image {
            transform: none !important;
          }
        }
        }

        @media (max-width: 920px) {
          .landing-nav-inner,
          .landing-hero,
          .landing-gallery,
          .landing-cta,
          .landing-features {
            width: min(100% - 32px, 720px);
          }

          .landing-hero {
            grid-template-columns: 1fr;
            gap: 28px;
            min-height: auto;
            padding-top: 42px;
          }

          .landing-hero-art {
            min-height: 240px;
          }

          .landing-brain {
            max-width: 280px;
          }

          .landing-gallery {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .feature-card,
          .feature-card.reverse {
            grid-template-columns: 1fr;
          }

          .feature-card.reverse .feature-image {
            order: 2;
          }
        }

        @media (max-width: 620px) {
          .landing-nav-inner {
            height: auto;
            padding: 18px 0;
            align-items: flex-start;
            gap: 14px;
            flex-direction: column;
          }

          .landing-nav-actions {
            width: 100%;
            flex-wrap: wrap;
            gap: 10px;
          }

          .landing-nav-link {
            font-size: 13px;
          }

          .landing-nav-button {
            height: 32px;
            font-size: 12px;
          }

          .landing-hero-title {
            font-size: 34px;
          }

          .landing-hero-text {
            font-size: 15px;
          }

          .landing-hero {
            gap: 12px;
            padding-top: 34px;
            padding-bottom: 28px;
          }

          .landing-hero-actions {
            margin-top: 22px;
          }

          .landing-hero-art {
            min-height: 190px;
          }

          .landing-brain {
            max-width: 218px;
          }

          .landing-gallery {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .gallery-card {
            height: 218px;
          }

          .landing-cta {
            margin-top: 42px;
          }

          .landing-features {
            margin-top: 28px;
            gap: 18px;
          }

          .feature-card {
            padding: 22px;
            min-height: 0;
          }

          .feature-copy h3 {
            font-size: 18px;
          }

          .feature-copy p {
            font-size: 14px;
          }

          .feature-image {
            height: 138px;
          }
        }
      `}</style>

      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <button type="button" className="landing-logo" onClick={() => scrollToSection('about')}>
            MeetMind
          </button>

          <div className="landing-nav-actions">
            <a className="landing-nav-link" href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About Us</a>
            <a className="landing-nav-link" href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a>
            {isLoggedIn ? (
              <>
                <button type="button" className="landing-nav-button" onClick={goToMeetings}>
                  Meetings
                </button>
                <button type="button" className="landing-nav-button secondary" onClick={() => goToAuth('/profile')}>
                  Profile
                </button>
              </>
            ) : (
              <>
                <button type="button" className="landing-nav-button secondary" onClick={() => goToAuth('/login')}>
                  Sign In
                </button>
                <button type="button" className="landing-nav-button" onClick={() => goToAuth('/register')}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <section className="landing-hero-wrap" id="about">
          <div className="landing-hero">
            <div className="landing-hero-copy">
              <h1 className="landing-hero-title">
                Temukan potensi penuh setiap percakapan saat ide terhubung otomatis
              </h1>
              <p className="landing-hero-text">
                MeetMind hadir untuk memastikan tidak ada detail yang terlewat. Dari transkripsi
                real-time hingga analisis teks otomatis yang mendalam, kami membantu Anda fokus
                pada diskusi, kami menangani dokumentasinya.
              </p>
              <div className="landing-hero-actions">
                <button type="button" className="landing-primary" onClick={goToMeetings}>
                  Start Meeting
                </button>
                {!isLoggedIn && (
                  <button type="button" className="landing-outline" onClick={() => goToAuth('/login')}>
                    Sign In
                  </button>
                )}
              </div>
            </div>

            <div className="landing-hero-art">
              <svg className="landing-brain" viewBox="0 0 220 190" fill="none" aria-hidden="true">
                <path d="M93 40c14-22 50-21 63 4 19 0 32 13 32 32 0 8-3 16-8 22 9 7 14 18 12 31-3 21-22 34-42 30-10 17-34 22-50 9-16 8-38 1-45-16-20 1-36-14-36-33 0-13 7-25 18-31-5-21 14-43 37-40 5-4 11-7 19-8Z" fill="#eef7fb" stroke="#1389b3" strokeWidth="7" strokeLinejoin="round"/>
                <path d="M82 56c0 17 19 18 19 34 0 14-15 17-15 31 0 11 9 21 23 21M126 48c-15 12-12 31 4 38 19 8 16 34-4 40M151 64c17 4 24 23 12 37-10 12-6 26 8 31" stroke="#1389b3" strokeWidth="5" strokeLinecap="round"/>
                <circle cx="136" cy="75" r="19" fill="#e9f6fa" stroke="#23a8c9" strokeWidth="5"/>
                <circle cx="129" cy="75" r="2.8" fill="#23a8c9"/>
                <circle cx="136" cy="75" r="2.8" fill="#23a8c9"/>
                <circle cx="143" cy="75" r="2.8" fill="#23a8c9"/>
                <path d="M58 94v33c0 11-8 19-19 19s-19-8-19-19V94" stroke="#176aa5" strokeWidth="7" strokeLinecap="round"/>
                <rect x="30" y="73" width="19" height="58" rx="9.5" fill="#176aa5"/>
                <path d="M15 154h50M40 147v20" stroke="#176aa5" strokeWidth="7" strokeLinecap="round"/>
                <path d="M1 80h18M4 95h14M7 110h11M184 68h23M181 84h31M184 100h26M188 116h18" stroke="#23a8c9" strokeWidth="6" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </section>

        <section className="landing-media-wrap">
          <div className="landing-gallery">
            {galleryCards.map((item, index) => (
              <article
                className={`gallery-card ${activeGallery === index ? 'active' : ''}`}
                key={item.label}
                style={{ backgroundImage: `url(${item.image})` }}
                role="button"
                tabIndex={0}
                aria-pressed={activeGallery === index}
                onMouseEnter={() => activateGallery(index)}
                onFocus={() => activateGallery(index)}
                onClick={() => activateGallery(index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    activateGallery(index);
                  }
                }}
              >
                <span className="gallery-label">
                  <span className="gallery-dot" />
                  {item.label}
                </span>
                {item.badge && <span className="gallery-live">{item.badge}</span>}
                {item.focus && <span className="gallery-focus" />}
                <strong className="gallery-title">{item.title}</strong>
              </article>
            ))}
          </div>

          <section className="landing-cta" id="contact">
            <h2 className="landing-cta-title">See what MeetMind can do for your business</h2>
            <button type="button" className="landing-start" onClick={goToMeetings}>
              Start Meeting!
            </button>
          </section>

          <section className="landing-features">
            {featureCards.map((feature) => {
              const image = (
                <div
                  className="feature-image"
                  style={{ backgroundImage: `url(${feature.image})` }}
                  aria-hidden="true"
                />
              );
              const copy = (
                <div className="feature-copy">
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </div>
              );

              return (
                <article className={`feature-card ${feature.reverse ? 'reverse' : ''}`} key={feature.title}>
                  {feature.reverse ? image : copy}
                  {feature.reverse ? copy : image}
                </article>
              );
            })}
          </section>
        </section>
      </main>
    </div>
  );
}
