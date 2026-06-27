import { isMockMode, mockMeetings, mockUpdateMeeting } from '../mocks/mockData'

/**
 * Meeting API Service
 *
 * Consolidates REST calls to /api/v1/meetings/*. Mengikuti pola yang sudah ada:
 * raw fetch() + header Authorization (Bearer) + X-API-Key.
 *
 * Token diambil dari localStorage('token') supaya konsisten dengan authService.
 */
const BASE_URL = import.meta.env.VITE_BACKEND_URL
const API_KEY = import.meta.env.VITE_API_KEY

const authHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
    'X-API-Key': API_KEY,
  }
}

/**
 * GET /api/v1/meetings/{meeting_id}
 * Ambil detail satu meeting (untuk edit / export / regenerate).
 */
export const getMeetingDetail = async (meetingId) => {
  if (isMockMode()) {
    return mockMeetings.find((meeting) => meeting.meeting_id === meetingId) || mockMeetings[0]
  }

  if (!meetingId) throw new Error('meetingId wajib diisi')
  const res = await fetch(`${BASE_URL}/api/v1/meetings/${meetingId}`, {
    method: 'GET',
    headers: authHeaders(),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Gagal mengambil detail meeting: ${msg}`)
  }
  return res.json()
}

/**
 * PATCH /api/v1/meetings/{meeting_id}
 * Edit judul / transkrip. Set re_analyze=true untuk regenerasi summary AI.
 *
 * @param {string} meetingId
 * @param {{ title?: string, full_transcript?: string, re_analyze?: boolean }} payload
 */
export const updateMeeting = async (meetingId, payload) => {
  if (isMockMode()) return mockUpdateMeeting(meetingId, payload)

  if (!meetingId) throw new Error('meetingId wajib diisi')
  const res = await fetch(`${BASE_URL}/api/v1/meetings/${meetingId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Gagal mengupdate meeting: ${msg}`)
  }
  return res.json()
}

/**
 * Helper untuk regenerasi summary — membungkus updateMeeting dengan re_analyze=true.
 * Returns response berisi summary + action_items + recommendations baru.
 */
export const regenerateSummary = async (meetingId) => {
  return updateMeeting(meetingId, { re_analyze: true })
}

/**
 * Counter regenerasi per meeting, disimpan di localStorage.
 * Backend tidak melacak ini, jadi FE yang mengatur limit 3x.
 */
export const REGEN_LIMIT = 3

export const getRegenCount = (meetingId) => {
  if (!meetingId) return 0
  return Number(localStorage.getItem(`regen_count:${meetingId}`) || '0')
}

export const bumpRegenCount = (meetingId) => {
  if (!meetingId) return 0
  const next = getRegenCount(meetingId) + 1
  localStorage.setItem(`regen_count:${meetingId}`, String(next))
  return next
}

export const canRegenerate = (meetingId) => getRegenCount(meetingId) < REGEN_LIMIT
