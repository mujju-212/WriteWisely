import React, { useState, useEffect } from 'react';
import {
  BookOpen, Lock, CheckCircle, Play, Clock, Star,
  ChevronRight, Loader2, AlertCircle, Trophy, Zap
} from 'lucide-react';
import { getAllLevels } from '../services/dataService';

const ALL_LEVELS = [
  { level: 1, title: 'Basic Spelling Rules', category: 'beginner' },
  { level: 2, title: 'Common Misspellings', category: 'beginner' },
  { level: 3, title: 'Capitalization Rules', category: 'beginner' },
  { level: 4, title: 'Basic Punctuation', category: 'beginner' },
  { level: 5, title: 'Subject-Verb Agreement', category: 'beginner' },
  { level: 6, title: 'Apostrophes & Contractions', category: 'beginner' },
  { level: 7, title: 'Articles (a, an, the)', category: 'beginner' },
  { level: 8, title: 'Basic Tenses', category: 'beginner' },
  { level: 9, title: 'Common Homophones', category: 'beginner' },
  { level: 10, title: 'Beginner Assessment', category: 'beginner' },
  { level: 11, title: 'Advanced Punctuation', category: 'intermediate' },
  { level: 12, title: 'Complex Sentences', category: 'intermediate' },
  { level: 13, title: 'Active vs Passive Voice', category: 'intermediate' },
  { level: 14, title: 'Commonly Confused Words', category: 'intermediate' },
  { level: 15, title: 'Paragraph Structure', category: 'intermediate' },
  { level: 16, title: 'Transition Words', category: 'intermediate' },
  { level: 17, title: 'Advanced Tenses', category: 'intermediate' },
  { level: 18, title: 'Prepositions', category: 'intermediate' },
  { level: 19, title: 'Formal vs Informal Writing', category: 'intermediate' },
  { level: 20, title: 'Intermediate Assessment', category: 'intermediate' },
  { level: 21, title: 'Style & Tone', category: 'advanced' },
  { level: 22, title: 'Conciseness', category: 'advanced' },
  { level: 23, title: 'Advanced Punctuation (Em Dash)', category: 'advanced' },
  { level: 24, title: 'Parallel Structure', category: 'advanced' },
  { level: 25, title: 'Conditional Sentences', category: 'advanced' },
  { level: 26, title: 'Academic Writing', category: 'advanced' },
  { level: 27, title: 'Business Writing', category: 'advanced' },
  { level: 28, title: 'Creative Writing Techniques', category: 'advanced' },
  { level: 29, title: 'Editing & Proofreading', category: 'advanced' },
  { level: 30, title: 'Final Assessment', category: 'advanced' },
];

const CAT_CONFIG = {
  beginner:     { emoji: '🟢', label: 'Beginner',     range: '1–10',  accent: '#16A34A', bg: '#F0FDF4', border: '#86EFAC', textColor: '#15803D' },
  intermediate: { emoji: '🟡', label: 'Intermediate', range: '11–20', accent: '#D97706', bg: '#FEFCE8', border: '#FCD34D', textColor: '#B45309' },
  advanced:     { emoji: '🔴', label: 'Advanced',     range: '21–30', accent: '#DC2626', bg: '#FFF1F2', border: '#FCA5A5', textColor: '#B91C1C' },
};

function LevelCard({ level, title, category, status, quizScore, quizTotal, creditsEarned, onClick }) {
  const cat = CAT_CONFIG[category] || CAT_CONFIG.beginner;
  const isComingSoon = status === 'coming_soon';
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const isAvailable = status === 'available';

  const cardStyle = {
    background: '#fff',
    borderRadius: 16,
    padding: '1.1rem 1.25rem',
    cursor: isComingSoon ? 'default' : 'pointer',
    opacity: isComingSoon ? 0.6 : 1,
    border: `1.5px solid ${isCompleted ? cat.border : isInProgress ? '#A5B4FC' : isAvailable ? '#E5E7EB' : '#E5E7EB'}`,
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <div
      style={cardStyle}
      onClick={isComingSoon ? undefined : onClick}
      onMouseEnter={(e) => { if (!isComingSoon) { e.currentTarget.style.boxShadow = '0 6px 20px rgba(91,95,222,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: isCompleted ? cat.bg : isInProgress ? '#EEF0FF' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: isCompleted ? cat.textColor : isInProgress ? '#5B5FDE' : '#6B7280' }}>
            {String(level).padStart(2, '0')}
          </div>
          {isInProgress && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5B5FDE', boxShadow: '0 0 0 3px rgba(91,95,222,0.2)', animation: 'pulse 1.5s infinite' }} />}
        </div>
        {isCompleted && <CheckCircle style={{ width: 18, height: 18, color: cat.accent, flexShrink: 0 }} />}
        {isInProgress && <BookOpen style={{ width: 16, height: 16, color: '#5B5FDE', flexShrink: 0 }} />}
        {isAvailable && <Play style={{ width: 16, height: 16, color: '#9CA3AF', flexShrink: 0 }} />}
        {isComingSoon && <Lock style={{ width: 16, height: 16, color: '#D1D5DB', flexShrink: 0 }} />}
      </div>

      {/* Title */}
      <p style={{ fontSize: '0.825rem', fontWeight: 700, color: isComingSoon ? '#9CA3AF' : '#111827', marginBottom: 6, lineHeight: 1.3 }}>{title}</p>

      {/* Status area */}
      {isCompleted && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {quizScore !== undefined && <span style={{ fontSize: '0.72rem', color: cat.textColor, fontWeight: 600 }}>Score: {quizScore}/{quizTotal}</span>}
          {creditsEarned > 0 && <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 700 }}>⭐ {creditsEarned} cr</span>}
        </div>
      )}
      {isInProgress && <p style={{ fontSize: '0.75rem', color: '#5B5FDE', fontWeight: 600 }}>Continue →</p>}
      {isAvailable && <p style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 500 }}>Start →</p>}
      {isComingSoon && <p style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coming Soon</p>}
    </div>
  );
}

export default function LearningHome({ onNavigateToLesson }) {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getAllLevels()
      .then((res) => {
        if (cancelled) return;
        const apiLevels = res?.levels || res || [];
        const apiMap = {};
        apiLevels.forEach((l) => { apiMap[l.level_id || l.level] = l; });
        const merged = ALL_LEVELS.map((def) => {
          const api = apiMap[def.level];
          if (!api) return { ...def, status: def.level <= 5 ? 'available' : 'coming_soon', available: def.level <= 5 };
          return { ...def, ...api, available: def.level <= 5 };
        });
        setLevels(merged);
      })
      .catch(() => {
        // Fallback: use static definitions for coming soon
        const fallback = ALL_LEVELS.map((d) => ({ ...d, status: d.level === 1 ? 'available' : d.level <= 5 ? 'locked' : 'coming_soon', available: d.level <= 5 }));
        if (!cancelled) { setLevels(fallback); setError('Could not load progress from server'); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const completedCount = levels.filter((l) => l.status === 'completed').length;
  const progressPct = levels.length > 0 ? Math.round((completedCount / 30) * 100) : 0;

  const sections = [
    { key: 'beginner', levels: levels.filter((l) => l.category === 'beginner') },
    { key: 'intermediate', levels: levels.filter((l) => l.category === 'intermediate') },
    { key: 'advanced', levels: levels.filter((l) => l.category === 'advanced') },
  ];

  return (
    <div style={{ maxWidth: 1320, width: '100%', margin: '0 auto', padding: '0 0 3rem', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.15)} }`}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #5B5FDE 0%, #4F46E5 100%)', borderRadius: 20, padding: '2rem 2.25rem', marginBottom: 28, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <BookOpen style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.85)' }} />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Learning Path</h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', margin: 0 }}>Your journey to grammar mastery — 30 structured levels</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1, marginBottom: 2 }}>{completedCount}<span style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>/30</span></p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>levels completed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: 28, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(91,95,222,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1F2937', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy style={{ width: 16, height: 16, color: '#D97706' }} /> Overall Progress
          </span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#5B5FDE' }}>{progressPct}%</span>
        </div>
        <div style={{ height: 10, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #5B5FDE, #818CF8)', borderRadius: 999, transition: 'width 0.8s ease' }} />
        </div>
        {error && <p style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle style={{ width: 12, height: 12 }} />{error}</p>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
          <Loader2 style={{ width: 32, height: 32, margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
          <p>Loading your learning path…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        sections.map(({ key, levels: sLevels }) => {
          const cat = CAT_CONFIG[key];
          return (
            <div key={key} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: '1.2rem' }}>{cat.emoji}</span>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1F2937', margin: 0 }}>{cat.label}</h2>
                  <p style={{ fontSize: '0.76rem', color: '#6B7280', margin: 0 }}>Levels {cat.range}</p>
                </div>
                <div style={{ flex: 1, height: 1, background: '#E5E7EB', marginLeft: 8 }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cat.textColor, background: cat.bg, padding: '3px 10px', borderRadius: 999 }}>
                  {sLevels.filter((l) => l.status === 'completed').length}/{sLevels.length} done
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {sLevels.map((l) => (
                  <LevelCard
                    key={l.level}
                    level={l.level}
                    title={l.title}
                    category={l.category}
                    status={l.status}
                    quizScore={l.quiz_score}
                    quizTotal={l.quiz_total}
                    creditsEarned={l.credits_earned}
                    onClick={() => onNavigateToLesson?.(l.level)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
