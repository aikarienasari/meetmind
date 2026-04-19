import { useState, useEffect } from 'react';

export function MeetingHistory() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('User tidak ditemukan');
        }

        const API_KEY = "key1";
        const res = await fetch(`http://localhost:8000/api/v1/meetings/user/${userId}`, {
          headers: {
            "X-API-Key": API_KEY,
          }
        });

        if (!res.ok) {
          throw new Error('Gagal mengambil riwayat meeting');
        }

        const data = await res.json();
        setMeetings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  if (loading) return <div>Loading riwayat meeting...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="meeting-history">
      <h3>Riwayat Meeting</h3>
      {meetings.length === 0 ? (
        <p>Belum ada riwayat meeting</p>
      ) : (
        <ul>
          {meetings.map(meeting => (
            <li key={meeting.meeting_id}>
              <h4>{meeting.title}</h4>
              <p>Tanggal: {new Date(meeting.created_at).toLocaleString()}</p>
              <p>Status: {meeting.status}</p>
              {meeting.summary && <p>Ringkasan: {meeting.summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}