/**
 * hooks/useDashboard.js — WriteWisely
 * Fetches all 8 dashboard sections from the backend in one call.
 * Returns { data, loading, error, refetch }
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchDashboard } from '../services/api';

export function useDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    // Only fetch if we have a token (user is logged in)
    const token = localStorage.getItem('ww_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetchDashboard();
      setData(result);
    } catch (err) {
      console.warn('[useDashboard] fetch failed:', err.message);
      setError(err.message);
      // Keep data as null → component falls back to dummy UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
