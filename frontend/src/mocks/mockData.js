export const isMockMode = () => import.meta.env.VITE_USE_MOCKS === 'true';

export const mockUser = {
  id: 'mock-user-001',
  email: 'frontend@meetmind.local',
  full_name: 'Frontend Preview',
  avatar_url: '',
  notifications_enabled: true,
};

export const mockTranscript = `Rapat hari ini membahas progress halaman MeetMind, terutama tampilan recorder, riwayat meeting, profil, dan export hasil analisis. Tim sepakat untuk memprioritaskan polish visual terlebih dahulu sambil menunggu backend final. Beberapa state seperti loading, empty state, error, dan hasil AI perlu terlihat konsisten di desktop dan mobile.`;

export const mockMeetings = [
  {
    meeting_id: 'mock-meeting-001',
    title: 'Design Review MeetMind',
    status: 'completed',
    created_at: '2026-06-26T09:30:00.000Z',
    summary: 'Review tampilan recorder, panel AI, export modal, dan profile page untuk kebutuhan demo frontend.',
    full_transcript: mockTranscript,
    diarized_transcript:
      'Sayyid: Kita fokus rapikan tampilan dulu.\nAika: Backend belum final, jadi mock data cukup untuk preview.\nSayyid: Pastikan flow login sampai meeting bisa dilihat.',
    action_items: [
      { task: 'Rapikan spacing halaman meeting', assignee: 'Frontend', deadline: 'Hari ini', priority: 'High' },
      { task: 'Cek tampilan export modal', assignee: 'Frontend', deadline: 'Besok', priority: 'Medium' },
      { task: 'Siapkan state kosong dan loading', assignee: 'Frontend', deadline: 'Besok', priority: 'Medium' },
    ],
    recommendations: [
      { title: 'Gunakan mock mode untuk demo UI', detail: 'Backend dapat diintegrasikan setelah endpoint stabil.', priority: 'High' },
      { title: 'Pisahkan visual polish dari integrasi API', detail: 'Ini mengurangi blocking dan mempercepat review tampilan.', priority: 'Medium' },
    ],
  },
  {
    meeting_id: 'mock-meeting-002',
    title: 'Weekly Product Sync',
    status: 'completed',
    created_at: '2026-06-25T13:00:00.000Z',
    summary: 'Sinkronisasi progress fitur upload audio, transkrip, dan regenerasi summary.',
  },
  {
    meeting_id: 'mock-meeting-003',
    title: 'Frontend QA Pass',
    status: 'draft',
    created_at: '2026-06-24T16:15:00.000Z',
    summary: 'Pengecekan lint, build, responsive layout, dan copy tombol.',
  },
];

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockLogin = async () => {
  await wait();
  return {
    access_token: 'mock-token',
    user_id: mockUser.id,
  };
};

export const mockRegister = async () => {
  await wait();
  return {
    message: 'Mock register success',
  };
};

export const mockCreateMeeting = async (title) => {
  await wait();
  return {
    meeting_id: `mock-meeting-${Date.now()}`,
    title: title || 'Meeting Preview',
  };
};

export const mockAnalyzeMeeting = async ({ meetingId, title, transcript }) => {
  await wait(500);
  return {
    ...mockMeetings[0],
    meeting_id: meetingId || `mock-meeting-${Date.now()}`,
    title: title || 'Meeting Preview',
    full_transcript: transcript || mockTranscript,
    created_at: new Date().toISOString(),
  };
};

export const mockUpdateMeeting = async (meetingId, payload = {}) => {
  await wait();
  const base = mockMeetings.find((meeting) => meeting.meeting_id === meetingId) || mockMeetings[0];
  if (payload.re_analyze) {
    return {
      ...base,
      summary: 'Summary mock berhasil diregenerasi dengan fokus pada prioritas UI, state halaman, dan kesiapan demo.',
      action_items: [
        { task: 'Finalisasi warna dan spacing', assignee: 'Frontend', deadline: 'Hari ini', priority: 'High' },
        { task: 'Validasi mobile view', assignee: 'Frontend', deadline: 'Besok', priority: 'Medium' },
      ],
      recommendations: [
        { title: 'Lanjutkan polish UI', detail: 'Mock mode sudah cukup untuk review tampilan tanpa backend.', priority: 'High' },
      ],
    };
  }

  return {
    ...base,
    ...payload,
    meeting_id: meetingId,
  };
};
