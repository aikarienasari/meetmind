import { useState, useRef } from 'react';

export function useWebSocketRecorder({ 
  meetingId, 
  onTranscriptUpdate, 
  onError,
  onStart,
  onStop
}) {
  const [isRecording, setIsRecording] = useState(false);
  const websocketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);

  const API_KEY = "key1";

  const startRecording = async () => {
    try {
      if (!meetingId) {
        throw new Error("Meeting ID diperlukan untuk memulai recording");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const wsUrl = `ws://localhost:8000/api/v1/ws/transcribe/${meetingId}?api_key=${API_KEY}`;
      const ws = new WebSocket(wsUrl);
      
      websocketRef.current = ws;
      
      ws.onopen = () => {
        console.log("WebSocket connected for meeting:", meetingId);
        
        try {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(event.data);
              audioChunksRef.current.push(event.data);
            }
          };
          
          mediaRecorder.onerror = (error) => {
            console.error("MediaRecorder error:", error);
            const errorMessage = "MediaRecorder error: " + (error.message || "Recording error");
            onError(errorMessage);
            stopRecording();
          };
          
          mediaRecorder.start(1000);
          
          setIsRecording(true);
          if (onStart) onStart();
          
        } catch (mediaError) {
          console.error("Error setting up MediaRecorder:", mediaError);
          onError("Gagal mengatur MediaRecorder: " + mediaError.message);
          cleanup();
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received WebSocket message:", data);
          
          if (data.type === 'session_ended') {
            console.log("Session ended signal received from backend:", data);
            if (onStop) onStop({
              sessionEnded: true, 
              fullTranscript: data.full_transcript,
              diarizedTranscript: data.diarized_transcript,
              speakersDetected: data.speakers_detected
            });
            return;
          }
          
          if (data.type === 'audio_received') {
            console.log("Audio chunk received by backend, size:", data.buffer_kb, "KB");
            return;
          }
          
          if (data.type === 'transcript' && data.text) {
            console.log("Real-time transcript received:", data.text);
            onTranscriptUpdate(data.text);
            return;
          }
          
          if (data.type === 'processing') {
            console.log("Processing message:", data.message);
            return;
          }
          
          if (data.type === 'error') {
            console.error("Backend error:", data.message);
            onError("Backend error: " + data.message);
            return;
          }
          
          if (data.type === 'pong') {
            console.log("Pong received from backend");
            return;
          }
          
        } catch (e) {
          console.warn("Failed to parse WebSocket message:", event.data);
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        const errorMessage = "WebSocket error: " + (error.message || "Koneksi terputus");
        onError(errorMessage);
        stopRecording();
      };
      
      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setIsRecording(false);
        
        if (event.code !== 1000) {
          onError("Koneksi terputus tidak normal: " + (event.reason || "Unknown reason"));
        }
      };
      
    } catch (err) {
      console.error("Error starting recording:", err);
      const errorMessage = "Gagal memulai recording: " + (err.message || "Unknown error");
      onError(errorMessage);
      cleanup();
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording...");
    
    // Kirim signal "stop" ke backend
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      try {
        websocketRef.current.send(JSON.stringify({type: "stop"}));
        console.log("Stop signal sent to backend");
      } catch (e) {
        console.error("Error sending stop signal:", e);
      }
    }
    
    // Tunggu sebentar sebelum cleanup agar backend punya waktu memproses
    setTimeout(() => {
      cleanup();
    }, 2000); // Tunggu 2 detik
  };

  const cleanup = () => {
    console.log("Cleaning up resources...");
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
        console.log("MediaRecorder stopped");
      } catch (e) {
        console.warn("Error stopping MediaRecorder:", e);
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          console.log("Track stopped:", track.kind);
        } catch (e) {
          console.warn("Error stopping track:", e);
        }
      });
    }
    
    // Jangan tutup WebSocket langsung, biarkan backend menutupnya
    // Tapi pastikan state diupdate
    if (isRecording) {
      setIsRecording(false);
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
}