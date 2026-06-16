const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const getAuthToken = () => localStorage.getItem('token');
export const getUserId = () => localStorage.getItem('userId');
export const register = async (data) => {
  const API_KEY = import.meta.env.VITE_API_KEY;
  const res = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error('Register gagal');
  }

  return result;
};

export const login = async (data) => {
  const API_KEY = import.meta.env.VITE_API_KEY;
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error('Login gagal');
  }

  return res.json();
};

export const createMeeting = async (title, userId) => {
  const token = getAuthToken();
  const API_KEY = import.meta.env.VITE_API_KEY;
  const res = await fetch(`${BASE_URL}/api/v1/meetings/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({ title, user_id: userId })
  });

  if (!res.ok) {
    throw new Error('Gagal membuat meeting');
  }

  return await res.text();
};