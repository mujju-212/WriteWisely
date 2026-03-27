/**
 * dataService.js — WriteWisely Data Service
 * All learning / progress API calls.
 * Uses the shared api() helper from api.js.
 */
import api from './api.js';

// ── Learning ──────────────────────────────────────────────────
/** GET /api/learning/levels — all 30 levels with user progress */
export const getAllLevels = () => api('/learning/levels');

/** GET /api/learning/levels/:id — full lesson + user progress */
export const getLesson = (levelId) => api(`/learning/levels/${levelId}`);

/** POST /api/learning/lesson/:id/complete — mark lesson read, earn +10 credits */
export const markLessonRead = (levelId) =>
  api(`/learning/lesson/${levelId}/complete`, { method: 'POST', body: JSON.stringify({}) });

/** POST /api/learning/quiz/:id — submit quiz answers */
export const submitQuiz = (levelId, answers) =>
  api(`/learning/quiz/${levelId}`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });

/** POST /api/learning/assignment/:id — submit assignment text for LLM grading */
export const submitAssignment = (levelId, text) =>
  api(`/learning/assignment/${levelId}`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
