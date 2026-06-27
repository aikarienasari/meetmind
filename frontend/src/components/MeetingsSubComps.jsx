import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import * as Sentry from "@sentry/react";
import { isMockMode, mockAnalyzeMeeting, mockCreateMeeting } from "../mocks/mockData.js";
import {
  updateMeeting,
  getRegenCount,
  bumpRegenCount,
  canRegenerate,
  REGEN_LIMIT,
} from "../services/meetingService.js";

// Lazy-load ExportModal agar jsPDF + docx (cukup besar) tidak masuk ke
// bundle utama. Modal hanya di-import saat user benar-benar klik Export.
const ExportModal = lazy(() => import("./ExportModal.jsx"));

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

export function DropZone({ onFile, meetingId, onMeetingIdChange, onAudioUpload, uploadProgress }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file) return;
    setFileName(file.name);
    
    if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|webm|ogg)$/i)) {
      if (onAudioUpload) onAudioUpload(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => onFile(e.target.result);
      reader.readAsText(file);
    }
  }, [onAudioUpload, onFile]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

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
          accept=".txt,.json,.vtt,.srt,.mp3,.wav,.m4a,.webm,.ogg"
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
            <span className="drop-main">Seret & lepas file di sini</span>
            <span className="drop-sub">atau klik untuk pilih transkrip/audio</span>
          </>
        )}
      </div>
      
      {/* Upload Progress Bar & Stepper */}
      {uploadProgress !== null && (
        <div style={{ marginTop: '16px', padding: '0 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#555', fontWeight: '600' }}>Mengunggah File...</span>
            <span style={{ fontSize: '12px', color: '#1a73e8', fontWeight: '700' }}>{uploadProgress}%</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#e1e8f5', borderRadius: '8px', height: '6px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${uploadProgress}%`, 
              backgroundColor: '#1a73e8', 
              height: '100%', 
              transition: 'width 0.2s ease',
              borderRadius: '8px'
            }}></div>
          </div>
          
          {/* Stepper */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', position: 'relative', padding: '0 10px' }}>
            {/* Stepper Line Background */}
            <div style={{ position: 'absolute', top: '12px', left: '15%', right: '15%', height: '2px', backgroundColor: '#e1e8f5', zIndex: 0 }}></div>
            {/* Stepper Line Active */}
            <div style={{ 
              position: 'absolute', 
              top: '12px', 
              left: '15%', 
              width: uploadProgress === 100 ? '70%' : (uploadProgress > 0 ? '35%' : '0%'), 
              height: '2px', 
              backgroundColor: '#1a73e8', 
              zIndex: 0, 
              transition: 'width 0.3s ease' 
            }}></div>

            {/* Step 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '60px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#1a73e8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>✓</div>
              <span style={{ fontSize: '11px', color: '#333', marginTop: '6px', fontWeight: '600', textAlign: 'center' }}>Menyiapkan</span>
            </div>
            
            {/* Step 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '60px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: uploadProgress > 0 ? '#1a73e8' : '#fff', border: uploadProgress > 0 ? 'none' : '2px solid #e1e8f5', color: uploadProgress > 0 ? '#fff' : '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.3s ease' }}>
                {uploadProgress === 100 ? '✓' : '2'}
              </div>
              <span style={{ fontSize: '11px', color: uploadProgress > 0 ? '#333' : '#aaa', marginTop: '6px', fontWeight: '600', textAlign: 'center', transition: 'color 0.3s' }}>Mengunggah</span>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '60px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: uploadProgress === 100 ? '#1a73e8' : '#fff', border: uploadProgress === 100 ? 'none' : '2px solid #e1e8f5', color: uploadProgress === 100 ? '#fff' : '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.3s ease' }}>3</div>
              <span style={{ fontSize: '11px', color: uploadProgress === 100 ? '#333' : '#aaa', marginTop: '6px', fontWeight: '600', textAlign: 'center', transition: 'color 0.3s' }}>Selesai</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export function AIPanel({ transcript, uploadedTranscript, meetingTitle, recording, onStop, meetingId: propMeetingId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localMeetingId, setLocalMeetingId] = useState(propMeetingId);
  const [expandedSections, setExpandedSections] = useState({});

  // Edit transcript state (task 3.19)
  const [editing, setEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [savedTranscript, setSavedTranscript] = useState(''); // versi yang tersimpan di server
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [isEdited, setIsEdited] = useState(false); // badge "Diedit"
  const saveTimerRef = useRef(null);

  // Regenerate state (task 3.26)
  const [regenCount, setRegenCount] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  // Export state (task 3.25)
  const [showExport, setShowExport] = useState(false);

  // Update local meeting ID when prop changes
  useEffect(() => {
    if (propMeetingId) {
      setLocalMeetingId(propMeetingId);
    }
  }, [propMeetingId]);

  // Saat result baru masuk, sync state transcript + reset badge
  useEffect(() => {
    if (result?.full_transcript) {
      setSavedTranscript(result.full_transcript);
      setEditedTranscript(result.full_transcript);
      setIsEdited(false);
      setEditing(false);
    }
    if (result?.meeting_id) {
      setRegenCount(getRegenCount(result.meeting_id));
    }
  }, [result?.meeting_id, result?.full_transcript]);

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

      if (isMockMode()) {
        if (!actualMeetingId) {
          const created = await mockCreateMeeting(meetingTitle || "Meeting Tanpa Judul");
          actualMeetingId = created.meeting_id;
          setLocalMeetingId(actualMeetingId);
        }

        const data = await mockAnalyzeMeeting({
          meetingId: actualMeetingId,
          title: meetingTitle || "Meeting Tanpa Judul",
          transcript: activeTranscript,
        });
        setResult(data);
        return;
      }

      // Only create meeting if we don't have one yet
      if (!actualMeetingId) {
        // Get user ID from local storage
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('User ID tidak ditemukan. Silakan login kembali.');
        }

        // Create new meeting
        const token = localStorage.getItem('token');
        const API_KEY = import.meta.env.VITE_API_KEY;
        const createRes = await fetch(`${BACKEND_URL}/api/v1/meetings/`, {
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
      const token = localStorage.getItem('token');
      const API_KEY = import.meta.env.VITE_API_KEY;

      const payload = {
        meeting_id: actualMeetingId,
        full_transcript: activeTranscript,
      };

      const res = await fetch(`${BACKEND_URL}/api/v1/meetings/${actualMeetingId}/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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
      Sentry.captureException(err);
      setError("Gagal menghubungi API: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Edit Transcript (3.19) ────────────────────────────────────────
  const handleStartEdit = () => {
    setEditing(true);
    setEditedTranscript(savedTranscript || result?.full_transcript || '');
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditedTranscript(savedTranscript || result?.full_transcript || '');
    setIsEdited(false);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  };

  const handleChangeTranscript = (e) => {
    const value = e.target.value;
    setEditedTranscript(value);
    setIsEdited(value !== savedTranscript);

    // Debounced auto-save (2 detik setelah user berhenti mengetik)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (!result?.meeting_id) return;
    saveTimerRef.current = setTimeout(() => {
      handleSaveTranscript(value);
    }, 2000);
  };

  const handleSaveTranscript = async (overrideText) => {
    const text = overrideText ?? editedTranscript;
    if (!result?.meeting_id) {
      toast.error('meeting_id tidak tersedia, tidak bisa menyimpan');
      return;
    }
    if (!text.trim()) {
      toast.error('Transkrip tidak boleh kosong');
      return;
    }
    if (text === savedTranscript) return; // tidak ada perubahan

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setSavingTranscript(true);
    try {
      const updated = await updateMeeting(result.meeting_id, {
        full_transcript: text,
      });
      setSavedTranscript(text);
      setIsEdited(false);
      // Sync result state supaya UI konsisten
      setResult((prev) => ({ ...prev, full_transcript: text, title: updated?.title || prev?.title }));
      toast.success('Transkrip tersimpan');
    } catch (err) {
      console.error('[editTranscript]', err);
      Sentry.captureException(err);
      toast.error(err.message || 'Gagal menyimpan transkrip');
    } finally {
      setSavingTranscript(false);
    }
  };

  const handleExitEdit = () => {
    // Exit edit mode — simpan dulu jika ada perubahan, lalu tutup
    if (isEdited) {
      handleSaveTranscript();
    }
    setEditing(false);
  };

  // ── Regenerate Summary (3.26) ──────────────────────────────────────
  const handleRegenerate = async () => {
    setShowRegenConfirm(false);
    if (!result?.meeting_id) {
      toast.error('meeting_id tidak tersedia');
      return;
    }
    if (!canRegenerate(result.meeting_id)) {
      toast.error(`Limit regenerasi tercapai (${REGEN_LIMIT}/${REGEN_LIMIT})`);
      return;
    }

    setRegenerating(true);
    try {
      const updated = await updateMeeting(result.meeting_id, { re_analyze: true });
      const newCount = bumpRegenCount(result.meeting_id);
      setRegenCount(newCount);

      // Update result dengan summary/action_items/recommendations baru
      setResult((prev) => ({
        ...prev,
        summary: updated?.summary ?? prev?.summary,
        action_items: updated?.action_items ?? prev?.action_items,
        recommendations: updated?.recommendations ?? prev?.recommendations,
      }));
      toast.success(`Summary berhasil diregenerasi (${newCount}/${REGEN_LIMIT})`);
    } catch (err) {
      console.error('[regenerate]', err);
      Sentry.captureException(err);
      toast.error(err.message || 'Gagal regenerasi summary');
    } finally {
      setRegenerating(false);
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
            const mainText = rec.title || rec.text || rec.recommendation || 'Rekomendasi';
            const detail = rec.detail || rec.description;
            return (
              <li key={index}>
                <strong>{mainText}</strong>
                {detail && ` - ${detail}`}
                {rec.priority && ` [Priority: ${rec.priority}]`}
              </li>
            );
          }
          // Handle jika recommendation adalah string
          return <li key={index}>{rec}</li>;
        })}
      </ul>
    );
  };

  const renderTranscript = (transcriptText, title, sectionKey) => {
    if (!transcriptText) return null;

    // Untuk full_transcript, gunakan edit mode (3.19)
    const isEditableSection = sectionKey === 'full_transcript';
    const isExpanded = expandedSections[sectionKey];
    const previewLength = 500;
    const shouldTruncate = transcriptText.length > previewLength;
    const preview = transcriptText.length > previewLength
      ? transcriptText.substring(0, previewLength) + '...'
      : transcriptText;

    return (
      <>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>{title}:</span>
          {isEditableSection && isEdited && (
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 700,
              background: '#fff3cd',
              color: '#856404',
              border: '1px solid #ffc107',
              borderRadius: 10,
            }}>
              Diedit
            </span>
          )}
          {isEditableSection && savingTranscript && (
            <span style={{ fontSize: 10, color: '#888' }}>menyimpan…</span>
          )}
          {isEditableSection && !editing && !savingTranscript && (
            <button
              onClick={handleStartEdit}
              style={{
                padding: '2px 10px',
                fontSize: 11,
                border: '1px solid #1a73e8',
                background: 'transparent',
                color: '#1a73e8',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              ✎ Edit
            </button>
          )}
          {isEditableSection && editing && (
            <>
              <button
                onClick={handleExitEdit}
                disabled={savingTranscript}
                style={{
                  padding: '2px 10px',
                  fontSize: 11,
                  border: '1px solid #27ae60',
                  background: savingTranscript ? '#ccc' : '#27ae60',
                  color: '#fff',
                  borderRadius: 12,
                  cursor: savingTranscript ? 'wait' : 'pointer',
                }}
              >
                {savingTranscript ? '…' : '✓ Selesai'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={savingTranscript}
                style={{
                  padding: '2px 10px',
                  fontSize: 11,
                  border: '1px solid #e74c3c',
                  background: 'transparent',
                  color: '#e74c3c',
                  borderRadius: 12,
                  cursor: savingTranscript ? 'not-allowed' : 'pointer',
                }}
              >
                Batal
              </button>
            </>
          )}
        </h4>

        <div className="transcript-content">
          {isEditableSection && editing ? (
            <textarea
              value={editedTranscript}
              onChange={handleChangeTranscript}
              onBlur={() => handleSaveTranscript()}
              style={{
                width: '100%',
                minHeight: 240,
                padding: '10px',
                fontSize: '0.85em',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                backgroundColor: '#fffce8',
                border: '2px solid #ffc107',
                borderRadius: '4px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          ) : (
            <pre style={{
              fontSize: '0.85em',
              whiteSpace: 'pre-wrap',
              backgroundColor: 'rgba(0,0,0,0.1)',
              padding: '10px',
              borderRadius: '4px',
              maxHeight: isExpanded ? 'none' : '200px',
              overflow: 'auto',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {isExpanded ? transcriptText : preview}
            </pre>
          )}
          {!editing && shouldTruncate && (
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

  const regenDisabled = !result?.meeting_id || regenerating || regenCount >= REGEN_LIMIT;

  return (
    <div className="action-row">
      {recording && (
        <button className="btn btn-stop" onClick={onStop}>
          ⏹ Stop Recording
        </button>
      )}
      <div className="btn-row-inline">
        <button
          className="btn btn-ai"
          onClick={handleAnalyze}
          disabled={loading || !activeTranscript.trim()}
        >
          {loading ? "⏳ Memproses..." : "📤 Analisis AI"}
        </button>

        {/* Export (3.25) */}
        {result && (
          <button
            className="btn"
            onClick={() => setShowExport(true)}
            disabled={loading}
            style={{
              background: '#27ae60',
              color: '#fff',
            }}
          >
            ⬇ Export
          </button>
        )}

        {/* Regenerate Summary (3.26) */}
        {result && (
          <button
            className="btn"
            onClick={() => {
              if (regenDisabled) {
                toast.info(`Limit regenerasi tercapai (${regenCount}/${REGEN_LIMIT})`);
                return;
              }
              setShowRegenConfirm(true);
            }}
            disabled={regenDisabled}
            style={{
              background: regenDisabled ? '#bbb' : '#f39c12',
              color: '#fff',
            }}
            title={`Regenerasi summary (${regenCount}/${REGEN_LIMIT})`}
          >
            {regenerating ? '⏳ Regenerasi…' : `↻ Regenerasi (${regenCount}/${REGEN_LIMIT})`}
          </button>
        )}
      </div>

      {/* Indeterminate Progress Bar for AI Processing */}
      {loading && (
        <div style={{ marginTop: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px' }}>AI sedang memproses transkrip Anda...</span>
          <div style={{ width: '100%', backgroundColor: '#e1e8f5', borderRadius: '8px', height: '6px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              backgroundColor: '#1a73e8',
              height: '100%',
              borderRadius: '8px',
              width: '30%',
              animation: 'indeterminate-progress 1.5s infinite linear'
            }}></div>
          </div>
          <style>
            {`
              @keyframes indeterminate-progress {
                0% { left: -30%; }
                100% { left: 100%; }
              }
            `}
          </style>
        </div>
      )}

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

               {/* Full Transcript (editable, task 3.19) */}
              {result.full_transcript && renderTranscript(
                editing ? editedTranscript : (savedTranscript || result.full_transcript),
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
        ) : (
          <span className="ai-placeholder">Hasil analisis AI akan muncul di sini...</span>
        )}
      </div>

      {/* Modal Export (task 3.25) — lazy-loaded */}
      <Suspense fallback={null}>
        <ExportModal
          open={showExport}
          result={result}
          onClose={() => setShowExport(false)}
        />
      </Suspense>

      {/* Modal Konfirmasi Regenerasi (task 3.26) */}
      {showRegenConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,25,45,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
          onClick={() => setShowRegenConfirm(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 16, padding: 24,
              width: '100%', maxWidth: 380,
              fontFamily: "'Segoe UI', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, color: '#1a3c6e', fontSize: 16, marginBottom: 12 }}>
              Konfirmasi Regenerasi Summary
            </h3>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 8 }}>
              AI akan menganalisis ulang transkrip untuk menghasilkan summary baru.
            </p>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 18 }}>
              Penggunaan: <strong>{regenCount}/{REGEN_LIMIT}</strong>. Sisa:{' '}
              <strong>{Math.max(0, REGEN_LIMIT - regenCount - 1)}</strong> setelah ini.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowRegenConfirm(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  border: '1px solid #e1e8f5', background: '#fff',
                  color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleRegenerate}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  border: 'none', background: '#f39c12',
                  color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}
              >
                Ya, Regenerasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
