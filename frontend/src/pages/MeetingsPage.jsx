import { useState, useRef, useEffect } from "react";
import { SourceCard, Timer, RecordButton, TranscriptBox, DropZone, AIPanel } from "../components/MeetingsSubComps.jsx";
import { useWebSocketRecorder } from "../hooks/useWebSocketRecorder.js";
import { useNavigate } from "react-router-dom";
import { isMockMode, mockCreateMeeting, mockTranscript } from "../mocks/mockData.js";

export default function MeetingsPage() {
  const [source, setSource] = useState("mic");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [uploadedTranscript, setUploadedTranscript] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("Meeting " + new Date().toLocaleDateString());
  const [meetingId, setMeetingId] = useState(null);
  const [wsError, setWsError] = useState(null);
  const [isWsRecording, setIsWsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // Tambahkan ini

  const navigate = useNavigate();
  const timerRef = useRef(null);
  const wsRecorder = useWebSocketRecorder({
    meetingId,
    source,
    onTranscriptUpdate: (newText) => {
      // Update transcript real-time jika backend mengirimkannya
      setTranscript(prev => prev + (prev ? " " : "") + newText);
    },
    onError: (error) => {
      setWsError(error);
      console.error("WebSocket recording error:", error);
      setIsWsRecording(false);
      setIsProcessing(false); // Reset processing state
    },
    onStart: () => {
      console.log("Recording started");
      setIsWsRecording(true);
      setWsError(null);
      setIsProcessing(false); // Reset processing state
    },
    onStop: (data) => {
      console.log("Recording stopped with data:", data);
      setIsWsRecording(false);
      setIsProcessing(false); // Reset processing state

      // Jika session_ended diterima, otomatis kirim ke AI
      if (data && data.sessionEnded) {
        console.log("Session ended successfully");
        // Transcript sudah ada di state transcript dari onTranscriptUpdate
      }
    }
  });

  useEffect(() => {
    if (isWsRecording) {
      timerRef.current = setInterval(()=>{
        setSeconds(prev => prev+1);
      }, 1000);
    } else if (timerRef.current){
      clearInterval(timerRef.current);
    }

    return()=>{
      if(timerRef.current){
        clearInterval(timerRef.current);
      }
    };
  }, [isWsRecording]);

  const startRecording = async () => {
    // Reset transcript jika ini recording baru
    setTranscript("");
    setSeconds(0);
    setIsProcessing(false); // Reset processing state

    // Create meeting first if not exists
    let newMeetingId = meetingId;
    if (!newMeetingId) {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('Silakan login terlebih dahulu');
        return;
      }

      if (isMockMode()) {
        const data = await mockCreateMeeting(meetingTitle || "Meeting Tanpa Judul");
        newMeetingId = data.meeting_id;
        setMeetingId(newMeetingId);
      } else {

        try {
          const token = localStorage.getItem('token');
          const API_KEY = import.meta.env.VITE_API_KEY;
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/meetings/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
              "X-API-Key": API_KEY,
            },
            body: JSON.stringify({
              title: meetingTitle || "Meeting Tanpa Judul",
              user_id: userId
            }),
          });

          if (!res.ok) throw new Error('Gagal membuat meeting');

          const data = await res.json();
          newMeetingId = data.meeting_id;
          setMeetingId(newMeetingId);
        } catch (err) {
          console.error("Error creating meeting:", err);
          alert("Gagal membuat meeting: " + err.message);
          return;
        }
      }
    }

    if (isMockMode()) {
      setIsWsRecording(true);
      setWsError(null);
      window.setTimeout(() => {
        setTranscript(mockTranscript);
        setIsWsRecording(false);
        setIsProcessing(false);
      }, 1800);
      return;
    }

    // Mulai WebSocket recording
    try {
      wsRecorder.startRecording(newMeetingId);
    } catch (err) {
      console.error("Error starting recording:", err);
      setWsError("Gagal memulai recording: " + err.message);
    }
  };

  const stopRecording = () => {
    setIsProcessing(true); // Set processing state saat stop
    if (isMockMode()) {
      setTranscript(mockTranscript);
      setIsWsRecording(false);
      window.setTimeout(() => setIsProcessing(false), 500);
      return;
    }
    wsRecorder.stopRecording();
  };

  const toggleRecording = () => {
    if (isWsRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAudioUpload = async (file) => {
    try {
      setIsProcessing(true);
      setUploadProgress(0);

      if (isMockMode()) {
        setUploadProgress(35);
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        setUploadProgress(80);
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        setUploadedTranscript(mockTranscript);
        setUploadProgress(100);
        alert(`Mock upload berhasil: ${file.name}`);
        setTimeout(() => setUploadProgress(null), 1800);
        return;
      }

      let actualMeetingId = meetingId;
      const token = localStorage.getItem('token');
      const API_KEY = import.meta.env.VITE_API_KEY;

      if (!actualMeetingId) {
        const userId = localStorage.getItem('userId');
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/meetings/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-API-Key": API_KEY,
          },
          body: JSON.stringify({
            title: meetingTitle || "Meeting Tanpa Judul",
            user_id: userId
          }),
        });
        if (!res.ok) throw new Error('Gagal membuat meeting');
        const data = await res.json();
        actualMeetingId = data.meeting_id;
        setMeetingId(actualMeetingId);
      }

      const formData = new FormData();
      formData.append("file", file);

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${import.meta.env.VITE_BACKEND_URL}/api/v1/meetings/${actualMeetingId}/upload`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("X-API-Key", API_KEY);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`Upload gagal: ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => reject(new Error("Terjadi kesalahan jaringan saat upload"));
        xhr.send(formData);
      });

      alert("Audio berhasil diunggah!");
      // Tunda menghapus progress bar agar user bisa melihat status Selesai
      setTimeout(() => {
        setUploadProgress(null);
      }, 3000);
    } catch (error) {
      console.error(error);
      alert("Error upload audio: " + error.message);
      setUploadProgress(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const sources = [
    { id: "mic", icon: "🎙", title: "Mic Only", subtitle: "Rekam suara dari mikrofon perangkat" },
    { id: "tab", icon: "🖥", title: "Tab/Aplikasi", subtitle: "Rekam audio dari tab/window (GMeet, Zoom, dll)" },
    { id: "both", icon: "🎙+🖥", title: "Mic + Meeting", subtitle: "Gabung mikrofon & audio internal sekaligus" },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="meetings-topbar">
        <button type="button" className="meetings-back" onClick={() => navigate('/')} aria-label="Kembali">
          ←
        </button>
        <div className="meetings-actions">
          <button type="button" className="meetings-action" onClick={() => navigate('/profile')}>
            Profil
          </button>
          <button
            type="button"
            className="meetings-action danger"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userId');
              navigate('/');
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
      <div className="page">
        <div className="card">
          {/* Step label */}
          <p className="step-label">② Pilih Sumber Audio &amp; Rekam</p>

          {/* Source selector */}
          <div className="source-row">
            {sources.map((s) => (
              <SourceCard
                key={s.id}
                icon={s.icon}
                title={s.title}
                subtitle={s.subtitle}
                selected={source === s.id}
                onClick={() => setSource(s.id)}
              />
            ))}
          </div>

          {/* Meeting Title */}
          <div className="section meeting-title-section">
            <p className="section-label">JUDUL MEETING:</p>
            <input
              className="meeting-id-input"
              placeholder="Masukkan judul meeting"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
            />
          </div>

          {/* Timer + record button */}
          <div className="recorder-center">
            <Timer seconds={seconds} />
            <RecordButton
              recording={isWsRecording}
              onClick={toggleRecording}
            />
            {!isWsRecording && !isProcessing && <p className="rec-hint">klik untuk mulai rekam</p>}
            {isWsRecording && <p className="rec-hint recording-hint">● Sedang merekam…</p>}
            {isProcessing && <p className="rec-hint recording-hint">● Memproses rekaman…</p>}
            {wsError && <p className="rec-hint" style={{color: 'red'}}>{wsError}</p>}
          </div>

          {/* Transcript */}
          <TranscriptBox value={transcript} />

          {/* Drop zone + AI panel */}
          <div className="ai-combined">
            <DropZone
              onFile={setUploadedTranscript}
              meetingId={meetingId || ""}
              onMeetingIdChange={setMeetingId}
              onAudioUpload={handleAudioUpload}
              uploadProgress={uploadProgress}
            />

            <AIPanel
              transcript={transcript}
              uploadedTranscript={uploadedTranscript}
              meetingTitle={meetingTitle}
              recording={isWsRecording}
              onStop={stopRecording}
              meetingId={meetingId}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&family=JetBrains+Mono:wght@700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #5f8fbc;
    --panel: #c7d1dc;
    --panel2: #c2ccd7;
    --red: #7b0000;
    --blueText: #2b6ea4;
    --white: #ffffff;
    --muted: #e8f0f7;
    --shadow: none;
    --radius: 22px;
    --font: Inter, 'Segoe UI', sans-serif;
    --mono: 'JetBrains Mono', monospace;
  }

  body { font-family: var(--font); background: var(--bg); color: var(--white); }

  .meetings-topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 28px;
    pointer-events: none;
  }

  .meetings-back,
  .meetings-action {
    pointer-events: auto;
    font-family: var(--font);
    cursor: pointer;
    transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;
  }

  .meetings-back {
    width: 44px;
    height: 44px;
    border: 0;
    background: transparent;
    color: #ffffff;
    font-size: 42px;
    line-height: 1;
    font-weight: 300;
    display: grid;
    place-items: center;
    text-shadow: 0 2px 4px rgba(26, 71, 110, 0.24);
  }

  .meetings-back:hover {
    transform: translateX(-2px);
  }

  .meetings-actions {
    display: flex;
    gap: 10px;
    pointer-events: auto;
  }

  .meetings-action {
    height: 34px;
    padding: 0 18px;
    border-radius: 999px;
    border: 2px solid rgba(255, 255, 255, 0.82);
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    backdrop-filter: blur(8px);
  }

  .meetings-action:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.22);
  }

  .meetings-action.danger {
    border-color: rgba(255, 226, 226, 0.85);
    color: #ffe2e2;
  }

  .page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 64px 32px 120px;
    background: var(--bg);
  }

  .card {
    background: transparent;
    border-radius: 0;
    padding: 0;
    width: 100%;
    max-width: 820px;
    display: flex;
    flex-direction: column;
    gap: 26px;
    box-shadow: none;
    border: 0;
  }

  .step-label {
    font-size: 14px;
    font-weight: 900;
    color: var(--white);
    letter-spacing: 0.02em;
    margin-left: 0;
  }

  /* Source cards */
  .source-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
    padding: 8px 28px 0;
  }

  .source-card {
    min-height: 138px;
    background: var(--panel);
    border: 2px solid transparent;
    border-radius: 13px;
    padding: 18px 12px 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.18s ease;
    color: #071018;
    font-family: var(--font);
    box-shadow: none;
  }

  .source-card:hover { transform: translateY(-2px); background: #d1dae4; }
  .source-card.selected { border-color: rgba(255,255,255,0.5); background: #c7d1dc; box-shadow: 0 0 0 3px rgba(255,255,255,0.12); }

  .source-icon { font-size: 36px; line-height: 1; }
  .source-title { font-size: 11px; font-weight: 900; text-align: center; }
  .source-sub { font-size: 11px; color: #050b11; text-align: center; line-height: 1.45; font-weight: 500; }

  .meeting-title-section {
    display: none !important;
  }

  /* Recorder center */
  .recorder-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    padding: 2px 0 22px;
  }

  .timer {
    font-family: var(--mono);
    font-size: 64px;
    font-weight: 800;
    color: var(--white);
    letter-spacing: -0.04em;
    line-height: 1;
  }

  .rec-btn {
    width: 126px;
    height: 126px;
    border-radius: 50%;
    border: 5px solid var(--red);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .rec-btn:hover { transform: scale(1.03); border-color: #660000; }
  .rec-btn.recording { border-color: var(--red); animation: pulse 1.4s infinite; }

  .rec-dot {
    width: 0;
    height: 0;
    border-radius: 50%;
    background: transparent;
    transition: all 0.2s ease;
  }

  .rec-btn.recording .rec-dot {
    border-radius: 6px;
    background: var(--red);
    width: 30px;
    height: 30px;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(123,0,0,0.28); }
    50% { box-shadow: 0 0 0 14px rgba(123,0,0,0); }
  }

  .rec-hint { font-size: 13px; color: var(--white); font-weight: 900; }
  .recording-hint { color: var(--white); font-weight: 900; }

  /* Sections */
  .section { display: flex; flex-direction: column; gap: 10px; }

  .section-label {
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.02em;
    color: var(--white);
    margin-left: 20px;
  }

  .transcript-area {
    background: var(--panel);
    border: 0;
    border-radius: 24px;
    padding: 24px;
    min-height: 170px;
    resize: none;
    color: var(--blueText);
    font-family: var(--font);
    font-size: 13px;
    line-height: 1.6;
    outline: none;
    font-weight: 700;
  }

  .transcript-area::placeholder { color: var(--blueText); opacity: 0.8; }

  .ai-combined {
    background: var(--panel);
    border-radius: 24px;
    padding: 24px 32px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* AI Section */
  .ai-section {
    background: transparent;
    border-radius: 0;
    padding: 0;
    gap: 9px;
  }

  .ai-label { color: var(--blueText); font-size: 13px; font-weight: 900; letter-spacing: 0.02em; margin-left: 0; }
  .ai-desc { font-size: 13px; color: var(--blueText); line-height: 1.5; font-weight: 500; }

  .meeting-id-input {
    display: none;
  }

  .meeting-id-input:focus { border-color: var(--blue2); }
  .meeting-id-input::placeholder { color: var(--text3); }

  /* Drop zone */
  .drop-zone {
    border: 0;
    border-radius: 999px;
    padding: 9px 16px;
    display: none;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
  }

  .drop-zone:hover, .drop-zone.drag-over {
    border-color: var(--blue2);
    background: rgba(52,152,219,0.08);
  }

  .drop-zone.has-file {
    border-color: #27ae60;
    background: rgba(39,174,96,0.08);
  }

  .drop-icon { font-size: 24px; }
  .drop-main { font-size: 13px; font-weight: 500; color: var(--text2); }
  .drop-sub { font-size: 11px; color: var(--text3); }

  /* Action row */
  .action-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    flex-direction: column;
  }

  .btn-row-inline {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .btn {
    padding: 8px 16px;
    border-radius: 999px;
    border: none;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
    transition: all 0.18s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-stop { background: var(--accent); color: #fff; }
  .btn-stop { background: #d8562e; color: #fff; }
  .btn-stop:hover:not(:disabled) { background: #b94422; }

  .btn-ai { background: #e2e7ec; color: var(--blueText); }
  .btn-ai:hover:not(:disabled) { background: #f2f5f8; }

  .ai-result {
    background: #e0e0e0;
    border: 0;
    border-radius: 12px;
    padding: 12px 16px;
    width: 100%;
    min-height: 32px;
  }

  .ai-placeholder { font-size: 12px; color: #ffffff; font-style: italic; opacity: 0.88; }

  .ai-output {
    font-family: var(--font);
    font-size: 12.5px;
    color: #245d8c;
    white-space: pre-wrap;
    line-height: 1.7;
  }

  .ai-output h3 {
    color: #174e7a;
    margin-bottom: 12px;
    font-size: 16px;
  }

  .ai-output h4 {
    color: #174e7a;
    margin: 16px 0 8px 0;
    font-size: 14px;
  }

  .ai-output p {
    margin-bottom: 12px;
  }

  .ai-output ul {
    margin-left: 20px;
    margin-bottom: 12px;
  }

  .ai-output li {
    margin-bottom: 6px;
  }
  /* Recording status indicators */
  .rec-hint.recording-hint {
    animation: pulse-text 2s infinite;
  }

  @keyframes pulse-text {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @media (max-width: 760px) {
    .meetings-topbar {
      padding: 10px 14px;
    }

    .meetings-back {
      width: 36px;
      height: 36px;
      font-size: 34px;
    }

    .meetings-actions {
      gap: 6px;
    }

    .meetings-action {
      height: 28px;
      padding: 0 10px;
      font-size: 10px;
      border-width: 1px;
    }

    .page {
      padding: 66px 20px 80px;
    }

    .card {
      max-width: 100%;
      gap: 18px;
    }

    .source-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      padding: 2px 10px 0;
    }

    .source-card {
      height: 70px;
      min-height: 70px;
      border-radius: 9px;
      padding: 5px 5px;
      gap: 3px;
      overflow: hidden;
    }

    .source-icon {
      font-size: 18px;
    }

    .source-title {
      font-size: 7.5px;
    }

    .source-sub {
      font-size: 6.8px;
      line-height: 1.25;
    }

    .timer {
      font-size: 54px;
    }

    .rec-btn {
      width: 68px;
      height: 68px;
      border-width: 4px;
    }

    .transcript-area {
      min-height: 104px;
    }

    .ai-combined {
      padding: 22px;
    }
  }

  @media (max-width: 340px) {
    .source-row {
      grid-template-columns: 1fr;
      padding: 0;
    }
  }
`;
