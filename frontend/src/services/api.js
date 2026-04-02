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
export const login = (email, password) =>
  api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (data) =>
  api('/auth/register', { method: 'POST', body: JSON.stringify(data) });

export const getMe = () => api('/auth/me');

// ─── Analytics ────────────────────────────────────────────
export const fetchDashboard = () => api('/analytics/dashboard');
export const fetchAnalytics = (period = 'weekly') =>
  api(`/analytics/overview?period=${period}`);
export const fetchAnalyticsOverview = (period = 'weekly') =>
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
export const getPracticeTask = (taskId) => api(`/practice/templates/${taskId}`);
export const checkLiveText = (text, taskType) =>
  api('/practice/check', { method: 'POST', body: JSON.stringify({ text, task_type: taskType }) });
export const submitPractice = (data) =>
  api('/practice/submit', { method: 'POST', body: JSON.stringify(data) });
export const fetchPracticeHistory = () => api('/practice/history');

// ─── Checker ──────────────────────────────────────────────
export const checkText = (text, mode, context) =>
  api('/checker/check', { method: 'POST', body: JSON.stringify({ text, mode, context }) });

// ─── Projects ─────────────────────────────────────────────
export const fetchProjects = () => api('/project/list');
export const getProject = (id) => api(`/project/${id}`);
export const createProject = (data) =>
  api('/project/create', { method: 'POST', body: JSON.stringify(data) });
export const updateProject = (id, data) =>
  api(`/project/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProject = (id) =>
  api(`/project/${id}`, { method: 'DELETE' });

// ─── Chat ─────────────────────────────────────────────────
export const fetchChatHistory = () => api('/chat/history');
export const sendChatMessage = (message, documentIds = []) =>
  api('/chat/send', {
    method: 'POST',
    body: JSON.stringify({ message, document_ids: documentIds }),
  });
export const fetchChatDocuments = () => api('/chat/documents');
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

// ─── Notifications ────────────────────────────────────────
export const fetchNotifications = () => api('/notifications');
export const markNotificationsRead = (notificationIds = []) =>
  api('/notifications/mark-read', {
    method: 'PATCH',
    body: JSON.stringify({ notification_ids: notificationIds }),
  });
export const markAllNotificationsRead = () =>
  api('/notifications/mark-all-read', { method: 'PATCH', body: JSON.stringify({}) });

// ─── Settings ─────────────────────────────────────────────
export const updateSettings = (data) =>
  api('/analytics/settings', { method: 'PUT', body: JSON.stringify(data) });

export default api;
