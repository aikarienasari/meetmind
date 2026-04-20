import { useState, useRef, useEffect, useCallback } from "react";

const BACKEND_URL = 'http://localhost:8000';

export function SourceCard({ icon, title, subtitle, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`source-card ${selected ? "selected" : ""}`}
    >
      <span className="source-icon">{icon}</span>
      <span className="source-title">{title}</span>
      {subtitle && <span className="source-sub">{subtitle}</span>}
    </button>
  );
}

export function Timer({ seconds }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return <div className="timer">{mm}:{ss}</div>;
}

export function RecordButton({ recording, onClick }) {
  return (
    <button className={`rec-btn ${recording ? "recording" : ""}`} onClick={onClick}>
      <span className="rec-dot" />
    </button>
  );
}

export function TranscriptBox({ value }) {
  const displayValue = value || "Transkrip muncul setelah stop rekam...";
  
  return (
    <div className="section">
      <p className="section-label">TRANSKIP:</p>
      <textarea
        readOnly
        className="transcript-area"
        value={displayValue}
        placeholder="Transkrip muncul setelah stop rekam..."
      />
    </div>
  );
}

export function DropZone({ onFile, meetingId, onMeetingIdChange }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => onFile(e.target.result);
    reader.readAsText(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div className="section ai-section">
      <p className="section-label ai-label">ANALISIS DATA DENGAN AI</p>
      <p className="ai-desc">
        Kirim transkrip ke AI untuk ringkasan, action items, dan rekomendasi strategis.
      </p>

      {/* Meeting ID */}
      <input
        className="meeting-id-input"
        placeholder="Meeting ID (opsional)"
        value={meetingId}
        onChange={(e) => onMeetingIdChange(e.target.value)}
      />

      {/* Drop zone */}
      <div
        className={`drop-zone ${dragging ? "drag-over" : ""} ${fileName ? "has-file" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.json,.vtt,.srt"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {fileName ? (
          <>
            <span className="drop-icon">📄</span>
            <span className="drop-main">{fileName}</span>
            <span className="drop-sub">Klik untuk ganti file</span>
          </>
        ) : (
          <>
            <span className="drop-icon">⬆</span>
            <span className="drop-main">Seret & lepas transkrip di sini</span>
            <span className="drop-sub">atau klik untuk pilih file (.txt, .json, .vtt, .srt)</span>
          </>
        )}
      </div>
    </div>
  );
}


export function AIPanel({ transcript, uploadedTranscript, meetingTitle, recording, onStop, meetingId: propMeetingId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localMeetingId, setLocalMeetingId] = useState(propMeetingId);
  const [expandedSections, setExpandedSections] = useState({});

  // Update local meeting ID when prop changes
  useEffect(() => {
    if (propMeetingId) {
      setLocalMeetingId(propMeetingId);
    }
  }, [propMeetingId]);

  const activeTranscript = uploadedTranscript || transcript;

  const toggleExpand = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAnalyze = async () => {
    if (!activeTranscript.trim()) {
      // Jika tidak ada transcript, beri pesan yang jelas
      setError("Tidak ada transkrip untuk dianalisis. Lakukan rekaman terlebih dahulu.");
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let actualMeetingId = localMeetingId;
      
      // Only create meeting if we don't have one yet
      if (!actualMeetingId) {
        // Get user ID from local storage
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('User ID tidak ditemukan. Silakan login kembali.');
        }

        const API_KEY = "key1";
        
        // Create new meeting
        const createRes = await fetch(`${BACKEND_URL}/api/v1/meetings/`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
          },
          body: JSON.stringify({
            title: meetingTitle || "Meeting Tanpa Judul",
            user_id: userId
          }),
        });

        if (!createRes.ok) {
          const errorMsg = await createRes.text();
          throw new Error(`Gagal membuat meeting: ${errorMsg}`);
        }
        
        // Parse JSON response to get meeting_id
        const createData = await createRes.json();
        actualMeetingId = createData.meeting_id;
        setLocalMeetingId(actualMeetingId);
      }

      // Now finish the meeting with transcript
      const API_KEY = "key1";
      
      const payload = {
        meeting_id: actualMeetingId,
        full_transcript: activeTranscript,
      };

      const res = await fetch(`${BACKEND_URL}/api/v1/meetings/${actualMeetingId}/finish`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorMsg}`);
      }
      
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("API Error:", err);
      setError("Gagal menghubungi API: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk merender action items dengan aman
  const renderActionItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    
    return (
      <ul>
        {items.map((item, index) => {
          // Handle jika item adalah object
          if (typeof item === 'object' && item !== null) {
            return (
              <li key={index}>
                <strong>{item.task || item.title || 'Task tidak bernama'}</strong>
                {item.assignee && ` - ${item.assignee}`}
                {item.deadline && ` (Deadline: ${item.deadline})`}
                {item.priority && ` [Priority: ${item.priority}]`}
              </li>
            );
          }
          // Handle jika item adalah string
          return <li key={index}><strong>{item}</strong></li>;
        })}
      </ul>
    );
  };

  // Fungsi untuk merender rekomendasi dengan aman
  const renderRecommendations = (recommendations) => {
    if (!Array.isArray(recommendations) || recommendations.length === 0) return null;
    
    return (
      <ul>
        {recommendations.map((rec, index) => {
          // Handle jika recommendation adalah object
          if (typeof rec === 'object' && rec !== null) {
            return <li key={index}>{rec.text || rec.recommendation || JSON.stringify(rec)}</li>;
          }
          // Handle jika recommendation adalah string
          return <li key={index}>{rec}</li>;
        })}
      </ul>
    );
  };

const renderTranscript = (transcript, title, sectionKey) => {
  if (!transcript) return null;
  
  const isExpanded = expandedSections[sectionKey];
  // Kurangi jumlah karakter untuk preview agar lebih jelas
  const previewLength = 500; // Lebih panjang dari sebelumnya
  const preview = transcript.length > previewLength 
    ? transcript.substring(0, previewLength) + '...'
    : transcript;
  const shouldTruncate = transcript.length > previewLength;
  
  return (
    <>
      <h4>{title}:</h4>
      <div className="transcript-content">
        <pre style={{ 
          fontSize: '0.85em', 
          whiteSpace: 'pre-wrap',
          backgroundColor: 'rgba(0,0,0,0.1)',
          padding: '10px',
          borderRadius: '4px',
          maxHeight: isExpanded ? 'none' : '200px', // Tinggi maksimal yang lebih besar
          overflow: 'auto', // Ganti ke auto agar bisa scroll
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {isExpanded ? transcript : preview}
        </pre>
        {shouldTruncate && (
          <button 
            onClick={() => toggleExpand(sectionKey)}
            className="btn btn-toggle"
            style={{ 
              marginTop: '5px',
              backgroundColor: 'rgba(52,152,219,0.2)',
              color: '#3498db',
              border: '1px solid #3498db',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isExpanded ? "▲ Tampilkan Lebih Sedikit" : "▼ Tampilkan Selengkapnya"}
          </button>
        )}
      </div>
    </>
  );
};

  // Fungsi untuk merender speakers detected
  const renderSpeakers = (speakers) => {
    if (!speakers || Object.keys(speakers).length === 0) return null;
    
    return (
      <>
        <h4>Speakers Detected:</h4>
        <ul>
          {Object.entries(speakers).map(([speakerId, speakerName]) => (
            <li key={speakerId}>
              <strong>{speakerId}:</strong> {speakerName}
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="action-row">
      {recording && (
        <button className="btn btn-stop" onClick={onStop}>
          ⏹ Stop Recording
        </button>
      )}
      <button
        className="btn btn-ai"
        onClick={handleAnalyze}
        disabled={loading || !activeTranscript.trim()}
      >
        {loading ? "⏳ Memproses..." : "📤 Kirim ke API"}
      </button>

      {(result || loading || error) && (
        <div className="ai-result">
          {loading ? (
            <span className="ai-placeholder">Mengirim transkrip ke API...</span>
          ) : error ? (
            <pre className="ai-output" style={{color: 'red'}}>Error: {error}</pre>
          ) : result ? (
            <div className="ai-output">
              <h3>{result.title || "Hasil Analisis"}</h3>
              
              {result.summary && (
                <>
                  <h4>Ringkasan:</h4>
                  <p>{result.summary}</p>
                </>
              )}
              
              {result.action_items && result.action_items.length > 0 && (
                <>
                  <h4>Action Items:</h4>
                  {renderActionItems(result.action_items)}
                </>
              )}
              
              {result.recommendations && result.recommendations.length > 0 && (
                <>
                  <h4>Rekomendasi:</h4>
                  {renderRecommendations(result.recommendations)}
                </>
              )}
              
               {/* Full Transcript */}
              {result.full_transcript && renderTranscript(
                result.full_transcript, 
                "Full Transcript", 
                "full_transcript"
              )}
              
              {/* Diarized Transcript */}
              {result.diarized_transcript && renderTranscript(
                result.diarized_transcript, 
                "Diarized Transcript", 
                "diarized_transcript"
              )}
              
              {/* Speakers Detected */}
              {result.speakers_detected && renderSpeakers(result.speakers_detected)}
              
              {/* Created At */}
              {result.created_at && (
                <>
                  <h4>Created At:</h4>
                  <p>{new Date(result.created_at).toLocaleString()}</p>
                </>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}