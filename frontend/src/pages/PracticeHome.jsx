import React, { useState, useEffect, useCallback } from 'react';
import { fetchPracticeTemplates, fetchPracticeHistory } from '../services/api';

const TYPE_ICON_CLASSES = {
  email: 'fa-solid fa-envelope', email_simple: 'fa-solid fa-envelope', email_professional: 'fa-solid fa-envelope-open-text',
  letter: 'fa-solid fa-file-lines', report: 'fa-solid fa-chart-column', conversation: 'fa-solid fa-comments',
  article: 'fa-solid fa-newspaper', essay: 'fa-solid fa-pen-nib', essay_argumentative: 'fa-solid fa-pen-nib',
  journal: 'fa-solid fa-book', message: 'fa-solid fa-comment-dots', description: 'fa-solid fa-pencil',
  story: 'fa-solid fa-book-open', meeting_notes: 'fa-solid fa-clipboard-list', cover_letter: 'fa-solid fa-file-signature',
};
const TYPE_COLORS = {
  email: '#3B82F6', email_simple: '#3B82F6', email_professional: '#1D4ED8',
  letter: '#8B5CF6', cover_letter: '#7C3AED', report: '#F97316',
  conversation: '#10B981', article: '#EAB308', essay: '#EF4444', essay_argumentative: '#DC2626',
  journal: '#06B6D4', message: '#EC4899', description: '#14B8A6',
  story: '#A855F7', meeting_notes: '#64748B',
};
const TYPE_BG = {
  email: '#EFF6FF', email_simple: '#EFF6FF', email_professional: '#EFF6FF',
  letter: '#F5F3FF', cover_letter: '#F5F3FF', report: '#FFF7ED',
  conversation: '#ECFDF5', article: '#FEFCE8', essay: '#FEF2F2', essay_argumentative: '#FEF2F2',
  journal: '#ECFEFF', message: '#FDF2F8', description: '#F0FDFA',
  story: '#FAF5FF', meeting_notes: '#F8FAFC',
};
const LEVEL_COLORS = {
  beginner: { bg: '#ECFDF5', color: '#16A34A', label: 'Beginner' },
  intermediate: { bg: '#FFFBEB', color: '#D97706', label: 'Intermediate' },
  advanced: { bg: '#FEF2F2', color: '#DC2626', label: 'Advanced' },
};
const DIFFICULTY_STARS = (n) =>
  Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < n ? '#F59E0B' : '#E2E8F0', fontSize: '0.75rem' }}>★</span>
  ));

const FILTERS = [
  'all', 'email', 'letter', 'essay', 'report',
  'journal', 'conversation', 'message', 'article',
  'story', 'description', 'cover_letter', 'meeting_notes',
];

// Get a clean label for filter buttons
const FILTER_LABEL = (f) => {
  const names = {
    email: 'Email', letter: 'Letter', essay: 'Essay', report: 'Report',
    journal: 'Journal', conversation: 'Conversation', message: 'Message',
    article: 'Article', story: 'Story', description: 'Description',
    cover_letter: 'Cover Letter', meeting_notes: 'Meeting Notes',
    all: 'All Types',
  };
  return names[f] || f;
};

const getTypeIconClass = (type) => TYPE_ICON_CLASSES[type] || 'fa-solid fa-file-pen';

export default function PracticeHome({ onNavigate }) {
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total_done: 0, avg_score: 0 });
  const [userLevel, setUserLevel] = useState('beginner');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(true);

  useEffect(() => {
    fetchPracticeTemplates()
      .then(d => {
        setTemplates(d.templates || []);
        setUserLevel(d.user_level || 'beginner');
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetchPracticeHistory()
      .then(d => {
        setHistory(d.history || []);
        setStats(d.stats || { total_done: 0, avg_score: 0 });
      })
      .catch(console.error)
      .finally(() => setHistLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? templates
    : templates.filter(t => {
        if (filter === 'email') return t.type === 'email' || t.type?.startsWith('email');
        if (filter === 'essay') return t.type === 'essay' || t.type?.startsWith('essay');
        return t.type === filter;
      });

  const handleRandom = () => {
    const available = filtered.filter(t => !t.locked);
    if (!available.length) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    onNavigate('editor', pick.task_id);
  };

  const levelInfo = LEVEL_COLORS[userLevel] || LEVEL_COLORS.beginner;

  return (
    <div className="pw-root" style={{ maxWidth: 1320, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeInUp 0.4s ease' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes popIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        .pw-card { background:#fff; border-radius:16px; border:1px solid #E2E8F0; transition:box-shadow 0.2s, transform 0.2s; cursor:pointer; position:relative; overflow:hidden; }
        .pw-card:hover:not(.pw-locked) { box-shadow:0 8px 24px rgba(0,0,0,0.10); transform:translateY(-2px); }
        .pw-card.pw-locked { cursor:not-allowed; opacity:0.65; }
        .pw-filter-btn { border:1.5px solid #E2E8F0; background:#fff; border-radius:999px; padding:6px 16px; font-size:0.8rem; font-weight:600; cursor:pointer; transition:all 0.15s; color:#64748B; font-family:inherit; }
        .pw-filter-btn.active { background:#2563EB; border-color:#2563EB; color:#fff; }
        .pw-filter-btn:hover:not(.active) { border-color:#94A3B8; color:#1E293B; }
        .pw-done-badge { position:absolute; top:10px; right:10px; background:#DCFCE7; color:#16A34A; border-radius:999px; font-size:0.68rem; font-weight:700; padding:2px 8px; }
        .pw-credit-badge { background:#FEF9C3; color:#B45309; border-radius:999px; font-size:0.78rem; font-weight:700; padding:3px 10px; display:inline-flex; align-items:center; gap:4px; }
        .pw-start-btn { width:100%; padding:10px; background:#2563EB; color:#fff; border:none; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:background 0.15s; font-family:inherit; margin-top:8px; }
        .pw-start-btn:hover { background:#1D4ED8; }
        .pw-hist-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #F1F5F9; }
      `}</style>

      {/* ── Header ── */}
      <div className="pw-header-card" style={{ background: 'linear-gradient(135deg,#EFF6FF,#F0FDF4)', borderRadius: 18, padding: '1.5rem 2rem', border: '1px solid #DBEAFE' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E293B', margin: 0, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <i className="fa-solid fa-pen-ruler" style={{ color: '#2563EB' }}></i>
              Practice Mode
            </h1>
            <p style={{ color: '#64748B', margin: '4px 0 0', fontSize: '0.9rem' }}>Improve your writing with real tasks</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="pw-stat-card" style={{ background: '#fff', borderRadius: 12, padding: '0.75rem 1.25rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Your Level</p>
              <p style={{ margin: 0, fontWeight: 700, color: levelInfo.color, fontSize: '0.9rem' }}>{levelInfo.label}</p>
            </div>
            <div className="pw-stat-card" style={{ background: '#fff', borderRadius: 12, padding: '0.75rem 1.25rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Tasks Done</p>
              <p style={{ margin: 0, fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}>{histLoading ? '—' : stats.total_done}</p>
            </div>
            <div className="pw-stat-card" style={{ background: '#fff', borderRadius: 12, padding: '0.75rem 1.25rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Avg Score</p>
              <p style={{ margin: 0, fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}>{histLoading ? '—' : `${stats.avg_score}/10`}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              className={`pw-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? (
                'All Types'
              ) : (
                <>
                  <i className={getTypeIconClass(f)} style={{ marginRight: 6 }}></i>
                  {FILTER_LABEL(f)}
                </>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={handleRandom}
          style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 20px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
        >
          <i className="fa-solid fa-shuffle"></i>
          Random Task
        </button>
      </div>

      {/* ── Task Cards ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 220, borderRadius: 16, background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.4s infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
          <p style={{ fontSize: '2rem' }}><i className="fa-regular fa-folder-open"></i></p>
          <p style={{ fontWeight: 600 }}>No tasks found for this filter</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
          {filtered.map(task => (
            <TaskCard
              key={task.task_id}
              task={task}
              onStart={() => !task.locked && onNavigate('editor', task.task_id)}
            />
          ))}
        </div>
      )}

      {/* ── Recent History ── */}
      <div className="pw-history-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1E293B', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-clock-rotate-left" style={{ color: '#2563EB' }}></i>
          Recent Practice
        </h2>
        {histLoading ? (
          <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Loading history...</p>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8' }}>
            <p style={{ fontSize: '1.5rem' }}><i className="fa-solid fa-seedling"></i></p>
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No practice yet - start your first task above!</p>
          </div>
        ) : (
          history.map((item, i) => (
            <div key={i} className="pw-hist-row">
              <div style={{ width: 38, height: 38, borderRadius: 10, background: TYPE_BG[item.task_type] || '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                <i className={getTypeIconClass(item.task_type)} style={{ color: TYPE_COLORS[item.task_type] || '#64748B' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#1E293B', fontSize: '0.875rem' }}>
                  {item.task_type ? item.task_type.charAt(0).toUpperCase() + item.task_type.slice(1) : ''} - {item.task_title}
                </p>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.75rem' }}>
                  {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: 800, color: item.overall_score >= 7 ? '#16A34A' : item.overall_score >= 5 ? '#D97706' : '#DC2626', fontSize: '0.95rem' }}>
                  {item.overall_score}/10
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#94A3B8' }}>
                  <i className="fa-solid fa-coins" style={{ marginRight: 4, color: '#D97706' }}></i>
                  +{item.credits_earned} pts
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onStart }) {
  const typeColor = TYPE_COLORS[task.type] || '#2563EB';
  const typeBg = TYPE_BG[task.type] || '#EFF6FF';
  const iconClass = getTypeIconClass(task.type);
  const lvl = LEVEL_COLORS[task.level] || LEVEL_COLORS.beginner;

  return (
    <div
      className={`pw-card${task.locked ? ' pw-locked' : ''}`}
      onClick={onStart}
      style={{ borderLeft: `4px solid ${typeColor}`, padding: '1.25rem' }}
    >
      {/* Done badge */}
      {task.times_done > 0 && !task.locked && (
        <div className="pw-done-badge"><i className="fa-solid fa-circle-check" style={{ marginRight: 4 }}></i>Done before</div>
      )}

      {/* Icon + type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
          <i className={iconClass} style={{ color: typeColor }}></i>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: typeColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {task.type}
          </p>
          <p style={{ margin: 0, fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>{task.title}</p>
        </div>
      </div>

      {/* Description */}
      <p style={{ margin: '0 0 12px', color: '#64748B', fontSize: '0.8rem', lineHeight: 1.5 }}>
        {task.description}
      </p>

      {/* Stars + level */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>{DIFFICULTY_STARS(task.difficulty || 1)}</div>
        <span style={{ background: lvl.bg, color: lvl.color, borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px' }}>
          {lvl.label}
        </span>
      </div>

      {/* Credits + last score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="pw-credit-badge"><i className="fa-solid fa-coins"></i> {task.credits} pts</span>
        {task.last_score !== null && task.last_score !== undefined && (
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Last: {task.last_score}/10</span>
        )}
      </div>

      {/* CTA */}
      {task.locked ? (
        <div style={{ marginTop: 8, padding: '10px', background: '#F8FAFC', borderRadius: 10, textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>
            <i className="fa-solid fa-lock" style={{ marginRight: 6 }}></i>
            Requires {LEVEL_COLORS[task.level]?.label || 'higher'} level
          </p>
        </div>
      ) : (
        <button className="pw-start-btn">Start →</button>
      )}
    </div>
  );
}
