import { useState, useRef, useEffect } from "react";
import { SourceCard, Timer, RecordButton, TranscriptBox, DropZone, AIPanel } from "../components/MeetingsSubComps.jsx";
import { useWebSocketRecorder } from "../hooks/useWebSocketRecorder.js";
import { useNavigate } from "react-router-dom";
import { backBtn } from "../styles/authStyles.js";

export default function MeetingsPage() {
  const [source, setSource] = useState("mic");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [uploadedTranscript, setUploadedTranscript] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("Meeting " + new Date().toLocaleDateString());
  const [meetingId, setMeetingId] = useState(null);
  const [wsError, setWsError] = useState(null);
  const [isWsRecording, setIsWsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Tambahkan ini
  
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const wsRef = useRef(null);

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

      const uploadRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/meetings/${actualMeetingId}/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-API-Key": API_KEY,
        },
        body: formData
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Upload gagal: ${errText}`);
      }
      
      alert("Audio berhasil diunggah!");
    } catch (error) {
      console.error(error);
      alert("Error upload audio: " + error.message);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', background: 'transparent', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <div onClick={() => navigate('/')} style={{ ...backBtn, position: 'static' }}>←</div>
        <button style={{
          padding: '8px 22px', borderRadius: 20, border: '2px solid #e74c3c',
          background: 'transparent', color: '#e74c3c', fontWeight: 600, fontSize: 14, cursor: 'pointer'
        }}
        onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          navigate('/');
        }}>Sign Out</button>
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
          <div className="section">
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
          <DropZone
            onFile={setUploadedTranscript}
            meetingId={meetingId || ""}
            onMeetingIdChange={setMeetingId}
            onAudioUpload={handleAudioUpload}
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
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f0f4fa;
    --card: #ffffff;
    --card2: #e8eef8;
    --accent: #e74c3c;
    --accent2: #c0392b;
    --blue: #1a73e8;
    --blue2: #1557b0;
    --text: #333333;
    --text2: #555555;
    --text3: #777777;
    --border: #e1e8f5;
    --shadow: 0 4px 24px rgba(0,0,0,0.06);
    --radius: 16px;
    --font: 'Segoe UI', sans-serif;
    --mono: 'JetBrains Mono', monospace;
  }

  body { font-family: var(--font); background: var(--bg); color: var(--text); }

  .page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 64px 16px 32px;
    background: var(--bg);
  }

  .card {
    background: var(--card);
    border-radius: 16px;
    padding: 28px 24px;
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border);
  }

  .step-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text2);
    letter-spacing: 0.02em;
  }

  /* Source cards */
  .source-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .source-card {
    background: var(--card2);
    border: 2px solid transparent;
    border-radius: var(--radius);
    padding: 14px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.18s ease;
    color: var(--text);
    font-family: var(--font);
  }

  .source-card:hover { border-color: var(--blue2); background: #dce6f5; }
  .source-card.selected { border-color: var(--blue2); background: #c5d8f8; box-shadow: 0 0 0 3px rgba(26,115,232,0.2); }

  .source-icon { font-size: 22px; }
  .source-title { font-size: 12px; font-weight: 600; text-align: center; }
  .source-sub { font-size: 10px; color: var(--text3); text-align: center; line-height: 1.4; }

  /* Recorder center */
  .recorder-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
  }

  .timer {
    font-family: var(--mono);
    font-size: 52px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.04em;
    line-height: 1;
  }

  .rec-btn {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 3px solid var(--accent);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .rec-btn:hover { transform: scale(1.05); border-color: var(--accent2); }
  .rec-btn.recording { border-color: var(--accent2); animation: pulse 1.4s infinite; }

  .rec-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--accent);
    transition: all 0.2s ease;
  }

  .rec-btn.recording .rec-dot {
    border-radius: 6px;
    background: var(--accent2);
    width: 22px;
    height: 22px;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(231,76,60,0.4); }
    50% { box-shadow: 0 0 0 10px rgba(231,76,60,0); }
  }

  .rec-hint { font-size: 13px; color: var(--text3); }
  .recording-hint { color: var(--accent2); font-weight: 500; }

  /* Sections */
  .section { display: flex; flex-direction: column; gap: 8px; }

  .section-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--text2);
  }

  .transcript-area {
    background: #f8fafc;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
    min-height: 100px;
    resize: vertical;
    color: var(--text);
    font-family: var(--font);
    font-size: 13px;
    line-height: 1.6;
    outline: none;
  }

  .transcript-area::placeholder { color: var(--text3); }

  /* AI Section */
  .ai-section {
    background: #f8fafc;
    border-radius: var(--radius);
    padding: 16px;
    gap: 12px;
  }

  .ai-label { color: var(--blue2); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; }
  .ai-desc { font-size: 12px; color: var(--text3); line-height: 1.5; }

  .meeting-id-input {
    background: #f8fafc;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    color: var(--text);
    font-family: var(--font);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }

  .meeting-id-input:focus { border-color: var(--blue2); }
  .meeting-id-input::placeholder { color: var(--text3); }

  /* Drop zone */
  .drop-zone {
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    padding: 24px 16px;
    display: flex;
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
    gap: 10px;
    flex-direction: column;
  }

  .btn-row-inline {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .btn {
    padding: 10px 18px;
    border-radius: 8px;
    border: none;
    font-family: var(--font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-stop { background: var(--accent); color: #fff; }
  .btn-stop:hover:not(:disabled) { background: var(--accent2); }

  .btn-ai { background: var(--blue); color: #fff; }
  .btn-ai:hover:not(:disabled) { background: var(--blue2); }

  .ai-result {
    background: #f8fafc;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
    width: 100%;
  }

  .ai-placeholder { font-size: 13px; color: var(--text3); font-style: italic; }

  .ai-output {
    font-family: var(--font);
    font-size: 12.5px;
    color: var(--text2);
    white-space: pre-wrap;
    line-height: 1.7;
  }

  .ai-output h3 {
    color: var(--text);
    margin-bottom: 12px;
    font-size: 16px;
  }

  .ai-output h4 {
    color: var(--blue2);
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
`;