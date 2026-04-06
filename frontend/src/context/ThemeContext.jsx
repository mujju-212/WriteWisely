import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

function resolveInitialTheme() {
	const stored = localStorage.getItem('ww_theme');
	if (stored === 'dark' || stored === 'light') {
		return stored;
	}

	const prefersDark =
		typeof window !== 'undefined' &&
		window.matchMedia &&
		window.matchMedia('(prefers-color-scheme: dark)').matches;

	return prefersDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
	const [theme, setTheme] = useState(resolveInitialTheme);

	useEffect(() => {
		const root = document.documentElement;
		root.classList.toggle('dark', theme === 'dark');
		localStorage.setItem('ww_theme', theme);
	}, [theme]);

	const value = useMemo(() => ({
		theme,
		setTheme,
		toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
	}), [theme]);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within ThemeProvider');
	}
	return context;
}
