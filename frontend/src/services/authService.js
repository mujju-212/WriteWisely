import api from './api.js';

function clearLocalAuth() {
	localStorage.removeItem('ww_token');
	localStorage.removeItem('ww_user');
}

export function getCurrentUser() {
	try {
		return JSON.parse(localStorage.getItem('ww_user') || '{}');
	} catch {
		return {};
	}
}

export function isAuthenticated() {
	return Boolean(localStorage.getItem('ww_token'));
}

export async function logout() {
	try {
		await api('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
	} catch {
		// Clear local auth regardless of backend logout response.
	} finally {
		clearLocalAuth();
	}
}

export default {
	getCurrentUser,
	isAuthenticated,
	logout,
};
