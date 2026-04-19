import { useState, useRef } from 'react';

export function useWebSocketRecorder({ meetingId, onTranscriptUpdate, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const websocketRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const API_KEY = "key1";

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup WebSocket connection
      const wsUrl = `ws://localhost:8000/api/v1/ws/transcribe/${meetingId}?api_key=${API_KEY}`;
      const ws = new WebSocket(wsUrl);
      
      websocketRef.current = ws;
      
      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsRecording(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'transcript') {
            onTranscriptUpdate(data.text);
          }
        } catch (e) {
          console.warn("Failed to parse WebSocket message:", event.data);
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError("WebSocket error: " + error.message);
      };
      
      ws.onclose = () => {
        setIsRecording(false);
      };
      
      // Setup MediaRecorder for streaming audio
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(event.data);
        }
      };
      
      mediaRecorder.start(1000); // Send data every 1 second
    } catch (err) {
      console.error("Error starting recording:", err);
      onError("Gagal memulai recording: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    
    setIsRecording(false);
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
}