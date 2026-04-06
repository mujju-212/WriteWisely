import React, { useState, useRef, useEffect } from 'react';
import './Dashboard.css';
import { useDashboard } from '../hooks/useDashboard';
import LearningHome from './LearningHome';
import Lesson from './Lesson';
import PracticeHome from './PracticeHome';
import PracticeEditor from './PracticeEditor';
import Projects from './Projects';
import Analytics from './Analytics';
import {
  fetchChatConversations,
  createChatConversation,
  updateChatConversation,
  deleteChatConversation,
  fetchChatHistory,
  fetchChatDocuments,
  deleteChatDocument,
  sendChatMessage,
  uploadChatDocument,
  fetchDashboard as fetchDashboardData,
  fetchUserProfile,
  updateUserProfile,
  changeUserPassword,
  updateSettings,
  exportUserData,
  deleteUserAccount,
} from '../services/api';
import NotificationBell from '../components/NotificationBell';
import ProfileDropdown from '../components/ProfileDropdown';
import authService from '../services/authService';
import { useTheme } from '../context/ThemeContext';

// ──────────────────────────────────────────────────────────────────────────────
// DASHBOARD VIEW — wired to real backend data via useDashboard()
// All other view components (Learning, Practice, etc.) are below, unchanged.
// ──────────────────────────────────────────────────────────────────────────────

/* Tiny skeleton pulse block */
function Skel({ w = '100%', h = 18, r = 8 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'ww-pulse 1.4s ease-in-out infinite',
    }} />
  );
}

/* Badge colour map */
const BADGE_COLORS = {
  first_steps:   { bg: '#FEF9C3', color: '#CA8A04', iconClass: 'fa-solid fa-award' },
  bookworm:      { bg: '#DBEAFE', color: '#2563EB', iconClass: 'fa-solid fa-book-open' },
  writer:        { bg: '#F3E8FF', color: '#9333EA', iconClass: 'fa-solid fa-pen-nib' },
  on_fire:       { bg: '#FFEDD5', color: '#EA580C', iconClass: 'fa-solid fa-fire' },
  sharpshooter:  { bg: '#DCFCE7', color: '#16A34A', iconClass: 'fa-solid fa-bullseye' },
  scholar:       { bg: '#DBEAFE', color: '#1D4ED8', iconClass: 'fa-solid fa-graduation-cap' },
  perfectionist: { bg: '#FEF9C3', color: '#B45309', iconClass: 'fa-solid fa-gem' },
  champion:      { bg: '#FFEDD5', color: '#C2410C', iconClass: 'fa-solid fa-trophy' },
  master:        { bg: '#EDE9FE', color: '#7C3AED', iconClass: 'fa-solid fa-medal' },
  legend:        { bg: '#FEF9C3', color: '#92400E', iconClass: 'fa-solid fa-crown' },
};

/* Activity type colour + icon map */
const ACTIVITY_MAP = {
  success:  { bg: '#DCFCE7', iconClass: 'fa-solid fa-circle-check', color: '#16A34A' },
  practice: { bg: '#DBEAFE', iconClass: 'fa-solid fa-pen-nib', color: '#2563EB' },
  project:  { bg: '#F3E8FF', iconClass: 'fa-solid fa-file-lines', color: '#9333EA' },
  badge:    { bg: '#FEF9C3', iconClass: 'fa-solid fa-award', color: '#CA8A04' },
  info:     { bg: '#F1F5F9', iconClass: 'fa-solid fa-circle-info', color: '#64748B' },
};

function DashboardViewComp({ setCurrentTab }) {
  const { data, loading } = useDashboard();

  /* ── Fallback dummy so the card grid still renders on error/no-token ── */
  const g  = data?.greeting      || { name: '—', streak: 0, best_streak: 0 };
  const st = data?.stats         || {};
  const cl = data?.continue_learning;
  const activity = data?.todays_activity || [];
  const week    = data?.this_week   || {};
  const weak    = data?.weak_areas  || [];
  const chart   = data?.accuracy_chart || [];
  const badges  = data?.badges      || { recent: [], next: null };

  const level   = st.level    || { current: '—', total: 30, change: '' };
  const credits = st.credits  || { total: '—', rank: '', change: '' };
  const acc     = st.accuracy || { percentage: 0 };
  const streak  = st.streak   || { current: 0, best: 0 };
  const words   = st.words    || { total: 0 };
  const time    = st.time_today || { total: 0, learning: 0, practice: 0, project: 0 };

  /* ── Keyframe injection (once) ── */
  useEffect(() => {
    let s = document.getElementById('ww-dash-styles');
    if (!s) {
      s = document.createElement('style');
      s.id = 'ww-dash-styles';
      document.head.appendChild(s);
    }
    s.textContent = `
      @keyframes ww-pulse {
        0%,100% { background-position: 200% 0 }
        50%      { background-position: -200% 0 }
      }
      .ww-card {
        background:var(--bg-white); border-radius:16px;
        border:1px solid var(--border); box-shadow:0 1px 4px rgba(0,0,0,0.05);
        transition: box-shadow 0.2s;
      }
      .ww-stat-icon {
        width:38px; height:38px; border-radius:10px;
        background:var(--surface-soft); border:1px solid var(--border);
        display:flex; align-items:center; justify-content:center; font-size:1.1rem;
      }
      html.dark .ww-stat-icon {
        background:var(--surface-muted);
        border-color:rgba(148,163,184,0.25);
      }
      .ww-activity-icon {
        width:36px; height:36px; border-radius:10px;
        display:flex; align-items:center; justify-content:center;
        font-size:1rem; flex-shrink:0;
      }
      html.dark .ww-activity-icon {
        background:var(--surface-muted) !important;
        border:1px solid rgba(148,163,184,0.25);
      }
      .ww-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.08); }
      html.dark .ww-card:hover { box-shadow:0 8px 24px rgba(2,6,23,0.45); }
      .ww-btn-primary {
        background:var(--primary); color:#fff; border:none;
        border-radius:10px; padding:9px 18px; font-weight:600;
        font-size:0.875rem; cursor:pointer; display:inline-flex;
        align-items:center; gap:6px; transition:background 0.2s;
        font-family:inherit;
      }
      .ww-btn-primary:hover { background:var(--primary-hover); }
      .ww-btn-secondary {
        background:var(--primary-light); color:var(--text-dark); border:1px solid var(--border);
        border-radius:10px; padding:9px 18px; font-weight:600;
        font-size:0.875rem; cursor:pointer; display:inline-flex;
        align-items:center; gap:6px; transition:background 0.2s;
        font-family:inherit;
      }
      .ww-btn-secondary:hover { background:rgba(148, 163, 184, 0.2); }
      .ww-pill-green { background:#F0FDF4; color:#16A34A; border-radius:8px;
        font-size:0.7rem; font-weight:700; padding:3px 8px; display:inline-flex; align-items:center; gap:3px; }
      .ww-pill-orange { background:#FFF7ED; color:#EA580C; border-radius:8px;
        font-size:0.7rem; font-weight:700; padding:3px 8px; display:inline-flex; align-items:center; gap:3px; }
      .ww-pill-muted  { background:#F1F5F9; color:#64748B; border-radius:8px;
        font-size:0.7rem; font-weight:700; padding:3px 8px; }
      html.dark .ww-pill-green { background:rgba(22,163,74,0.2); color:#86efac; }
      html.dark .ww-pill-orange { background:rgba(234,88,12,0.22); color:#fdba74; }
      html.dark .ww-pill-muted  { background:#1e293b; color:#94a3b8; }
    `;
  }, []);

  /* ══════════ SECTION 1 — GREETING ══════════ */
  const renderGreeting = () => (
    <div className="ww-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <div>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Welcome Back
        </p>
        {loading ? <Skel w={220} h={28} /> : (
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
            Good {getTimeOfDay()}, {g.name}
          </h1>
        )}
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>
          {loading ? <Skel w={280} h={14} /> : (
            g.streak > 0
              ? <>You're on a <strong style={{ color: '#F97316' }}>{g.streak}-day streak</strong> · {
                  g.streak < 7 ? `${7 - g.streak} more days for Week Warrior!` : 'Amazing consistency!'
                }</>
              : 'Start your streak — complete a lesson today!'
          )}
        </p>
      </div>
      <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 14, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <i className="fa-solid fa-fire" style={{ fontSize: '1.4rem', color: '#EA580C' }}></i>
        <div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F97316', lineHeight: 1, margin: 0 }}>
            {loading ? '—' : g.streak}
          </p>
          <p style={{ fontSize: '0.7rem', color: '#FB923C', fontWeight: 600, margin: 0 }}>Day Streak</p>
        </div>
      </div>
    </div>
  );

  /* ══════════ SECTION 2 — STAT CARDS ══════════ */
  const statCards = [
    {
      iconBg: '#DBEAFE', iconClass: 'fa-solid fa-chart-line', label: 'Current Level',
      value: loading ? null : `${level.current} / 30`,
      pill: 'green', pillLabel: level.change || 'Learning',
      sub: loading ? null : `Level ${level.current} · Keep going!`
    },
    {
      iconBg: '#FEF9C3', iconClass: 'fa-solid fa-coins', label: 'Total Credits',
      value: loading ? null : (typeof credits.total === 'number' ? credits.total.toLocaleString() : credits.total),
      pill: 'green', pillLabel: credits.change || '+0 this week',
      sub: loading ? null : (credits.rank || 'Beginner Writer')
    },
    {
      iconBg: '#DCFCE7', iconClass: 'fa-solid fa-bullseye', label: 'Overall Accuracy',
      value: loading ? null : `${acc.percentage}%`,
      pill: 'green', pillLabel: acc.percentage >= 70 ? 'Great!' : 'Improving',
      sub: loading ? null : (acc.percentage >= 80 ? 'Excellent work!' : 'Keep practicing!')
    },
    {
      iconBg: '#FFEDD5', iconClass: 'fa-solid fa-fire', label: 'Current Streak',
      value: loading ? null : `${streak.current} days`,
      pill: 'orange', pillLabel: 'Active',
      sub: loading ? null : `Best: ${streak.best} days`
    },
    {
      iconBg: '#F3E8FF', iconClass: 'fa-solid fa-file-pen', label: 'Words Written',
      value: loading ? null : words.total.toLocaleString(),
      pill: 'muted', pillLabel: 'Total',
      sub: loading ? null : 'Across all activities'
    },
    {
      iconBg: '#CCFBF1', iconClass: 'fa-solid fa-clock', label: 'Time Today',
      value: loading ? null : `${time.total} min`,
      pill: 'muted', pillLabel: 'Today',
      sub: loading ? null : `Learning ${time.learning}m · Practice ${time.practice}m · Project ${time.project}m`
    },
  ];

  const renderStatCards = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
      {statCards.map((c, i) => (
        <div key={i} className="ww-card" style={{ padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div className="ww-stat-icon">
                <i className={c.iconClass} style={{ color: 'var(--text-dark)' }}></i>
            </div>
            <span className={`ww-pill-${c.pill}`}>↑ {c.pillLabel}</span>
          </div>
          {loading ? <Skel w={80} h={24} r={6} /> : (
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>{c.value}</p>
          )}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 10px' }}>{c.label}</p>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            {loading ? <Skel w="70%" h={12} r={4} /> : (
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>{c.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  /* ══════════ SECTION 3 — CONTINUE LEARNING ══════════ */
  const renderContinueLearning = () => (
    <div className="ww-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          Continue Where You Left Off
        </p>
        {loading ? (
          <><Skel w={260} h={20} /><div style={{ height: 6 }} /><Skel w={180} h={14} /></>
        ) : cl ? (
          <>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 4px' }}>
              Level {cl.level}: {cl.topic}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 18px' }}>
              Next up · {cl.next_up || 'Continue this lesson'}
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 4px' }}>
              Start Your First Lesson
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 18px' }}>
              Head to the Learning Hub to begin your journey!
            </p>
          </>
        )}
        {!loading && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Progress</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{cl?.progress ?? 0}%</span>
            </div>
            <div style={{ width: '100%', height: 7, background: 'var(--surface-muted)', borderRadius: 999, marginBottom: 18 }}>
              <div style={{ height: 7, borderRadius: 999, background: 'var(--primary)', width: `${cl?.progress ?? 0}%`, transition: 'width 0.6s ease' }} />
            </div>
          </>
        )}
        <button className="ww-btn-primary" onClick={() => setCurrentTab('learning')}>
          {cl ? 'Continue Learning →' : 'Start Learning →'}
        </button>
      </div>
      <div style={{ background: 'var(--surface-soft)', borderRadius: 14, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: 140, border: '1px solid var(--border)' }}>
        <i className="fa-solid fa-book-open" style={{ fontSize: '2.2rem', color: 'var(--primary)' }}></i>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
          {cl ? `Level ${cl.level} of 30` : 'Start your path'}
        </p>
      </div>
    </div>
  );

  /* ══════════ SECTION 4 — ACTIVITY FEED ══════════ */
  const renderActivity = () => (
    <div className="ww-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>Today's Activity</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <Skel key={i} h={44} r={10} />)}
        </div>
      ) : activity.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.3rem' }}><i className="fa-regular fa-clock"></i></p>
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>No activity yet today</p>
          <p style={{ fontSize: '0.8rem' }}>Start a lesson or practice task!</p>
        </div>
      ) : activity.map((item, i) => {
        const map = ACTIVITY_MAP[item.type] || ACTIVITY_MAP.info;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
            borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none'
          }}>
            <div className="ww-activity-icon" style={{ background: map.bg }}>
              <i className={map.iconClass} style={{ color: map.color }}></i>
            </div>
            <p style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>{item.text}</p>
            {item.time && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{item.time}</span>}
          </div>
        );
      })}
    </div>
  );

  /* ══════════ SECTION 5a — THIS WEEK ══════════ */
  const weekRows = [
    { iconClass: 'fa-solid fa-book-open', label: 'Lessons', val: week.lessons ?? '—' },
    { iconClass: 'fa-solid fa-bullseye', label: 'Quizzes Passed', val: week.quizzes ?? '—' },
    { iconClass: 'fa-solid fa-pen-nib', label: 'Practice Tasks', val: week.practice ?? '—' },
    { iconClass: 'fa-solid fa-screwdriver-wrench', label: 'Errors Tracked', val: week.errors_fixed ?? '—' },
    { iconClass: 'fa-solid fa-file-lines', label: 'Words Written', val: typeof week.words === 'number' ? week.words.toLocaleString() : '—' },
    { iconClass: 'fa-solid fa-coins', label: 'Credits Earned', val: week.credits ?? '—' },
  ];

  const renderThisWeek = () => (
    <div className="ww-card" style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 16px' }}>This Week</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {weekRows.map(({ iconClass, label, val }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, textAlign: 'center', color: 'var(--text-muted)' }}><i className={iconClass}></i></span>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{label}</span>
            </div>
            {loading ? <Skel w={40} h={16} r={4} /> : (
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>{val}</span>
            )}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 12 }}>
        <button className="ww-btn-secondary" style={{ fontSize: '0.78rem', padding: '6px 12px' }} onClick={() => setCurrentTab('analytics')}>
          View Full Analytics →
        </button>
      </div>
    </div>
  );

  /* ══════════ SECTION 5b — WEAK AREAS ══════════ */
  const renderWeakAreas = () => (
    <div className="ww-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>Weak Areas</h2>
        <span style={{ color: '#EA580C' }}><i className="fa-solid fa-triangle-exclamation"></i></span>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skel h={80} r={10} /><Skel h={80} r={10} />
        </div>
      ) : weak.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: '#F0FDF4', borderRadius: 12 }}>
          <p style={{ fontSize: '1.3rem', color: '#16A34A' }}><i className="fa-solid fa-circle-check"></i></p>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16A34A' }}>No weak areas!</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keep up the great work</p>
        </div>
      ) : weak.map((area, i) => (
        <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: '0.875rem', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 2px' }}>{area.type}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{area.example}</p>
            </div>
            <span style={{
              background: area.severity === 'high' ? '#FEE2E2' : '#FFEDD5',
              color: area.severity === 'high' ? '#DC2626' : '#EA580C',
              borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', flexShrink: 0, marginLeft: 8
            }}>{area.count} errors</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 500, margin: '0 0 8px' }}>
            <i className="fa-regular fa-lightbulb" style={{ marginRight: 4 }}></i>{area.suggestion}
          </p>
          <button className="ww-btn-primary" style={{ fontSize: '0.75rem', padding: '5px 12px' }} onClick={() => setCurrentTab('practice')}>
            Practice Now →
          </button>
        </div>
      ))}
    </div>
  );

  /* ══════════ SECTION 6 — ACCURACY CHART ══════════ */
  const chartMax = 100;
  const renderChart = () => (
    <div className="ww-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 2px' }}>Accuracy Trend</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Last 7 days</p>
        </div>
        {!loading && acc.percentage > 0 && (
          <span className="ww-pill-green"><i className="fa-solid fa-arrow-trend-up" style={{ marginRight: 4 }}></i>Improving</span>
        )}
      </div>
      {loading ? <Skel h={140} r={10} /> : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140, paddingBottom: 4 }}>
          {chart.map(({ day, accuracy }, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: accuracy > 0 ? '#2563EB' : 'var(--text-muted)' }}>
                {accuracy > 0 ? `${accuracy}%` : '—'}
              </span>
              <div
                style={{
                  width: '100%', borderRadius: '6px 6px 0 0',
                  height: accuracy > 0 ? `${Math.max((accuracy / chartMax) * 100, 6)}%` : '6%',
                  background: accuracy > 0
                    ? `linear-gradient(to top, #1D4ED8, #60A5FA)`
                    : '#E2E8F0',
                  transition: 'height 0.5s ease'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{day}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ══════════ SECTION 7 — BADGES ══════════ */
  const renderBadges = () => (
    <div className="ww-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Recently earned */}
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 14 }}>Recently Earned</h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skel h={48} r={10} /><Skel h={48} r={10} /><Skel h={48} r={10} />
            </div>
          ) : badges.recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', background: '#F8FAFC', borderRadius: 10 }}>
              <p style={{ fontSize: '1.2rem' }}><i className="fa-solid fa-flag-checkered"></i></p>
              <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>No badges yet</p>
              <p style={{ fontSize: '0.75rem' }}>Complete lessons to earn them!</p>
            </div>
          ) : badges.recent.map((b, i) => {
            const bc = BADGE_COLORS[b.badge_id] || { bg: '#F1F5F9', color: '#64748B', iconClass: 'fa-solid fa-award' };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: bc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  <i className={bc.iconClass} style={{ color: bc.color }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 1px' }}>{b.name}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                    {b.earned ? `Earned ${new Date(b.earned).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Earned'}
                  </p>
                </div>
                <span style={{ color: '#22C55E', fontSize: '1rem' }}><i className="fa-solid fa-circle-check"></i></span>
              </div>
            );
          })}
        </div>

        {/* Next badge */}
        <div style={{ borderLeft: '1px solid #F1F5F9', paddingLeft: '2rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 14 }}>Next Badge</h3>
          {loading ? <Skel h={160} r={12} /> : badges.next ? (
            <div style={{ background: 'linear-gradient(135deg,#FFF7ED,#FEFCE8)', border: '1px solid #FED7AA', borderRadius: 14, padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', boxShadow: '0 1px 6px rgba(0,0,0,0.1)', fontSize: '1.5rem' }}>
                <i className={BADGE_COLORS[badges.next.badge_id || 'on_fire']?.iconClass || 'fa-solid fa-fire'} style={{ color: '#EA580C' }}></i>
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 4px' }}>{badges.next.name}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 14px' }}>{badges.next.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>{badges.next.current} of {badges.next.required}</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{badges.next.percentage}%</span>
              </div>
              <div style={{ height: 7, background: '#fff', borderRadius: 999, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)', marginBottom: 10 }}>
                <div style={{ height: 7, borderRadius: 999, background: '#FB923C', width: `${badges.next.percentage}%` }} />
              </div>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#EA580C', margin: 0 }}>
                <i className="fa-solid fa-fire" style={{ marginRight: 4 }}></i>
                {badges.next.required - badges.next.current} more to unlock
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#F0FDF4', borderRadius: 12 }}>
              <p style={{ fontSize: '1.5rem' }}><i className="fa-solid fa-graduation-cap"></i></p>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16A34A' }}>All badges earned!</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>You are a legend</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="db-animate" style={{ maxWidth: 1320, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {renderGreeting()}
      {renderStatCards()}
      {renderContinueLearning()}
      {renderActivity()}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {renderThisWeek()}
        {renderWeakAreas()}
      </div>
      {renderChart()}
      {renderBadges()}
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

// ─── All other view components defined OUTSIDE Dashboard to prevent remount/focus loss ───

function LearningViewComp({ setCurrentTab, completedModules, handleOpenModule, handleStartQuiz, setShowLearningPath,
  practiceText, handlePracticeTextChange, handlePracticeKeyDown, textAlignment, setTextAlignment,
  isBold, setIsBold, isItalic, setIsItalic, isUnderline, setIsUnderline,
  showSuggestions, suggestions }) {
  return (
    <div className="db-animate" style={{maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <h1 className="db-page-title">Gamified <span>Learning Hub</span></h1>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1.5rem'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
          <div>
            <p className="db-section-title"><i className="fa-solid fa-book-open" style={{color:'var(--primary)'}}></i> Learn by Reading</p>
            {['Indian Flag & Nationalism'].map((title,i)=>(
              <div key={i} className="db-card db-card-p" style={{borderLeft:'4px solid var(--primary)'}}>
                <span className="db-badge db-badge-primary" style={{marginBottom:'0.75rem',display:'inline-block'}}>BEGINNER CONTENT</span>
                <p style={{fontWeight:700,color:'var(--text-dark)',marginBottom:'1rem'}}>{title}</p>
                <button className="db-btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={()=>handleOpenModule(title)}>
                  {completedModules.includes(title)
                    ? <><i className="fa-solid fa-book-open-reader" style={{marginRight:6}}></i>Continue Reading</>
                    : <><i className="fa-solid fa-play" style={{marginRight:6}}></i>Start Reading</>}
                </button>
              </div>
            ))}
          </div>
          <div>
            <p className="db-section-title"><i className="fa-solid fa-pen-nib" style={{color:'var(--primary)'}}></i> Quick Practice</p>
            <div className="db-card" style={{overflow:'hidden'}}>
              <div style={{padding:'0.875rem',borderBottom:'1px solid var(--border)',display:'flex',gap:'0.5rem',background:'#F9FAFB',flexWrap:'wrap'}}>
                <div style={{display:'flex',gap:'2px',background:'#F3F4F6',border:'1px solid var(--border)',borderRadius:8,padding:4}}>
                  {['left','center','right','justify'].map(a=>(
                    <button key={a} onClick={()=>setTextAlignment(a)} className={'db-toolbar-btn'+(textAlignment===a?' active':'')} title={'Align '+a}>
                      <i className={'fa-solid fa-align-'+a}></i>
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',gap:'2px',background:'#F3F4F6',border:'1px solid var(--border)',borderRadius:8,padding:4}}>
                  <button className={'db-toolbar-btn'+(isBold?' active':'')} onClick={()=>setIsBold(!isBold)}><strong>B</strong></button>
                  <button className={'db-toolbar-btn'+(isItalic?' active':'')} onClick={()=>setIsItalic(!isItalic)}><em>I</em></button>
                  <button className={'db-toolbar-btn'+(isUnderline?' active':'')} onClick={()=>setIsUnderline(!isUnderline)}><u>U</u></button>
                </div>
              </div>
              <textarea
                className="db-textarea"
                style={{borderRadius:0,border:'none',minHeight:140,padding:'1rem',textAlign:textAlignment,fontWeight:isBold?700:400,fontStyle:isItalic?'italic':'normal',textDecoration:isUnderline?'underline':'none'}}
                value={practiceText}
                onChange={handlePracticeTextChange}
                onKeyDown={handlePracticeKeyDown}
                placeholder="Type here... suggestions appear after each space!"
                spellCheck="false"
              />
              <div style={{display:'flex',gap:'1rem',padding:'0.5rem 1rem',fontSize:'0.75rem',color:'var(--text-muted)',borderTop:'1px solid var(--border)',background:'#F9FAFB'}}>
                <span><i className="fa-solid fa-file-lines" style={{marginRight:6}}></i><strong style={{color:'var(--text-dark)'}}>{practiceText.split(/\s+/).filter(w=>w).length}</strong> Words</span>
                <span><i className="fa-solid fa-font" style={{marginRight:6}}></i><strong style={{color:'var(--text-dark)'}}>{practiceText.length}</strong> Chars</span>
              </div>
              {showSuggestions && suggestions.length>0 && (
                <div style={{padding:'0.75rem 1rem',background:'#EEF2FF',borderTop:'1px solid #C7D2FE'}}>
                  <p style={{fontSize:'0.8rem',fontWeight:700,color:'var(--primary)',marginBottom:'0.35rem'}}><i className="fa-regular fa-lightbulb" style={{marginRight:6}}></i>Suggestions:</p>
                  {suggestions.slice(0,2).map((s,i)=>(
                    <p key={i} style={{fontSize:'0.8rem',color:'var(--text-muted)'}}><code style={{color:'#DC2626'}}>{s.text}</code> → <code style={{color:'#059669'}}>{s.suggestion}</code></p>
                  ))}
                </div>
              )}
              <div style={{padding:'0.75rem'}}>
                <button className="db-btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={()=>setCurrentTab('practice')}>Open Full Practice Panel →</button>
              </div>
            </div>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <p className="db-section-title">Quiz Panel</p>
          <div className="db-card db-card-p">
            <div style={{background:'#FFFFFF',border:'1.5px solid #D1D5DB',borderRadius:12,padding:'1rem',marginBottom:'0.75rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}>
                <p style={{fontSize:'0.875rem',fontWeight:700,color:'var(--text-dark)'}}>Grammar Sprint</p>
                <span className="db-badge db-badge-warning">HARD</span>
              </div>
              <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.75rem'}}>Earn 300 Credits</p>
              <button className="db-btn-primary" style={{width:'100%',justifyContent:'center',fontSize:'0.8rem'}} onClick={handleStartQuiz}>Start Quiz</button>
            </div>
          </div>
          <div className="db-card db-card-p" style={{background:'#EEF2FF',border:'1.5px solid #C7D2FE'}}>
            <p style={{fontSize:'0.75rem',fontWeight:700,color:'var(--primary)',marginBottom:'0.5rem'}}><i className="fa-solid fa-book-open" style={{marginRight:6}}></i>ADVANCED PATH</p>
            <p style={{fontSize:'0.875rem',fontWeight:600,color:'var(--text-dark)',marginBottom:'1rem'}}>Master 30 Comprehensive Lessons</p>
            <button className="db-btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={()=>setShowLearningPath(true)}><i className="fa-solid fa-list-check" style={{marginRight:6}}></i>View All 30 Levels</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AllLevelsViewComp({ setShowLearningPath, addPoints }) {
  const [completedLevels, setCompletedLevels] = React.useState([1,2,3,4,5,6,7,8,9,10,11,12,13]);
  const [currentLevel, setCurrentLevel] = React.useState(14);
  const levels = [
    {id:1,title:'Basic Spelling Rules',difficulty:'Beginner',credits:20,topic:'Spelling'},
    {id:2,title:'Common Misspellings',difficulty:'Beginner',credits:20,topic:'Spelling'},
    {id:3,title:'Capitalization Rules',difficulty:'Beginner',credits:25,topic:'Grammar'},
    {id:4,title:'Basic Punctuation',difficulty:'Beginner',credits:25,topic:'Punctuation'},
    {id:5,title:'Subject-Verb Agreement',difficulty:'Beginner',credits:30,topic:'Grammar'},
    {id:6,title:'Singular vs Plural',difficulty:'Beginner',credits:25,topic:'Grammar'},
    {id:7,title:'Articles (a, an, the)',difficulty:'Beginner',credits:20,topic:'Grammar'},
    {id:8,title:'Basic Tenses',difficulty:'Beginner',credits:35,topic:'Grammar'},
    {id:9,title:'Common Homophones',difficulty:'Beginner',credits:30,topic:'Homophones'},
    {id:10,title:'Beginner Assessment',difficulty:'Beginner',credits:50,topic:'Assessment'},
    {id:11,title:'Advanced Punctuation',difficulty:'Intermediate',credits:40,topic:'Punctuation'},
    {id:12,title:'Complex Sentences',difficulty:'Intermediate',credits:35,topic:'Grammar'},
    {id:13,title:'Active vs Passive Voice',difficulty:'Intermediate',credits:40,topic:'Grammar'},
    {id:14,title:'Commonly Confused Words',difficulty:'Intermediate',credits:45,topic:'Vocabulary'},
    {id:15,title:'Paragraph Structure',difficulty:'Intermediate',credits:50,topic:'Writing'},
    {id:16,title:'Transition Words',difficulty:'Intermediate',credits:35,topic:'Writing'},
    {id:17,title:'Advanced Tenses',difficulty:'Intermediate',credits:45,topic:'Grammar'},
    {id:18,title:'Prepositions',difficulty:'Intermediate',credits:40,topic:'Grammar'},
    {id:19,title:'Formal vs Informal Writing',difficulty:'Intermediate',credits:50,topic:'Writing'},
    {id:20,title:'Intermediate Assessment',difficulty:'Intermediate',credits:75,topic:'Assessment'},
    {id:21,title:'Style & Tone',difficulty:'Advanced',credits:60,topic:'Writing'},
    {id:22,title:'Conciseness',difficulty:'Advanced',credits:55,topic:'Writing'},
    {id:23,title:'Advanced Punctuation (Em dash)',difficulty:'Advanced',credits:50,topic:'Punctuation'},
    {id:24,title:'Parallel Structure',difficulty:'Advanced',credits:60,topic:'Grammar'},
    {id:25,title:'Conditional Sentences',difficulty:'Advanced',credits:55,topic:'Grammar'},
    {id:26,title:'Academic Writing',difficulty:'Advanced',credits:70,topic:'Writing'},
    {id:27,title:'Business Writing',difficulty:'Advanced',credits:70,topic:'Writing'},
    {id:28,title:'Creative Writing Techniques',difficulty:'Advanced',credits:65,topic:'Writing'},
    {id:29,title:'Editing & Proofreading',difficulty:'Advanced',credits:65,topic:'Writing'},
    {id:30,title:'Final Master Assessment',difficulty:'Advanced',credits:100,topic:'Assessment'},
  ];
  const getStatus = id => completedLevels.includes(id)?'completed':id<=currentLevel?'available':'locked';
  const diffColor = {Beginner:'#ECFDF5',Intermediate:'#FFFBEB',Advanced:'#FEF2F2'};
  const diffText = {Beginner:'#059669',Intermediate:'#D97706',Advanced:'#DC2626'};
  const handleStart = id => {
    if(getStatus(id)==='locked'){alert('Complete previous lessons first!');return;}
    const l=levels.find(x=>x.id===id);
    addPoints(l.credits);
    alert('Starting Lesson '+id+': '+l.title);
  };
  const handleComplete = id => {
    if(!completedLevels.includes(id)){
      setCompletedLevels(p=>[...p,id]);
      const l=levels.find(x=>x.id===id);
      alert('Lesson completed! +'+l.credits+' credits!');
      if(id===currentLevel) setCurrentLevel(id+1);
    }
  };
  const renderCards = list => (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
      {list.map(level=>{
        const st=getStatus(level.id);
        return (
          <div key={level.id} className="db-level-card" style={{opacity:st==='locked'?0.55:1}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}>
              <span>
                <i className={st==='completed' ? 'fa-solid fa-circle-check' : st==='available' ? 'fa-solid fa-play' : 'fa-solid fa-lock'}></i>
              </span>
              <span style={{fontSize:'0.7rem',fontWeight:700,padding:'2px 8px',borderRadius:999,background:diffColor[level.difficulty],color:diffText[level.difficulty]}}>L{level.id}</span>
            </div>
            <h3 style={{fontWeight:700,color:'var(--text-dark)',fontSize:'0.875rem',marginBottom:'0.25rem'}}>{level.title}</h3>
            <p style={{fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:'0.75rem'}}>
              <i className="fa-solid fa-book-open" style={{marginRight:6}}></i>{level.topic}
              {' '}•{' '}
              <i className="fa-solid fa-coins" style={{marginRight:4}}></i>+{level.credits} Cr
            </p>
            <div className="db-progress-track" style={{height:6,marginBottom:'0.75rem'}}>
              <div className={'db-progress-fill'+(st==='completed'?' db-progress-fill-success':st==='locked'?' db-progress-fill-muted':'')} style={{width:st==='completed'?'100%':st==='available'?'50%':'0%',height:'100%'}}></div>
            </div>
            <div style={{display:'flex',gap:'0.5rem'}}>
              {st==='locked'?<button disabled className="db-btn-secondary" style={{flex:1,opacity:0.5,cursor:'not-allowed'}}><i className="fa-solid fa-lock" style={{marginRight:6}}></i>Locked</button>
              :st==='completed'?<button onClick={()=>handleStart(level.id)} className="db-btn-secondary" style={{flex:1}}><i className="fa-solid fa-circle-check" style={{marginRight:6}}></i>Review</button>
              :<><button onClick={()=>handleStart(level.id)} className="db-btn-primary" style={{flex:1}}>Start</button><button onClick={()=>handleComplete(level.id)} className="db-btn-secondary" style={{flex:1,background:'#ECFDF5',color:'#059669',border:'1px solid #A7F3D0'}}>Complete</button></>}
            </div>
          </div>
        );
      })}
    </div>
  );
  return (
    <div className="db-animate" style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h1 className="db-page-title">30-Level <span>Learning Path</span></h1>
          <p className="db-page-sub">Master writing skills with comprehensive lessons organized by difficulty.</p>
        </div>
        <button className="db-btn-secondary" onClick={()=>setShowLearningPath(false)}><i className="fa-solid fa-arrow-left" style={{marginRight:6}}></i>Back</button>
      </div>
      <div className="db-card db-card-p">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
          <div><h2 style={{fontWeight:700,color:'var(--text-dark)',fontSize:'1rem'}}>Your Progress</h2><p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>Level {currentLevel}</p></div>
          <div style={{textAlign:'right'}}><p style={{fontSize:'1.75rem',fontWeight:700,color:'var(--primary)',lineHeight:1}}>{completedLevels.length}/30</p><p style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>Completed</p></div>
        </div>
        <div className="db-progress-track" style={{height:10}}>
          <div className="db-progress-fill" style={{width:(completedLevels.length/30*100)+'%',height:'100%'}}></div>
        </div>
        <p style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'0.5rem'}}>{Math.round(completedLevels.length/30*100)}% Complete</p>
      </div>
      {[{iconClass:'fa-solid fa-seedling',label:'Beginner Level (1-10)',sub:'Master the fundamentals',diff:'Beginner',color:'#16A34A'},
        {iconClass:'fa-solid fa-layer-group',label:'Intermediate Level (11-20)',sub:'Advance with complex techniques',diff:'Intermediate',color:'#D97706'},
        {iconClass:'fa-solid fa-trophy',label:'Advanced Level (21-30)',sub:'Perfect your craft',diff:'Advanced',color:'#DC2626'}].map(sec=>(
        <div key={sec.diff}>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1rem'}}>
            <span style={{fontSize:'1.3rem',color:sec.color}}><i className={sec.iconClass}></i></span>
            <div><h2 style={{fontWeight:700,color:'var(--text-dark)',fontSize:'1.1rem'}}>{sec.label}</h2><p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{sec.sub}</p></div>
          </div>
          {renderCards(levels.filter(l=>l.difficulty===sec.diff))}
        </div>
      ))}
    </div>
  );
}

function ChatViewComp({
  messages,
  chatInput,
  setChatInput,
  sendMessage,
  handleFileUpload,
  openFilePicker,
  fileInputRef,
  showHistory,
  setShowHistory,
  chatBoxRef,
  isChatSending,
  conversations,
  activeConversationId,
  onCreateConversation,
  onSwitchConversation,
  onRenameConversation,
  onDeleteConversation,
  referenceConversationIds,
  onToggleReferenceConversation,
  chatDocuments,
  selectedDocumentIds,
  onToggleDocumentSelection,
  onDeleteDocument,
}) {
  const formatWhen = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const selectedDocs = chatDocuments.filter((doc) => selectedDocumentIds.includes(doc.id));

  return (
    <div className="db-chat-root" style={{height:'100%',minHeight:500}}>
      <div className="db-chat-main">
        <div className="db-chat-topbar">
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <div style={{width:36,height:36,background:'var(--primary)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'white'}}><i className="fa-solid fa-robot"></i></div>
            <span style={{fontWeight:600,color:'var(--text-dark)'}}>AI Assistant</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <button className="db-btn-primary" style={{fontSize:'0.78rem',padding:'7px 12px'}} onClick={onCreateConversation}>
              <i className="fa-solid fa-plus" style={{marginRight:6}}></i>
              New Chat
            </button>
            <button className="db-btn-secondary" style={{fontSize:'0.8rem'}} onClick={()=>setShowHistory(!showHistory)}>
              {showHistory ? 'Hide Panel' : 'Show Panel'}
            </button>
          </div>
        </div>
        {(referenceConversationIds.length > 0 || selectedDocs.length > 0) && (
          <div style={{padding:'0.5rem 0.875rem',borderBottom:'1px solid var(--border)',background:'var(--surface-soft)',fontSize:'0.78rem',color:'var(--text-muted)',display:'flex',flexDirection:'column',gap:3}}>
            {referenceConversationIds.length > 0 && (
              <span>
                <i className="fa-solid fa-diagram-project" style={{marginRight:6}}></i>
                Referencing {referenceConversationIds.length} past chat{referenceConversationIds.length > 1 ? 's' : ''}
              </span>
            )}
            {selectedDocs.length > 0 && (
              <span>
                <i className="fa-solid fa-paperclip" style={{marginRight:6}}></i>
                Using documents: {selectedDocs.slice(0, 2).map((doc) => doc.title || doc.filename || 'Document').join(', ')}
                {selectedDocs.length > 2 ? ` +${selectedDocs.length - 2} more` : ''}
              </span>
            )}
          </div>
        )}
        <div ref={chatBoxRef} className="db-chat-messages">
          {messages.map((msg,i)=>(
            <div key={i} style={{display:'flex',justifyContent:msg.type==='user'?'flex-end':'flex-start'}}>
              {msg.type==='file'
                ?<div className="db-chat-bubble-file"><i className="fa-solid fa-file-arrow-up"></i> {msg.text}</div>
                :<div className={msg.type==='user'?'db-chat-bubble-user':'db-chat-bubble-ai'}>{msg.text}</div>}
            </div>
          ))}
          {isChatSending && (
            <div style={{display:'flex',justifyContent:'flex-start'}}>
              <div className="db-chat-bubble-ai">Typing...</div>
            </div>
          )}
        </div>
        <div className="db-chat-input-bar">
          <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={handleFileUpload}/>
          <button className="db-chat-attach-btn" onClick={openFilePicker} title="Upload File"><i className="fa-solid fa-paperclip"></i></button>
          <input type="text" className="db-chat-input" placeholder="Type here..." value={chatInput} onChange={(e)=>setChatInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&sendMessage()} />
          <button className="db-chat-send-btn" onClick={sendMessage} disabled={isChatSending}><i className="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
      <div className={'db-history-panel'+(showHistory?'':' db-history-hidden')}>
        <div style={{padding:'1rem',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg-white)'}}>
          <span style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Chat Manager</span>
          <button className="db-icon-btn" onClick={()=>setShowHistory(false)}><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div style={{padding:'0.75rem',display:'flex',flexDirection:'column',gap:'0.75rem',overflowY:'auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 0.2rem'}}>
            <span style={{fontSize:'0.72rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Chats</span>
            <button className="db-btn-secondary" style={{fontSize:'0.72rem',padding:'5px 9px'}} onClick={onCreateConversation}>+ New</button>
          </div>

          {conversations.length > 0 ? conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isReference = referenceConversationIds.includes(conv.id);
            return (
              <div
                key={conv.id}
                className="db-history-item"
                onClick={() => onSwitchConversation(conv.id)}
                style={{
                  borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                  background: isActive ? 'var(--primary-light)' : 'var(--bg-white)',
                  padding: '0.72rem',
                }}
              >
                <p style={{fontSize:'0.82rem',fontWeight:700,color:'var(--text-dark)',margin:'0 0 2px'}}>{conv.title || 'New Chat'}</p>
                <p style={{fontSize:'0.75rem',color:'var(--text-muted)',margin:'0 0 7px'}}>{conv.preview || 'No messages yet'}</p>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'0.7rem',color:'var(--text-muted)',marginBottom:6}}>
                  <span>{conv.message_count || 0} msgs</span>
                  <span>{formatWhen(conv.updated_at)}</span>
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <button
                    className="db-btn-secondary"
                    style={{fontSize:'0.68rem',padding:'4px 8px',flex:1,opacity:isActive ? 0.65 : 1}}
                    disabled={isActive}
                    onClick={(e)=>{e.stopPropagation(); if (!isActive) onToggleReferenceConversation(conv.id);}}
                    title={isActive ? 'Active chat cannot reference itself' : 'Toggle as reference context'}
                  >
                    {isReference ? 'Ref On' : 'Use Ref'}
                  </button>
                  <button
                    className="db-icon-btn"
                    style={{width:28,height:28}}
                    onClick={(e)=>{e.stopPropagation(); onRenameConversation(conv.id, conv.title || 'New Chat');}}
                    title="Rename chat"
                  >
                    <i className="fa-regular fa-pen-to-square"></i>
                  </button>
                  <button
                    className="db-icon-btn"
                    style={{width:28,height:28,color:'#EF4444'}}
                    onClick={(e)=>{e.stopPropagation(); onDeleteConversation(conv.id, conv.title || 'New Chat');}}
                    title="Delete chat"
                  >
                    <i className="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="db-history-item" style={{padding:'0.8rem'}}>
              <p style={{fontSize:'0.8rem',color:'var(--text-muted)',margin:0}}>No chats yet. Start a new chat.</p>
            </div>
          )}

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.35rem 0.2rem 0'}}>
            <span style={{fontSize:'0.72rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Uploaded Files</span>
            <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{selectedDocumentIds.length}/{chatDocuments.length} selected</span>
          </div>

          {chatDocuments.length > 0 ? chatDocuments.map((doc) => (
            <div key={doc.id} className="db-history-item" style={{padding:'0.62rem 0.72rem'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                <input
                  type="checkbox"
                  checked={selectedDocumentIds.includes(doc.id)}
                  onChange={() => onToggleDocumentSelection(doc.id)}
                  style={{marginTop:3,accentColor:'var(--primary)'}}
                />
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:'0.8rem',fontWeight:700,color:'var(--text-dark)',margin:'0 0 2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {doc.title || doc.filename || 'Document'}
                  </p>
                  <p style={{fontSize:'0.72rem',color:'var(--text-muted)',margin:0}}>{doc.word_count || 0} words</p>
                </div>
                <button
                  className="db-icon-btn"
                  style={{width:26,height:26,color:'#EF4444'}}
                  onClick={() => onDeleteDocument(doc.id, doc.title || doc.filename || 'Document')}
                  title="Delete uploaded file"
                >
                  <i className="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
          )) : (
            <div className="db-history-item" style={{padding:'0.75rem'}}>
              <p style={{fontSize:'0.78rem',color:'var(--text-muted)',margin:0}}>No uploaded files yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PracticeViewComp({practiceText,handlePracticeTextChange,handlePracticeKeyDown,textAlignment,setTextAlignment,isBold,setIsBold,isItalic,setIsItalic,isUnderline,setIsUnderline,practiceMode,setPracticeMode,isAnalyzing,setIsAnalyzing,suggestions,setSuggestions,showSuggestions,handleAnalyzeText,errors,practiceEditorRef}) {
  return (
    <div className="db-animate" style={{maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div><h1 className="db-page-title">Practice <span>Panel</span></h1><p className="db-page-sub">Enhance your writing with real-time AI assistance.</p></div>
        <div style={{textAlign:'right'}}>
          <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.35rem'}}><i className="fa-solid fa-coins" style={{marginRight:6}}></i>Daily Goal: 350 / 500 Words</p>
          <div className="db-progress-track" style={{width:200,height:7}}><div className="db-progress-fill" style={{width:'70%',height:'100%'}}></div></div>
        </div>
      </div>
      <div className="db-card" style={{overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div className="db-practice-toolbar">
          <div className="db-toolbar-group">
            {['left','center','right','justify'].map(a=>(
              <button key={a} className={'db-toolbar-btn'+(textAlignment===a?' active':'')} onClick={()=>setTextAlignment(a)} title={'Align '+a}>
                <i className={'fa-solid fa-align-'+a}></i>
              </button>
            ))}
          </div>
          <div style={{width:1,height:24,background:'var(--border)',margin:'0 4px'}}></div>
          <div className="db-toolbar-group">
            <button className={'db-toolbar-btn'+(isBold?' active':'')} onClick={()=>setIsBold(!isBold)} title="Bold"><strong>B</strong></button>
            <button className={'db-toolbar-btn'+(isItalic?' active':'')} onClick={()=>setIsItalic(!isItalic)} title="Italic"><em>I</em></button>
            <button className={'db-toolbar-btn'+(isUnderline?' active':'')} onClick={()=>setIsUnderline(!isUnderline)} title="Underline"><u>U</u></button>
          </div>
          <div className="db-mode-group">
            <button className={'db-mode-btn'+(practiceMode==='realtime'?' active':'')} onClick={()=>setPracticeMode('realtime')}><i className="fa-solid fa-bolt" style={{color:practiceMode==='realtime'?'white':'#F59E0B'}}></i> Real-time</button>
            <button className={'db-mode-btn'+(practiceMode==='analysis'?' active':'')} onClick={()=>setPracticeMode('analysis')}><i className="fa-solid fa-magnifying-glass"></i> Analysis</button>
          </div>
        </div>
        <textarea
          ref={practiceEditorRef}
          className="db-textarea"
          style={{borderRadius:0,border:'none',borderBottom:'1px solid var(--border)',minHeight:300,padding:'1.25rem',textAlign:textAlignment,fontWeight:isBold?700:400,fontStyle:isItalic?'italic':'normal',textDecoration:isUnderline?'underline':'none',fontSize:'1rem',lineHeight:1.7,background:'var(--bg-white)'}}
          value={practiceText}
          onChange={handlePracticeTextChange}
          onKeyDown={handlePracticeKeyDown}
          placeholder="Start typing here... Suggestions appear after each space!"
          spellCheck="false"
          autoCorrect="off"
          autoCapitalize="off"
        />
        <div className="db-stats-bar">
          <div className="db-stat-chip"><i className="fa-solid fa-file-lines" style={{marginRight:6}}></i><strong>{practiceText.split(/\s+/).filter(w=>w).length}</strong> Words</div>
          <div className="db-stat-chip"><i className="fa-solid fa-font" style={{marginRight:6}}></i><strong>{practiceText.length}</strong> Chars</div>
          <div className="db-stat-chip"><i className="fa-regular fa-clock" style={{marginRight:6}}></i><strong>{Math.max(1,Math.ceil(practiceText.split(/\s+/).filter(w=>w).length/200))}</strong> min</div>
          <div className="db-stat-chip" style={{marginLeft:'auto',borderColor:'rgba(239, 68, 68, 0.3)',background:'rgba(239, 68, 68, 0.15)'}}>
            <i className="fa-solid fa-circle-exclamation" style={{color:'#EF4444'}}></i>
            <strong style={{color:'#EF4444'}}>{errors.length}</strong>
            <span style={{color:'#DC2626'}}>Issues</span>
          </div>
        </div>
        {isAnalyzing && suggestions.length>0 && (
          <div style={{margin:'0 1rem',marginBottom:'0.75rem',padding:'0.875rem',borderRadius:12,border:'1px solid rgba(167, 139, 250, 0.3)',background:'rgba(167, 139, 250, 0.1)'}}>
            <p style={{fontWeight:700,color:'var(--primary)',marginBottom:'0.5rem',fontSize:'0.875rem'}}><i className="fa-solid fa-triangle-exclamation" style={{marginRight:6}}></i>Analysis - {suggestions.length} Issues Found</p>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',maxHeight:160,overflowY:'auto'}}>
              {suggestions.map((s,i)=>(
                <div key={i} style={{padding:'0.5rem 0.75rem',background:'#E5E7EB',border:'1px solid var(--border)',borderRadius:8,fontSize:'0.825rem'}}>
                  <strong style={{color:'var(--primary)'}}>{s.type.toUpperCase()}</strong>{' - '}
                  <code style={{background:'#FEE2E2',color:'#DC2626',padding:'0 4px',borderRadius:4}}>{s.text}</code>{' → '}
                  <code style={{background:'#D1FAE5',color:'#059669',padding:'0 4px',borderRadius:4}}>{s.suggestion}</code>
                  <p style={{color:'var(--text-muted)',marginTop:'0.2rem',fontStyle:'italic',fontSize:'0.8rem'}}><i className="fa-regular fa-lightbulb" style={{marginRight:6}}></i>{s.hint}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {showSuggestions && suggestions.length>0 && !isAnalyzing && (
          <div style={{margin:'0 1rem',marginBottom:'0.75rem',padding:'0.875rem',borderRadius:12,border:'1px solid rgba(59, 130, 246, 0.3)',background:'rgba(59, 130, 246, 0.1)'}}>
            <p style={{fontWeight:700,color:'#1D4ED8',marginBottom:'0.35rem',fontSize:'0.875rem'}}><i className="fa-regular fa-lightbulb" style={{marginRight:6}}></i>Real-time Suggestions</p>
            {suggestions.slice(0,2).map((s,i)=>(
              <p key={i} style={{fontSize:'0.825rem',color:'var(--text-muted)'}}>
                <code style={{color:'#DC2626'}}>{s.text}</code>{' → '}<code style={{color:'#059669'}}>{s.suggestion}</code>
              </p>
            ))}
          </div>
        )}
        <div style={{padding:'0.75rem 1rem',borderTop:'1px solid var(--border)'}}>
          <button
            onClick={()=>{if(!isAnalyzing){handleAnalyzeText();setIsAnalyzing(true);}else{setIsAnalyzing(false);setSuggestions([]);}}}
            className={isAnalyzing?'db-btn-danger':'db-btn-primary'}
            style={{width:'100%',justifyContent:'center'}}
          >
            <i className={'fa-solid fa-'+(isAnalyzing?'stop':'magnifying-glass')}></i>
            {isAnalyzing?'Stop Analysis':'Analyze Writing'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectsViewComp({currentProjects,selectedProject,setSelectedProject,isEditingProject,setIsEditingProject,projectContent,setProjectContent,projectTitle,setProjectTitle,handleNewProject,handleSaveProject,handleDeleteProject}) {
  if(isEditingProject && selectedProject) {
    return (
      <div className="db-animate" style={{display:'flex',flexDirection:'column',gap:'1rem',height:'100%'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flex:1}}>
            <button className="db-btn-secondary" onClick={()=>{setIsEditingProject(false);setSelectedProject(null);}}><i className="fa-solid fa-arrow-left" style={{marginRight:6}}></i>Back</button>
            <input type="text" className="db-input" style={{fontSize:'1.1rem',fontWeight:700,flex:1}} value={projectTitle} onChange={(e)=>setProjectTitle(e.target.value)} placeholder="Project Title"/>
          </div>
          <button className="db-btn-primary" onClick={handleSaveProject}><i className="fa-solid fa-floppy-disk" style={{marginRight:6}}></i>Save Project</button>
        </div>
        <textarea className="db-textarea" style={{flex:1,minHeight:360,fontFamily:'monospace',fontSize:'0.95rem',lineHeight:1.7}} value={projectContent} onChange={(e)=>setProjectContent(e.target.value)} placeholder="Start writing your story, document, or notes here..." spellCheck="false"/>
        <div className="db-card db-card-p" style={{borderRadius:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',gap:'1.5rem',fontSize:'0.875rem',fontWeight:600,color:'var(--text-muted)'}}>
            <span><i className="fa-solid fa-file-pen" style={{marginRight:6}}></i>{projectContent.split(/\s+/).filter(w=>w).length} words</span>
            <span><i className="fa-solid fa-font" style={{marginRight:6}}></i>{projectContent.length} chars</span>
            <span><i className="fa-regular fa-clock" style={{marginRight:6}}></i>{Math.max(1,Math.ceil(projectContent.split(/\s+/).filter(w=>w).length/200))} min</span>
          </div>
          <button className="db-btn-danger" style={{fontSize:'0.8rem',padding:'0.5rem'}} onClick={()=>{if(window.confirm('Delete this project?')){handleDeleteProject(selectedProject);setProjectContent('');setProjectTitle('');}}}><i className="fa-regular fa-trash-can" style={{marginRight:6}}></i>Delete</button>
        </div>
      </div>
    );
  }
  return (
    <div className="db-animate" style={{maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div><h1 className="db-page-title">Project <span>Workspace</span></h1><p className="db-page-sub">Create and manage your stories, documents, and content.</p></div>
        <button className="db-btn-primary" onClick={handleNewProject}><i className="fa-solid fa-plus"></i> New Project</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
        {currentProjects.length===0?(
          <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'3rem',border:'2px dashed var(--border)',borderRadius:16,color:'var(--text-muted)',gap:'0.5rem'}}>
            <span style={{fontSize:'2rem'}}><i className="fa-regular fa-folder-open"></i></span>
            <p style={{fontWeight:600,color:'var(--text-dark)'}}>No projects yet</p>
            <p style={{fontSize:'0.875rem'}}>Create a new project to get started</p>
          </div>
        ):currentProjects.map(p=>(
          <div key={p.id} className="db-card" style={{padding:'1.25rem',cursor:'pointer'}} onClick={()=>{setSelectedProject(p.id);setProjectTitle(p.title);setProjectContent(p.content);setIsEditingProject(true);}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'0.75rem'}}>
              <div style={{width:44,height:44,background:'rgba(167, 139, 250, 0.15)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem'}}><i className="fa-solid fa-book-open"></i></div>
              <span className="db-badge db-badge-muted">{p.type}</span>
            </div>
            <h3 style={{fontWeight:700,color:'var(--text-dark)',marginBottom:'0.35rem',fontSize:'0.95rem'}}>{p.title}</h3>
            <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.75rem'}}>{p.content||'No content yet'}</p>
            <div style={{fontSize:'0.75rem',color:'var(--text-muted)',display:'flex',justifyContent:'space-between'}}>
              <span><i className="fa-solid fa-chart-column" style={{marginRight:6}}></i>{p.words} words</span><span>{p.lastEdited}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsViewComp({analyticsPeriod,setAnalyticsPeriod,showResults,setShowResults}) {
  return (
    <div className="db-animate" style={{maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div><h1 className="db-page-title">Performance <span>Analytics</span></h1><p className="db-page-sub">Track your writing improvement, grammar accuracy, and vocabulary growth.</p></div>
        <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
          <select className="db-input" style={{width:'auto',padding:'0.5rem 0.875rem',cursor:'pointer'}} value={analyticsPeriod} onChange={(e)=>setAnalyticsPeriod(e.target.value)}>
            <option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          </select>
          <button className="db-btn-primary" onClick={()=>setShowResults(!showResults)}><i className="fa-solid fa-chart-line" style={{marginRight:6}}></i>Results</button>
        </div>
      </div>
      {showResults && (
        <div className="db-card db-card-p" style={{border:'1px solid #A7F3D0',background:'#F0FDF4'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
            <h2 style={{fontWeight:700,color:'var(--text-dark)',fontSize:'1.1rem'}}>Achievement Summary</h2>
            <button onClick={()=>setShowResults(false)} style={{background:'none',border:'none',fontSize:'1.2rem',cursor:'pointer',color:'var(--text-muted)'}}><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
            {[{label:'Quizzes Completed',value:'12',sub:'3,600 Credits'},{label:'Levels Completed',value:'8',sub:'2,400 Credits'},{label:'Session Credits',value:'750',sub:'+750 Cr'}].map((m,i)=>(
              <div key={i} className="db-card" style={{padding:'1rem'}}>
                <p style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-muted)',marginBottom:'0.2rem'}}>{m.label}</p>
                <p style={{fontSize:'1.75rem',fontWeight:700,color:'var(--primary)',margin:0}}>{m.value}</p>
                <p style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'0.2rem'}}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem'}}>
        {[{label:'Grammar Accuracy',value:'96.8%',icon:'fa-bullseye',color:'#10B981'},{label:'Vocabulary Score',value:'8.4/10',icon:'fa-book-font',color:'var(--primary)'},{label:'Words Written',value:'12,450',icon:'fa-keyboard',color:'#3B82F6'},{label:'Active Streak',value:'14 Days',icon:'fa-fire',color:'#F59E0B'}].map((m,i)=>(
          <div key={i} className="db-metric-card">
            <div style={{width:36,height:36,borderRadius:8,background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',color:m.color,marginBottom:'0.75rem',border:'1px solid #C7D2FE'}}>
              <i className={'fa-solid '+m.icon}></i>
            </div>
            <p className="db-metric-label">{m.label}</p>
            <p className="db-metric-value" style={{color:m.color}}>{m.value}</p>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1.5rem'}}>
        <div className="db-card db-card-p">
          <p className="db-section-title"><i className="fa-solid fa-chart-area" style={{color:'var(--primary)'}}></i> {analyticsPeriod==='weekly'?'Weekly':'Monthly'} Trends</p>
          <div style={{height:120,display:'flex',alignItems:'flex-end',justifyContent:'space-around',borderBottom:'1px solid var(--border)',gap:4,marginBottom:'0.5rem'}}>
            {[40,55,50,70,65,85,95].map((h,i)=>(
              <div key={i} style={{flex:1,display:'flex',alignItems:'flex-end',height:'100%'}}>
                <div style={{width:'100%',background:'var(--primary)',borderRadius:'4px 4px 0 0',height:h+'%',opacity:0.8}}></div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-around',fontSize:'0.7rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>
            {(analyticsPeriod==='weekly'?['Mon','Tue','Wed','Thu','Fri','Sat','Sun']:['Wk1','Wk2','Wk3','Wk4']).map(d=><span key={d}>{d}</span>)}
          </div>
        </div>
        <div className="db-card db-card-p">
          <p className="db-section-title"><i className="fa-solid fa-list-check" style={{color:'var(--primary)'}}></i> Skill Breakdown</p>
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {[{label:'Clarity & Brevity',score:92},{label:'Professional Tone',score:85},{label:'Vocabulary Variety',score:78}].map((s,i)=>(
              <div key={i}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',fontWeight:600,marginBottom:'0.35rem'}}>
                  <span style={{color:'var(--text-dark)'}}>{s.label}</span><span style={{color:'var(--primary)'}}>{s.score}%</span>
                </div>
                <div className="db-progress-track" style={{height:6}}><div className="db-progress-fill" style={{width:s.score+'%',height:'100%'}}></div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsViewComp({
  profileForm,
  setProfileForm,
  settingsForm,
  setSettingsForm,
  passwordForm,
  setPasswordForm,
  dangerPassword,
  setDangerPassword,
  deleteConfirm,
  setDeleteConfirm,
  isSavingProfile,
  isSavingSettings,
  isChangingPassword,
  isExportingData,
  isDeletingAccount,
  onSaveProfile,
  onSaveSettings,
  onChangePassword,
  onExportData,
  onDeleteAccount,
  onLogout,
}) {
  return (
    <div className="db-animate" style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 className="db-page-title">Settings <span>&amp; Preferences</span></h1>
        <p className="db-page-sub">Manage profile, preferences, security, and account data in one place.</p>
      </div>

      <div className="db-card db-card-p">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1rem', fontWeight: 700 }}>
            <i className="fa-solid fa-user-pen" style={{ color: 'var(--primary)', marginRight: 8 }}></i>
            Profile
          </h2>
          <button className="db-btn-primary" onClick={onSaveProfile} disabled={isSavingProfile}>
            {isSavingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Display Name</label>
            <input className="db-input" value={profileForm.name} onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Your name" />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Email</label>
            <input className="db-input" value={profileForm.email} disabled />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Phone</label>
            <input className="db-input" value={profileForm.phone} onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Optional phone" />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Role</label>
            <select className="db-input" value={profileForm.role} onChange={(e) => setProfileForm((prev) => ({ ...prev, role: e.target.value }))}>
              <option value="student">Student</option>
              <option value="professional">Professional</option>
              <option value="writer">Writer</option>
              <option value="teacher">Teacher</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="db-card db-card-p">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1rem', fontWeight: 700 }}>
            <i className="fa-solid fa-sliders" style={{ color: 'var(--primary)', marginRight: 8 }}></i>
            Preferences
          </h2>
          <button className="db-btn-primary" onClick={onSaveSettings} disabled={isSavingSettings}>
            {isSavingSettings ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', marginBottom: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Theme</label>
            <select className="db-input" value={settingsForm.theme} onChange={(e) => setSettingsForm((prev) => ({ ...prev, theme: e.target.value }))}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Font Size</label>
            <select className="db-input" value={settingsForm.font_size} onChange={(e) => setSettingsForm((prev) => ({ ...prev, font_size: e.target.value }))}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Language</label>
            <select className="db-input" value={settingsForm.language} onChange={(e) => setSettingsForm((prev) => ({ ...prev, language: e.target.value }))}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reminder Time</label>
            <input type="time" className="db-input" value={settingsForm.reminder_time} onChange={(e) => setSettingsForm((prev) => ({ ...prev, reminder_time: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: 600 }}>
            <input type="checkbox" checked={Boolean(settingsForm.notifications_enabled)} onChange={(e) => setSettingsForm((prev) => ({ ...prev, notifications_enabled: e.target.checked }))} />
            Enable Notifications
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: 600, opacity: settingsForm.notifications_enabled ? 1 : 0.6 }}>
            <input type="checkbox" checked={Boolean(settingsForm.email_notifications)} disabled={!settingsForm.notifications_enabled} onChange={(e) => setSettingsForm((prev) => ({ ...prev, email_notifications: e.target.checked }))} />
            Email Notifications
          </label>
        </div>
      </div>

      <div className="db-card db-card-p">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1rem', fontWeight: 700 }}>
            <i className="fa-solid fa-lock" style={{ color: 'var(--primary)', marginRight: 8 }}></i>
            Security
          </h2>
          <button className="db-btn-primary" onClick={onChangePassword} disabled={isChangingPassword}>
            {isChangingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Current Password</label>
            <input type="password" className="db-input" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>New Password</label>
            <input type="password" className="db-input" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Confirm Password</label>
            <input type="password" className="db-input" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="db-card db-card-p" style={{ borderColor: '#FECACA', background: '#FEF2F2' }}>
        <h2 style={{ margin: '0 0 1rem', color: '#B91C1C', fontSize: '1rem', fontWeight: 700 }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }}></i>
          Data & Account
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button className="db-btn-secondary" onClick={onExportData} disabled={isExportingData}>
            {isExportingData ? 'Exporting...' : 'Export My Data'}
          </button>
          <button className="db-btn-secondary" onClick={onLogout}>Sign Out</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.9rem', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#991B1B', fontWeight: 700 }}>Confirm Password to Delete Account</label>
            <input type="password" className="db-input" value={dangerPassword} onChange={(e) => setDangerPassword(e.target.value)} placeholder="Enter password" />
          </div>
          <button className="db-btn-danger" onClick={onDeleteAccount} disabled={isDeletingAccount}>
            {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: '0.75rem', fontSize: '0.82rem', color: '#991B1B', fontWeight: 600 }}>
          <input type="checkbox" checked={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.checked)} />
          I understand this permanently deletes my account and progress.
        </label>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

function _readStoredUser() {
  try {
    const parsed = JSON.parse(localStorage.getItem('ww_user') || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const SETTINGS_DEFAULTS = {
  theme: 'light',
  font_size: 'medium',
  notifications_enabled: true,
  email_notifications: true,
  reminder_time: '09:00',
  language: 'en',
};

const FONT_SIZE_MAP = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

const DASHBOARD_TABS = new Set([
  'dashboard',
  'learning',
  'chat',
  'practice',
  'projects',
  'analytics',
  'settings',
]);

function normalizeSettings(rawSettings = {}, fallbackTheme = 'light') {
  const theme = rawSettings?.theme === 'dark'
    ? 'dark'
    : rawSettings?.theme === 'light'
      ? 'light'
      : fallbackTheme;
  const fontSize = ['small', 'medium', 'large'].includes(rawSettings?.font_size)
    ? rawSettings.font_size
    : SETTINGS_DEFAULTS.font_size;

  return {
    ...SETTINGS_DEFAULTS,
    ...rawSettings,
    theme,
    font_size: fontSize,
    reminder_time: rawSettings?.reminder_time || SETTINGS_DEFAULTS.reminder_time,
    language: rawSettings?.language || SETTINGS_DEFAULTS.language,
    notifications_enabled: rawSettings?.notifications_enabled ?? SETTINGS_DEFAULTS.notifications_enabled,
    email_notifications: rawSettings?.email_notifications ?? SETTINGS_DEFAULTS.email_notifications,
  };
}

function Dashboard({ onLogout }) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const storedUser = _readStoredUser();
  const storedProfile = storedUser?.profile || {};
  const initialTheme = storedUser?.settings?.theme === 'dark' ? 'dark' : theme;
  const initialSettings = normalizeSettings(storedUser?.settings, initialTheme);

  const [currentTab, setCurrentTab] = useState(() => {
    const saved = localStorage.getItem('ww_active_tab') || 'dashboard';
    return DASHBOARD_TABS.has(saved) ? saved : 'dashboard';
  });
  const [credits, setCredits] = useState(() => Number(storedProfile.total_credits || storedUser.credits || 0));
  const [showLearningPath, setShowLearningPath] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCuratedModule, setShowCuratedModule] = useState(null);
  const [completedModules, setCompletedModules] = useState([]);
  const [readSections, setReadSections] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [messages, setMessages] = useState([{type:'ai',text:'How can I help you refine your writing today?'}]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatConversations, setChatConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [referenceConversationIds, setReferenceConversationIds] = useState([]);
  const [chatDocuments, setChatDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [practiceText, setPracticeText] = useState('The AI will actively highlight grammar errors and stylistic improvements as you type.\n\nFor example, it easily catches teh common typos. It can even suggest more better phrasing to elevate your professional tone.');
  const [practiceMode, setPracticeMode] = useState('realtime');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [textAlignment, setTextAlignment] = useState('left');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('weekly');
  const [showResults, setShowResults] = useState(false);
  const [openPanel, setOpenPanel] = useState(null); // null | notifications | profile
  const [toast, setToast] = useState(null);
  const [authUser, setAuthUser] = useState(storedUser);
  const [profileStats, setProfileStats] = useState({
    level: Number(storedProfile.current_level || storedUser.level || 1),
    credits: Number(storedProfile.total_credits || storedUser.credits || 0),
    streak: Number(storedProfile.current_streak || storedUser.streak || 0),
    accuracy: Number(storedProfile.accuracy || storedUser.accuracy || 0),
    rank: storedProfile.rank || storedUser.rank || 'Beginner Writer',
  });
  const [userName, setUserName] = useState(storedUser.name || 'Student');
  const [profileForm, setProfileForm] = useState({
    name: storedUser.name || '',
    email: storedUser.email || '',
    phone: storedUser.phone || '',
    role: storedUser.role || 'student',
  });
  const [settingsForm, setSettingsForm] = useState(initialSettings);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [dangerPassword, setDangerPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [chatRenameModal, setChatRenameModal] = useState({
    open: false,
    conversationId: null,
    title: '',
  });
  const [chatDeleteModal, setChatDeleteModal] = useState({
    open: false,
    conversationId: null,
    title: '',
  });
  const [chatDocDeleteModal, setChatDocDeleteModal] = useState({
    open: false,
    documentId: null,
    title: '',
  });
  const [currentProjects, setCurrentProjects] = useState([
    {id:1,title:'My First Story',type:'Story',content:'Once upon a time...',words:234,lastEdited:'Today'},
    {id:2,title:'Project Report 2024',type:'Report',content:'Executive Summary...',words:1250,lastEdited:'Yesterday'}
  ]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectContent, setProjectContent] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const chatBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const practiceEditorRef = useRef(null);
  const topbarRef = useRef(null);

  const togglePanel = (panel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  const showToastMessage = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 2200);
  };

  const persistUserSnapshot = (partial = {}) => {
    const merged = {
      ...(authUser || {}),
      ...partial,
      settings: {
        ...(authUser?.settings || {}),
        ...(partial?.settings || {}),
      },
      profile: {
        ...(authUser?.profile || {}),
        ...(partial?.profile || {}),
      },
    };
    try {
      localStorage.setItem('ww_user', JSON.stringify(merged));
    } catch {
      // Ignore storage write errors and continue.
    }
  };

  const handlePanelNavigate = (path) => {
    if (!path) {
      setCurrentTab('dashboard');
      setOpenPanel(null);
      return;
    }

    if (path.includes('/analytics')) {
      setCurrentTab('analytics');
    } else if (path.includes('/settings')) {
      setCurrentTab('settings');
    } else if (path.includes('/learn')) {
      setCurrentTab('learning');
    } else if (path.includes('/chat')) {
      setCurrentTab('chat');
    } else {
      setCurrentTab('dashboard');
    }

    setOpenPanel(null);
  };

  const handleProfileLogout = async () => {
    await authService.logout();
    setOpenPanel(null);
    showToastMessage('Logged out', 'Logged out successfully');
    setTimeout(() => {
      onLogout?.();
    }, 250);
  };

  React.useEffect(() => {
    setSettingsForm((prev) => (
      prev.theme === theme
        ? prev
        : {
            ...prev,
            theme,
          }
    ));
    persistUserSnapshot({
      settings: {
        ...(authUser?.settings || {}),
        theme,
      },
    });
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ww_active_tab', currentTab);
  }, [currentTab]);

  useEffect(() => {
    const htmlFontSize = FONT_SIZE_MAP[settingsForm.font_size] || FONT_SIZE_MAP.medium;
    document.documentElement.style.fontSize = htmlFontSize;
    return () => {
      document.documentElement.style.fontSize = '';
    };
  }, [settingsForm.font_size]);

  useEffect(() => {
    const outsideHandler = (e) => {
      if (topbarRef.current && !topbarRef.current.contains(e.target)) {
        setOpenPanel(null);
      }
    };

    document.addEventListener('mousedown', outsideHandler);
    return () => document.removeEventListener('mousedown', outsideHandler);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAccountProfile = async () => {
      try {
        const data = await fetchUserProfile();
        const user = data?.user;
        if (!user || cancelled) return;

        const localTheme = localStorage.getItem('ww_theme');
        const preferredTheme = (localTheme === 'dark' || localTheme === 'light')
          ? localTheme
          : user.settings?.theme || theme;
        const normalized = normalizeSettings(user.settings, preferredTheme);
        normalized.theme = preferredTheme;
        setAuthUser(user);
        setUserName(user.name || 'Student');
        setProfileForm({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'student',
        });
        setSettingsForm(normalized);
        setTheme(normalized.theme);
        persistUserSnapshot({
          ...user,
          settings: normalized,
        });
      } catch (err) {
        if (!cancelled) {
          console.warn('Profile load failed:', err?.message || err);
        }
      }
    };

    loadAccountProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProfileStats = async () => {
      try {
        const dashboard = await fetchDashboardData();
        if (cancelled) return;

        const stats = dashboard?.stats || {};
        const levelCurrent = Number(stats?.level?.current || 1);
        const creditsTotal = Number(stats?.credits?.total || 0);
        const streakCurrent = Number(stats?.streak?.current || 0);
        const accuracyPct = Number(stats?.accuracy?.percentage || 0);
        const rankName = stats?.credits?.rank || 'Beginner Writer';

        setProfileStats({
          level: levelCurrent,
          credits: creditsTotal,
          streak: streakCurrent,
          accuracy: accuracyPct,
          rank: rankName,
        });
        setCredits(creditsTotal);
      } catch (e) {
        if (!cancelled) {
          console.warn('Profile stats fetch failed:', e?.message || e);
        }
      }
    };

    loadProfileStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizeHistoryMessages = (data) => {
    const fromApi = (data?.messages || []).map((m) => ({
      type: m.role === 'user' ? 'user' : 'ai',
      text: m.content || '',
      timestamp: m.timestamp || '',
    }));

    return fromApi.length > 0
      ? fromApi
      : [{ type: 'ai', text: 'How can I help you refine your writing today?' }];
  };

  useEffect(() => {
    let cancelled = false;

    const loadDocuments = async () => {
      try {
        const data = await fetchChatDocuments();
        if (cancelled) return;
        const docs = data?.documents || [];
        setChatDocuments(docs);
      } catch (err) {
        if (!cancelled) {
          console.warn('Chat documents load failed:', err?.message || err);
        }
      }
    };

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadConversations = async () => {
      try {
        const data = await fetchChatConversations();
        if (cancelled) return;

        const list = data?.conversations || [];
        setChatConversations(list);

        if (!list.length) {
          setActiveConversationId(null);
          setReferenceConversationIds([]);
          setMessages([{ type: 'ai', text: 'How can I help you refine your writing today?' }]);
          return;
        }

        const requestedActive = data?.active_conversation_id;
        const nextActive = (requestedActive && list.some((item) => item.id === requestedActive))
          ? requestedActive
          : list[0].id;

        setActiveConversationId(nextActive);
        const activeSummary = list.find((item) => item.id === nextActive) || list[0];
        setReferenceConversationIds(activeSummary?.reference_conversation_ids || []);
      } catch (err) {
        if (!cancelled) {
          console.warn('Conversation list load failed:', err?.message || err);
        }
      }
    };

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!activeConversationId) {
      setMessages([{ type: 'ai', text: 'How can I help you refine your writing today?' }]);
      return () => {
        cancelled = true;
      };
    }

    const loadConversationHistory = async () => {
      try {
        const data = await fetchChatHistory(activeConversationId);
        if (cancelled) return;

        setMessages(normalizeHistoryMessages(data));

        const conv = data?.conversation;
        if (conv?.id) {
          setReferenceConversationIds(conv.reference_conversation_ids || []);
          setChatConversations((prev) => prev.map((item) => (item.id === conv.id ? { ...item, ...conv } : item)));
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Chat history load failed:', err?.message || err);
        }
      }
    };

    loadConversationHistory();

    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  const addPoints = (amount) => setCredits(prev=>prev+amount);

  const detectErrors = (text) => {
    const issues = [];
    if(text.includes('teh ')) issues.push({type:'typo',text:'teh',suggestion:'the',hint:'Did you mean "the"?'});
    if(text.includes('recieve')) issues.push({type:'typo',text:'recieve',suggestion:'receive',hint:'Check spelling: "receive"'});
    if(text.includes('occured')) issues.push({type:'typo',text:'occured',suggestion:'occurred',hint:'Double check: "occurred"'});
    if(text.includes('more better')) issues.push({type:'grammar',text:'more better',suggestion:'better',hint:'"better" is already comparative'});
    if(text.includes('very unique')) issues.push({type:'grammar',text:'very unique',suggestion:'unique',hint:'"unique" means one of a kind'});
    if(text.includes('future plans')) issues.push({type:'redundancy',text:'future plans',suggestion:'plans',hint:'Plans are inherently about the future'});
    return issues;
  };

  const handlePracticeTextChange = (e) => setPracticeText(e.target.value);

  const handlePracticeKeyDown = (e) => {
    if(e.key===' ' && practiceMode==='realtime') {
      const currentText = e.currentTarget.value+' ';
      setTimeout(()=>{
        const detected = detectErrors(currentText);
        if(detected.length>0){setSuggestions(detected);setShowSuggestions(true);}
        else setShowSuggestions(false);
      },0);
    }
  };

  const handleAnalyzeText = () => {
    const allErrors = [];
    practiceText.split(/[.!?]+/).filter(s=>s.trim()).forEach(s=>allErrors.push(...detectErrors(s)));
    setSuggestions(allErrors);
    setShowSuggestions(true);
  };

  const handleSaveProfile = async () => {
    const name = profileForm.name.trim();
    if (name.length < 2) {
      showToastMessage('Invalid name', 'Name must be at least 2 characters.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const payload = {
        name,
        phone: profileForm.phone.trim(),
        role: profileForm.role,
      };

      const data = await updateUserProfile(payload);
      const updatedUser = data?.user || {
        ...(authUser || {}),
        ...payload,
      };

      setAuthUser(updatedUser);
      setUserName(updatedUser.name || name);
      setProfileForm((prev) => ({
        ...prev,
        name: updatedUser.name || name,
        phone: updatedUser.phone || payload.phone,
        role: updatedUser.role || payload.role,
        email: updatedUser.email || prev.email,
      }));

      persistUserSnapshot(updatedUser);
      showToastMessage('Profile updated', 'Your account profile has been saved.');
    } catch (err) {
      showToastMessage('Profile update failed', err?.message || 'Could not update profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const payload = {
        theme: settingsForm.theme,
        font_size: settingsForm.font_size,
        notifications_enabled: settingsForm.notifications_enabled,
        email_notifications: settingsForm.email_notifications,
        reminder_time: settingsForm.reminder_time,
        language: settingsForm.language,
      };

      await updateSettings(payload);
      if (payload.theme !== theme) {
        setTheme(payload.theme);
      }

      setAuthUser((prev) => {
        const next = {
          ...(prev || {}),
          settings: {
            ...(prev?.settings || {}),
            ...payload,
          },
        };
        persistUserSnapshot(next);
        return next;
      });

      showToastMessage('Preferences saved', 'Your writing preferences were updated.');
    } catch (err) {
      showToastMessage('Settings save failed', err?.message || 'Could not save settings.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleChangePassword = async () => {
    const currentPassword = passwordForm.currentPassword;
    const newPassword = passwordForm.newPassword;
    const confirmPassword = passwordForm.confirmPassword;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToastMessage('Missing fields', 'Fill all password fields before saving.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToastMessage('Weak password', 'New password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToastMessage('Mismatch', 'New password and confirmation do not match.', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToastMessage('Password changed', 'Please sign in again to continue.');
      setTimeout(async () => {
        await authService.logout();
        onLogout?.();
      }, 500);
    } catch (err) {
      showToastMessage('Password change failed', err?.message || 'Could not change password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const data = await exportUserData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `writewisely-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToastMessage('Export ready', 'Your data export file has been downloaded.');
    } catch (err) {
      showToastMessage('Export failed', err?.message || 'Could not export your data.', 'error');
    } finally {
      setIsExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!dangerPassword.trim()) {
      showToastMessage('Password required', 'Enter your password to delete account.', 'error');
      return;
    }
    if (!deleteConfirm) {
      showToastMessage('Confirm deletion', 'Please confirm account deletion checkbox.', 'error');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteUserAccount(dangerPassword.trim());
      await authService.logout();
      showToastMessage('Account deleted', 'Your account and learning data were removed.');
      setTimeout(() => {
        onLogout?.();
      }, 500);
    } catch (err) {
      showToastMessage('Delete failed', err?.message || 'Could not delete account.', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleNewProject = () => {
    const p={id:Date.now(),title:'Untitled Project',type:'Document',content:'',words:0,lastEdited:'Now'};
    setCurrentProjects(prev=>[...prev,p]);
    setSelectedProject(p.id);setProjectTitle(p.title);setProjectContent(p.content);setIsEditingProject(true);
  };

  const handleSaveProject = () => {
    setCurrentProjects(prev=>prev.map(p=>p.id===selectedProject?{...p,title:projectTitle,content:projectContent,words:projectContent.split(/\s+/).length,lastEdited:'Now'}:p));
    setIsEditingProject(false);alert('Project saved!');
  };

  const handleDeleteProject = (id) => {
    if(window.confirm('Delete this project?')){
      setCurrentProjects(prev=>prev.filter(p=>p.id!==id));
      if(selectedProject===id){setSelectedProject(null);setIsEditingProject(false);}
      alert('Project deleted!');
    }
  };

  const quizQuestions = [
    {id:1,question:'Which sentence is grammatically correct?',options:['She have completed her homework.','She has completed her homework.','She having completed her homework.','She complete her homework.'],correctAnswer:1,points:50},
    {id:2,question:'What is the correct spelling?',options:['Recieve','Receive','Recive','Reciever'],correctAnswer:1,points:50},
    {id:3,question:'Which word is spelled correctly?',options:['Occured','Occured','Occurred','Ocured'],correctAnswer:2,points:50},
    {id:4,question:'Choose the sentence with correct punctuation:',options:['The cat, the dog and the bird are friends.','The cat the dog, and the bird are friends.','The cat, the dog, and the bird are friends.','The cat, the dog and, the bird are friends.'],correctAnswer:2,points:50},
    {id:5,question:"Which is correct use of their/there/they're?",options:["There going to their house over their.","They're going to there house over their.","They're going to their house over there.","There going to there house over they're."],correctAnswer:2,points:50}
  ];

  const handleStartQuiz = () => {setShowQuiz(true);setCurrentQuestionIndex(0);setQuizScore(0);setSelectedAnswer(null);setShowQuizResult(false);};
  const handleAnswerSelect = (i) => setSelectedAnswer(i);
  const handleSubmitAnswer = () => {
    const q=quizQuestions[currentQuestionIndex];
    const ok=selectedAnswer===q.correctAnswer;
    if(ok){setQuizScore(prev=>prev+q.points);setCredits(prev=>prev+q.points);alert('Correct! +'+q.points+' Credits!');}
    else alert('Incorrect. Answer: '+q.options[q.correctAnswer]);
    if(currentQuestionIndex<quizQuestions.length-1){setCurrentQuestionIndex(prev=>prev+1);setSelectedAnswer(null);}
    else setShowQuizResult(true);
  };
  const handleQuizRestart = () => {setShowQuiz(false);setCurrentQuestionIndex(0);setQuizScore(0);setSelectedAnswer(null);setShowQuizResult(false);};

  const curatedModules = {
    'Indian Flag & Nationalism': {
      title:'Indian Flag & Nationalism',description:'Beginner content about our Indian Flag, national symbols, and patriotic values.',icon:'fa-solid fa-flag',
      content:[
        {title:'1. History of the Indian Flag',text:'The Indian tricolor flag consists of saffron, white, and green bands. Saffron symbolizes courage. White represents peace and truth. Green denotes fertility and growth. The Ashoka Chakra has 24 spokes. Adopted on July 22, 1947.'},
        {title:'2. National Symbols & Their Meaning',text:'The 24 spokes represent the 24 hours of a day. Saffron represents courage and sacrifice. White symbolizes peace and communal harmony. Green represents agricultural wealth. These symbols unite 1.4 billion citizens.'},
        {title:'3. Indian Constitution & Nationalism',text:'Adopted on January 26, 1950. Article 51-A defines Fundamental Duties including fostering national spirit. The Preamble ensures justice, liberty, and equality. Indian nationalism is civic, not ethnic.'},
        {title:'4. Patriotic Values & Citizenship',text:'True patriotism means serving the nation through education and ethical conduct. A patriotic citizen respects the national anthem, flag, and symbols. Every citizen shares responsibility for India\'s progress.'},
        {title:'5. Unity in Diversity',text:'India\'s greatest strength is unity in diversity. With 2,000+ ethnic groups and 22 official languages, India demonstrates inclusion. "Vasudhaiva Kutumbakam" - The world is one family.'}
      ]
    }
  };

  const handleOpenModule = (name) => setShowCuratedModule(name);
  const handleCompleteModule = () => {
    if(!completedModules.includes(showCuratedModule)){
      setCompletedModules(prev=>[...prev,showCuratedModule]);
      alert('Reading Complete!');
    }
    setShowCuratedModule(null);
  };

  const handleCreateConversation = async () => {
    try {
      const data = await createChatConversation({
        title: 'New Chat',
        reference_conversation_ids: referenceConversationIds,
      });
      const conv = data?.conversation;
      if (!conv?.id) {
        throw new Error('Could not create a new conversation.');
      }

      setChatConversations((prev) => [conv, ...prev.filter((item) => item.id !== conv.id)]);
      setActiveConversationId(conv.id);
      setReferenceConversationIds(conv.reference_conversation_ids || []);
      setMessages([{ type: 'ai', text: 'How can I help you refine your writing today?' }]);
      setChatInput('');
      showToastMessage('New chat ready', 'Started a fresh conversation.');
    } catch (err) {
      showToastMessage('Create failed', err?.message || 'Unable to create chat.', 'error');
    }
  };

  const handleSwitchConversation = (conversationId) => {
    if (!conversationId || conversationId === activeConversationId) return;
    setActiveConversationId(conversationId);
    const selected = chatConversations.find((item) => item.id === conversationId);
    setReferenceConversationIds(selected?.reference_conversation_ids || []);
  };

  const handleRenameConversation = (conversationId, currentTitle) => {
    if (!conversationId) return;
    setChatRenameModal({
      open: true,
      conversationId,
      title: (currentTitle || 'New Chat').trim(),
    });
  };

  const closeRenameConversationModal = () => {
    setChatRenameModal({ open: false, conversationId: null, title: '' });
  };

  const handleConfirmRenameConversation = async () => {
    const conversationId = chatRenameModal.conversationId;
    const title = (chatRenameModal.title || '').trim();

    if (!conversationId) {
      closeRenameConversationModal();
      return;
    }

    if (!title) {
      showToastMessage('Invalid name', 'Chat title cannot be empty.', 'error');
      return;
    }

    try {
      const data = await updateChatConversation(conversationId, { title });
      const updated = data?.conversation;
      if (updated?.id) {
        setChatConversations((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      }
      closeRenameConversationModal();
      showToastMessage('Renamed', 'Chat title updated.');
    } catch (err) {
      showToastMessage('Rename failed', err?.message || 'Could not rename chat.', 'error');
    }
  };

  const handleDeleteConversation = (conversationId, currentTitle = 'New Chat') => {
    if (!conversationId) return;
    setChatDeleteModal({
      open: true,
      conversationId,
      title: (currentTitle || 'New Chat').trim() || 'New Chat',
    });
  };

  const closeDeleteConversationModal = () => {
    setChatDeleteModal({ open: false, conversationId: null, title: '' });
  };

  const handleConfirmDeleteConversation = async () => {
    const conversationId = chatDeleteModal.conversationId;
    if (!conversationId) {
      closeDeleteConversationModal();
      return;
    }

    try {
      await deleteChatConversation(conversationId);

      const remaining = chatConversations.filter((item) => item.id !== conversationId);
      setChatConversations(remaining);
      setReferenceConversationIds((prev) => prev.filter((id) => id !== conversationId));

      if (conversationId === activeConversationId) {
        const nextActiveId = remaining[0]?.id || null;
        setActiveConversationId(nextActiveId);
        if (!nextActiveId) {
          setMessages([{ type: 'ai', text: 'How can I help you refine your writing today?' }]);
        }
      }

      closeDeleteConversationModal();
      showToastMessage('Deleted', 'Chat conversation removed.');
    } catch (err) {
      showToastMessage('Delete failed', err?.message || 'Could not delete chat.', 'error');
    }
  };

  const handleToggleReferenceConversation = async (conversationId) => {
    if (!conversationId || !activeConversationId || conversationId === activeConversationId) return;

    const nextRefs = referenceConversationIds.includes(conversationId)
      ? referenceConversationIds.filter((id) => id !== conversationId)
      : [...referenceConversationIds, conversationId];

    setReferenceConversationIds(nextRefs);
    setChatConversations((prev) => prev.map((item) => (
      item.id === activeConversationId
        ? { ...item, reference_conversation_ids: nextRefs }
        : item
    )));

    try {
      await updateChatConversation(activeConversationId, {
        reference_conversation_ids: nextRefs,
      });
    } catch (err) {
      showToastMessage('Reference update failed', err?.message || 'Could not update referenced chats.', 'error');
    }
  };

  const handleToggleDocumentSelection = (documentId) => {
    if (!documentId) return;
    setSelectedDocumentIds((prev) => (
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    ));
  };

  const handleDeleteDocumentFromLibrary = (documentId, title = 'Document') => {
    if (!documentId) return;
    setChatDocDeleteModal({
      open: true,
      documentId,
      title: (title || 'Document').trim() || 'Document',
    });
  };

  const closeDeleteDocumentModal = () => {
    setChatDocDeleteModal({ open: false, documentId: null, title: '' });
  };

  const handleConfirmDeleteDocumentFromLibrary = async () => {
    const documentId = chatDocDeleteModal.documentId;
    if (!documentId) {
      closeDeleteDocumentModal();
      return;
    }

    try {
      await deleteChatDocument(documentId);
      setChatDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      setSelectedDocumentIds((prev) => prev.filter((id) => id !== documentId));
      closeDeleteDocumentModal();
      showToastMessage('Document deleted', 'Uploaded file removed.');
    } catch (err) {
      showToastMessage('Delete failed', err?.message || 'Could not delete file.', 'error');
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const sendMessage = async () => {
    const message = chatInput.trim();
    if (!message || isChatSending) return;

    setMessages((prev) => [...prev, { type: 'user', text: message }]);
    setChatInput('');
    setIsChatSending(true);

    try {
      const data = await sendChatMessage(
        message,
        selectedDocumentIds.slice(0, 8),
        activeConversationId,
        referenceConversationIds
      );
      const reply = (data?.response || '').trim() || 'I could not generate a response right now.';
      const returnedConversationId = data?.conversation_id || activeConversationId;
      const returnedTitle = data?.conversation_title || 'New Chat';

      setMessages((prev) => [...prev, { type: 'ai', text: reply }]);

      if (returnedConversationId) {
        setActiveConversationId(returnedConversationId);

        const summary = {
          id: returnedConversationId,
          title: returnedTitle,
          preview: message.length > 90 ? `${message.slice(0, 90)}...` : message,
          updated_at: new Date().toISOString(),
          reference_conversation_ids: data?.reference_conversation_ids || referenceConversationIds,
        };

        setChatConversations((prev) => [
          { ...prev.find((item) => item.id === returnedConversationId), ...summary },
          ...prev.filter((item) => item.id !== returnedConversationId),
        ]);
      }

      if (Array.isArray(data?.reference_conversation_ids)) {
        setReferenceConversationIds(data.reference_conversation_ids);
      }
    } catch (err) {
      const detail = err?.message ? ` ${err.message}` : '';
      setMessages((prev) => [...prev, { type: 'ai', text: `Sorry, I could not respond right now.${detail}` }]);
    } finally {
      setIsChatSending(false);
      setTimeout(() => {
        if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }, 100);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessages((prev) => [...prev, { type: 'file', text: file.name }]);
    e.target.value = '';

    try {
      const uploaded = await uploadChatDocument(file, file.name);
      const title = uploaded?.title || file.name;

      if (uploaded?.id) {
        const normalized = {
          id: uploaded.id,
          title,
          filename: uploaded.filename || file.name,
          word_count: uploaded.word_count || 0,
          preview: uploaded.preview || '',
          updated_at: new Date().toISOString(),
        };
        setChatDocuments((prev) => [normalized, ...prev.filter((doc) => doc.id !== uploaded.id)]);
        setSelectedDocumentIds((prev) => [uploaded.id, ...prev.filter((id) => id !== uploaded.id)]);
      }

      setMessages((prev) => [...prev, { type: 'ai', text: `Uploaded ${title}. I can use it in chat answers now.` }]);
    } catch (err) {
      const detail = err?.message ? ` ${err.message}` : '';
      setMessages((prev) => [...prev, { type: 'ai', text: `File upload failed.${detail}` }]);
    } finally {
      setTimeout(() => {
        if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }, 100);
    }
  };

  const navItems = [
    {id:'dashboard',label:'Dashboard',icon:'fa-house-chimney'},
    {id:'learning',label:'Learning Hub',icon:'fa-graduation-cap',section:'Workspace'},
    {id:'chat',label:'Chat AI',icon:'fa-comment-dots'},
    {id:'practice',label:'Practice Panel',icon:'fa-pen-nib'},
    {id:'projects',label:'Projects',icon:'fa-layer-group'},
    {id:'analytics',label:'Analytics',icon:'fa-chart-line'},
    {id:'settings',label:'Settings',icon:'fa-sliders'}
  ];

  const [learningLevelId, setLearningLevelId] = useState(() => {
    const raw = localStorage.getItem('ww_learning_level_id');
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });
  const [practiceTaskId, setPracticeTaskId] = useState(() => {
    const raw = localStorage.getItem('ww_practice_task_id');
    return raw || null;
  });

  useEffect(() => {
    if (learningLevelId) {
      localStorage.setItem('ww_learning_level_id', String(learningLevelId));
    } else {
      localStorage.removeItem('ww_learning_level_id');
    }
  }, [learningLevelId]);

  useEffect(() => {
    if (practiceTaskId) {
      localStorage.setItem('ww_practice_task_id', String(practiceTaskId));
    } else {
      localStorage.removeItem('ww_practice_task_id');
    }
  }, [practiceTaskId]);

  const renderView = () => {
    if (currentTab === 'learning') {
      if (learningLevelId) {
        return (
          <Lesson
            levelId={learningLevelId}
            onBack={() => setLearningLevelId(null)}
          />
        );
      }
      return (
        <LearningHome
          onNavigateToLesson={(id) => setLearningLevelId(id)}
        />
      );
    }
    if(currentTab==='learning' && showLearningPath) return <AllLevelsViewComp setShowLearningPath={setShowLearningPath} addPoints={addPoints}/>;
    switch(currentTab) {
      case 'dashboard': return <DashboardViewComp setCurrentTab={setCurrentTab}/>;
      case 'learning': return <LearningViewComp setCurrentTab={setCurrentTab} completedModules={completedModules} handleOpenModule={handleOpenModule} handleStartQuiz={handleStartQuiz} setShowLearningPath={setShowLearningPath} practiceText={practiceText} handlePracticeTextChange={handlePracticeTextChange} handlePracticeKeyDown={handlePracticeKeyDown} textAlignment={textAlignment} setTextAlignment={setTextAlignment} isBold={isBold} setIsBold={setIsBold} isItalic={isItalic} setIsItalic={setIsItalic} isUnderline={isUnderline} setIsUnderline={setIsUnderline} showSuggestions={showSuggestions} suggestions={suggestions}/>;
      case 'chat':
        return (
          <ChatViewComp
            messages={messages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendMessage={sendMessage}
            handleFileUpload={handleFileUpload}
            openFilePicker={openFilePicker}
            fileInputRef={fileInputRef}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            chatBoxRef={chatBoxRef}
            isChatSending={isChatSending}
            conversations={chatConversations}
            activeConversationId={activeConversationId}
            onCreateConversation={handleCreateConversation}
            onSwitchConversation={handleSwitchConversation}
            onRenameConversation={handleRenameConversation}
            onDeleteConversation={handleDeleteConversation}
            referenceConversationIds={referenceConversationIds}
            onToggleReferenceConversation={handleToggleReferenceConversation}
            chatDocuments={chatDocuments}
            selectedDocumentIds={selectedDocumentIds}
            onToggleDocumentSelection={handleToggleDocumentSelection}
            onDeleteDocument={handleDeleteDocumentFromLibrary}
          />
        );
      case 'practice':
        if (practiceTaskId) {
          return (
            <PracticeEditor
              taskId={practiceTaskId}
              onBack={() => setPracticeTaskId(null)}
              onNavigate={(tab) => { setPracticeTaskId(null); setCurrentTab(tab); }}
            />
          );
        }
        return (
          <PracticeHome
            onNavigate={(view, taskId) => {
              if (view === 'editor' && taskId) setPracticeTaskId(taskId);
            }}
          />
        );
      case 'projects': return <Projects />;
      case 'analytics': return <Analytics />;
      case 'settings':
        return (
          <SettingsViewComp
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            dangerPassword={dangerPassword}
            setDangerPassword={setDangerPassword}
            deleteConfirm={deleteConfirm}
            setDeleteConfirm={setDeleteConfirm}
            isSavingProfile={isSavingProfile}
            isSavingSettings={isSavingSettings}
            isChangingPassword={isChangingPassword}
            isExportingData={isExportingData}
            isDeletingAccount={isDeletingAccount}
            onSaveProfile={handleSaveProfile}
            onSaveSettings={handleSaveSettings}
            onChangePassword={handleChangePassword}
            onExportData={handleExportData}
            onDeleteAccount={handleDeleteAccount}
            onLogout={handleProfileLogout}
          />
        );
      default: return <DashboardViewComp setCurrentTab={setCurrentTab}/>;
    }
  };

  return (
    <div className="db-root">
      {/* Sidebar */}
      <aside className="db-sidebar">
        <div className="db-sidebar-logo">
          <div className="db-logo-icon">W</div>
          <span className="db-logo-text">Write<span>Wisely</span></span>
        </div>
        <nav className="db-nav">
          {navItems.map(item=>(
            <React.Fragment key={item.id}>
              {item.section && <div className="db-nav-section-label">{item.section}</div>}
              <div className={'db-nav-item'+(currentTab===item.id?' active':'')} onClick={()=>setCurrentTab(item.id)}>
                <i className={'fa-solid '+item.icon} style={{width:18}}></i> {item.label}
              </div>
            </React.Fragment>
          ))}
        </nav>
        <div className="db-sidebar-footer">
          <button className="db-signout-btn" onClick={()=>onLogout()}>
            <i className="fa-solid fa-power-off" style={{width:18}}></i> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="db-main">
        {/* Top Bar */}
        <header className="db-topbar">
          <div className="db-topbar-title">Welcome to <span>WriteWisely</span></div>
          <div className="db-topbar-actions" ref={topbarRef}>
            <div className="db-credits-badge">
              <i className="fa-solid fa-coins"></i> {credits.toLocaleString()} Credits
            </div>
            <NotificationBell
              isOpen={openPanel === 'notifications'}
              onToggle={() => togglePanel('notifications')}
              onNavigate={handlePanelNavigate}
            />
            <ProfileDropdown
              isOpen={openPanel === 'profile'}
              onToggle={() => togglePanel('profile')}
              user={{
                ...authUser,
                name: userName,
                phone: authUser?.phone || '',
              }}
              stats={{
                ...profileStats,
                credits,
                rank: profileStats.rank || 'Beginner Writer',
              }}
              theme={theme}
              toggleTheme={toggleTheme}
              onNavigate={handlePanelNavigate}
              onLogout={handleProfileLogout}
            />
          </div>
        </header>

        {/* Toast */}
        {toast && (
          <div className="db-toast" style={{ background: toast.type === 'error' ? '#EF4444' : '#10B981' }}>
            <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'}`}></i>
            <div>
              <p style={{fontWeight:700,fontSize:'0.875rem'}}>{toast.title}</p>
              <p style={{fontSize:'0.8rem',opacity:0.9}}>{toast.message}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="db-content">{renderView()}</div>
      </main>

        {/* Chat Rename Modal */}
        {chatRenameModal.open && (
          <div className="db-modal-overlay" onClick={closeRenameConversationModal}>
            <div className="db-modal" style={{maxWidth:520}} onClick={(e)=>e.stopPropagation()}>
              <div className="db-modal-header" style={{paddingBottom:'1rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <h2 style={{fontSize:'1.15rem',fontWeight:700}}>Rename Chat</h2>
                  <button className="db-icon-btn" onClick={closeRenameConversationModal}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
              <div className="db-modal-body" style={{display:'flex',flexDirection:'column',gap:'0.65rem'}}>
                <label style={{fontSize:'0.8rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                  Chat Name
                </label>
                <input
                  className="db-input"
                  autoFocus
                  value={chatRenameModal.title}
                  onChange={(e)=>setChatRenameModal((prev)=>({ ...prev, title: e.target.value }))}
                  onKeyDown={(e)=>{ if (e.key === 'Enter') handleConfirmRenameConversation(); }}
                  placeholder="Enter a chat name"
                  maxLength={120}
                />
                <p style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>
                  Rename this conversation inside your workspace.
                </p>
              </div>
              <div className="db-modal-actions">
                <button className="db-btn-secondary" style={{flex:1}} onClick={closeRenameConversationModal}>Cancel</button>
                <button
                  className="db-btn-primary"
                  style={{flex:1,justifyContent:'center'}}
                  disabled={!chatRenameModal.title.trim()}
                  onClick={handleConfirmRenameConversation}
                >
                  Save Name
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Delete Modal */}
        {chatDeleteModal.open && (
          <div className="db-modal-overlay" onClick={closeDeleteConversationModal}>
            <div className="db-modal" style={{maxWidth:520}} onClick={(e)=>e.stopPropagation()}>
              <div className="db-modal-header" style={{paddingBottom:'1rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <h2 style={{fontSize:'1.15rem',fontWeight:700}}>Delete Chat</h2>
                  <button className="db-icon-btn" onClick={closeDeleteConversationModal}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
              <div className="db-modal-body" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                <p style={{fontSize:'0.92rem',color:'var(--text-dark)',fontWeight:600}}>
                  Are you sure you want to delete this chat?
                </p>
                <div style={{background:'var(--surface-soft)',border:'1px solid var(--border)',borderRadius:12,padding:'0.8rem 0.9rem'}}>
                  <p style={{fontSize:'0.84rem',color:'var(--text-dark)',fontWeight:700,margin:0}}>{chatDeleteModal.title || 'New Chat'}</p>
                </div>
                <p style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>This action cannot be undone.</p>
              </div>
              <div className="db-modal-actions">
                <button className="db-btn-secondary" style={{flex:1}} onClick={closeDeleteConversationModal}>Cancel</button>
                <button className="db-btn-danger" style={{flex:1,justifyContent:'center'}} onClick={handleConfirmDeleteConversation}>Delete Chat</button>
              </div>
            </div>
          </div>
        )}

        {/* File Delete Modal */}
        {chatDocDeleteModal.open && (
          <div className="db-modal-overlay" onClick={closeDeleteDocumentModal}>
            <div className="db-modal" style={{maxWidth:520}} onClick={(e)=>e.stopPropagation()}>
              <div className="db-modal-header" style={{paddingBottom:'1rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <h2 style={{fontSize:'1.15rem',fontWeight:700}}>Delete Uploaded File</h2>
                  <button className="db-icon-btn" onClick={closeDeleteDocumentModal}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
              <div className="db-modal-body" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                <p style={{fontSize:'0.92rem',color:'var(--text-dark)',fontWeight:600}}>
                  Remove this uploaded file from your chat library?
                </p>
                <div style={{background:'var(--surface-soft)',border:'1px solid var(--border)',borderRadius:12,padding:'0.8rem 0.9rem'}}>
                  <p style={{fontSize:'0.84rem',color:'var(--text-dark)',fontWeight:700,margin:0}}>{chatDocDeleteModal.title || 'Document'}</p>
                </div>
                <p style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>You can upload it again later if needed.</p>
              </div>
              <div className="db-modal-actions">
                <button className="db-btn-secondary" style={{flex:1}} onClick={closeDeleteDocumentModal}>Cancel</button>
                <button className="db-btn-danger" style={{flex:1,justifyContent:'center'}} onClick={handleConfirmDeleteDocumentFromLibrary}>Delete File</button>
              </div>
            </div>
          </div>
        )}

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="db-modal-overlay">
          <div className="db-modal">
            {!showQuizResult ? (
              <>
                <div className="db-modal-header">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.75rem'}}>
                    <p style={{fontSize:'0.875rem',fontWeight:600,opacity:0.9}}>Question {currentQuestionIndex+1}/{quizQuestions.length}</p>
                    <span style={{fontSize:'1.1rem'}}><i className="fa-solid fa-file-pen"></i></span>
                  </div>
                  <h2 style={{fontSize:'1.25rem',fontWeight:700}}>{quizQuestions[currentQuestionIndex].question}</h2>
                  <div style={{width:'100%',background:'rgba(255,255,255,0.3)',borderRadius:999,height:6,marginTop:'1rem'}}>
                    <div style={{background:'var(--primary)',height:'100%',borderRadius:999,width:((currentQuestionIndex+1)/quizQuestions.length*100)+'%'}}></div>
                  </div>
                </div>
                <div className="db-modal-body" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                  {quizQuestions[currentQuestionIndex].options.map((opt,idx)=>(
                    <button key={idx} onClick={()=>handleAnswerSelect(idx)} style={{width:'100%',padding:'0.875rem 1rem',borderRadius:12,border:'2px solid',borderColor:selectedAnswer===idx?'var(--primary)':'var(--border)',background:selectedAnswer===idx?'var(--primary)':'var(--bg-white)',color:selectedAnswer===idx?'white':'var(--text-dark)',fontWeight:600,cursor:'pointer',textAlign:'left',fontFamily:'inherit',fontSize:'0.9rem',transition:'all 0.15s'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                        <div style={{width:22,height:22,borderRadius:'50%',border:'2px solid',borderColor:selectedAnswer===idx?'white':'var(--text-muted)',background:selectedAnswer===idx?'white':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          {selectedAnswer===idx && <span style={{color:'var(--primary)',fontSize:'0.8rem',fontWeight:900}}><i className="fa-solid fa-check"></i></span>}
                        </div>
                        {opt}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="db-modal-actions">
                  <button className="db-btn-secondary" style={{flex:1}} onClick={handleQuizRestart}>Exit Quiz</button>
                  <button className="db-btn-primary" style={{flex:1,justifyContent:'center',opacity:selectedAnswer===null?0.5:1,cursor:selectedAnswer===null?'not-allowed':'pointer'}} disabled={selectedAnswer===null} onClick={handleSubmitAnswer}>Submit Answer</button>
                </div>
              </>
            ) : (
              <div style={{padding:'3rem 2rem',textAlign:'center',display:'flex',flexDirection:'column',gap:'1.5rem',alignItems:'center'}}>
                <span style={{fontSize:'3.4rem',color:'#F59E0B'}}><i className="fa-solid fa-award"></i></span>
                <div>
                  <h2 style={{fontSize:'1.75rem',fontWeight:700,color:'var(--text-dark)',marginBottom:'0.5rem'}}>Quiz Completed!</h2>
                  <p style={{color:'var(--text-muted)',marginBottom:'0.5rem'}}>Final Score</p>
                  <p style={{fontSize:'3rem',fontWeight:700,color:'var(--primary)',lineHeight:1}}>{quizScore}</p>
                  <p style={{fontSize:'0.875rem',color:'var(--text-muted)',marginTop:'0.5rem'}}>+{quizScore} Credits Added</p>
                </div>
                <div style={{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:12,padding:'1rem',width:'100%'}}>
                  <p style={{color:'#059669',fontWeight:600}}><i className="fa-solid fa-circle-check" style={{marginRight:6}}></i>Great job! Keep learning to improve.</p>
                </div>
                <button className="db-btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={handleQuizRestart}>Back to Learning Hub</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Curated Module Modal */}
      {showCuratedModule && curatedModules[showCuratedModule] && (
        <div className="db-modal-overlay">
          <div className="db-modal" style={{maxWidth:640}}>
            <div className="db-modal-header" style={{position:'sticky',top:0,zIndex:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <span style={{fontSize:'2rem',display:'block',marginBottom:'0.5rem'}}><i className={curatedModules[showCuratedModule].icon}></i></span>
                  <h2 style={{fontSize:'1.25rem',fontWeight:700}}>{curatedModules[showCuratedModule].title}</h2>
                  <p style={{fontSize:'0.875rem',opacity:0.9,marginTop:'0.25rem'}}>{curatedModules[showCuratedModule].description}</p>
                </div>
                <button style={{background:'none',border:'none',color:'white',fontSize:'1.5rem',cursor:'pointer',lineHeight:1}} onClick={()=>setShowCuratedModule(null)}>×</button>
              </div>
            </div>
            <div className="db-modal-body" style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
              {curatedModules[showCuratedModule].content.map((sec,idx)=>{
                const key=showCuratedModule+'-'+idx;
                return (
                  <div key={idx} style={{borderLeft:'4px solid var(--primary)',paddingLeft:'1rem'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:'0.75rem'}}>
                      <input type="checkbox" checked={readSections[key]||false} onChange={(e)=>setReadSections(prev=>({...prev,[key]:e.target.checked}))} style={{width:18,height:18,marginTop:2,accentColor:'var(--primary)',cursor:'pointer',flexShrink:0}}/>
                      <div><h3 style={{fontWeight:700,color:'var(--text-dark)',marginBottom:'0.35rem'}}>{sec.title}</h3><p style={{color:'var(--text-muted)',lineHeight:1.7,fontSize:'0.9rem'}}>{sec.text}</p></div>
                    </div>
                  </div>
                );
              })}
              {(() => {
                const allRead = curatedModules[showCuratedModule].content.every((_,idx)=>readSections[showCuratedModule+'-'+idx]);
                return (
                  <div style={{padding:'1rem',borderRadius:12,background:allRead?'#EDE9FE':'#F9FAFB',border:'1px solid',borderColor:allRead?'#DDD6FE':'var(--border)'}}>
                    <p style={{fontWeight:700,color:allRead?'var(--primary)':'var(--text-dark)',marginBottom:'0.2rem'}}>{allRead ? <><i className="fa-solid fa-circle-check" style={{marginRight:6}}></i>All Sections Read!</> : <><i className="fa-solid fa-book-open" style={{marginRight:6}}></i>Mark sections as read to complete</>}</p>
                    <p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{Object.values(readSections).filter(v=>v).length}/{curatedModules[showCuratedModule].content.length} sections read</p>
                  </div>
                );
              })()}
            </div>
            <div className="db-modal-actions">
              <button className="db-btn-secondary" style={{flex:1}} onClick={()=>setShowCuratedModule(null)}>Continue Later</button>
              <button className="db-btn-primary" style={{flex:1,justifyContent:'center',opacity:curatedModules[showCuratedModule].content.every((_,idx)=>readSections[showCuratedModule+'-'+idx])?1:0.5}} disabled={!curatedModules[showCuratedModule].content.every((_,idx)=>readSections[showCuratedModule+'-'+idx])} onClick={()=>{if(curatedModules[showCuratedModule].content.every((_,idx)=>readSections[showCuratedModule+'-'+idx]))handleCompleteModule();}}>
                {completedModules.includes(showCuratedModule)
                  ? <><i className="fa-solid fa-circle-check" style={{marginRight:6}}></i>Already Completed</>
                  : <><i className="fa-solid fa-circle-check" style={{marginRight:6}}></i>Mark as Completed</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
