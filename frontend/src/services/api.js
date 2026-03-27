/**
 * services/api.js — WriteWisely API Client
 * All backend calls go through here.
 * Token is read from localStorage (set by auth flow).
 */

const BASE = '/api';

function getToken() {
  return localStorage.getItem('ww_token') || '';
}

async function api(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────
export const login = (phone, password) =>
  api('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) });

export const register = (data) =>
  api('/auth/register', { method: 'POST', body: JSON.stringify(data) });

export const getMe = () => api('/auth/me');

// ─── Dashboard ────────────────────────────────────────────
export const fetchDashboard = () => api('/analytics/dashboard');

// ─── Analytics ────────────────────────────────────────────
export const fetchAnalytics = (period = 'weekly') =>
  api(`/analytics/overview?period=${period}`);

// ─── Learning ─────────────────────────────────────────────
export const fetchLevels = () => api('/learning/levels');
export const fetchLesson = (levelId) => api(`/learning/levels/${levelId}`);
export const markLessonComplete = (levelId) =>
  api(`/learning/lesson/${levelId}/complete`, { method: 'POST', body: JSON.stringify({}) });
export const submitQuiz = (levelId, answers) =>
  api(`/learning/quiz/${levelId}`, { method: 'POST', body: JSON.stringify({ answers }) });
export const submitAssignment = (levelId, text) =>
  api(`/learning/assignment/${levelId}`, { method: 'POST', body: JSON.stringify({ text }) });

// ─── Practice ─────────────────────────────────────────────
export const fetchPracticeTemplates = () => api('/practice/templates');
export const submitPractice = (data) =>
  api('/practice/submit', { method: 'POST', body: JSON.stringify(data) });

// ─── Checker ──────────────────────────────────────────────
export const checkText = (text, mode, context) =>
  api('/checker/check', { method: 'POST', body: JSON.stringify({ text, mode, context }) });

// ─── Projects ─────────────────────────────────────────────
export const fetchProjects = () => api('/projects');
export const createProject = (data) =>
  api('/projects', { method: 'POST', body: JSON.stringify(data) });
export const updateProject = (id, data) =>
  api(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProject = (id) =>
  api(`/projects/${id}`, { method: 'DELETE' });

// ─── Chat ─────────────────────────────────────────────────
export const fetchChatHistory = () => api('/chat/history');
export const sendChatMessage = (message) =>
  api('/chat/send', { method: 'POST', body: JSON.stringify({ message }) });
export const clearChat = () => api('/chat/clear', { method: 'DELETE' });
export async function uploadChatDocument(file, title = '') {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  if (title) {
    form.append('title', title);
  }

  const res = await fetch(`${BASE}/chat/upload-document`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Settings ─────────────────────────────────────────────
export const updateSettings = (data) =>
  api('/analytics/settings', { method: 'PUT', body: JSON.stringify(data) });

export default api;
