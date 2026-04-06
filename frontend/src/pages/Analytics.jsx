import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer
} from 'recharts';
import { fetchAnalyticsOverview } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import './Dashboard.css';

/* ─── Error-type colour map ─────────────────────────────── */
const ETYPE_COLOR = {
  spelling:      '#F59E0B',
  grammar:       '#EF4444',
  punctuation:   '#8B5CF6',
  word_confusion:'#3B82F6',
  other:         '#6B7280',
};

/* ─── Helpers ────────────────────────────────────────────── */
function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function stripLeadingSymbols(text = '') {
  return String(text).replace(/^[^A-Za-z0-9]+\s*/, '').trim();
}

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

function dirIcon(dir, lowerIsBetter = false) {
  if (dir === 'same') return { arrow: '↔', color: '#94A3B8' };
  const good = lowerIsBetter ? dir === 'down' : dir === 'up';
  return { arrow: dir === 'up' ? '↑' : '↓', color: good ? '#16A34A' : '#EF4444' };
}

/* ─── Shared wrappers ────────────────────────────────────── */
function SectionCard({ title, subtitle, iconClass, children, style = {} }) {
  return (
    <div className="ww-card" style={{ padding: '1.5rem', ...style }}>
      {title && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 className="db-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            {iconClass && <i className={iconClass} style={{ color: 'var(--primary)', fontSize: '0.9rem' }} />}
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function ProgressBar({ value, max, color, height = 8 }) {
  const pct = max > 0 ? Math.min(100, value / max * 100) : 0;
  return (
    <div className="db-progress-track" style={{ height }}>
      <div className="db-progress-fill" style={{ width: `${pct}%`, background: color || 'var(--primary)', transition: 'width 0.8s ease' }} />
    </div>
  );
}

function EmptyState({ iconClass = 'fa-solid fa-chart-column', message, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
      <div style={{ marginBottom: 8 }}>
        <i className={iconClass} style={{ fontSize: '1.7rem', color: 'var(--primary)' }} />
      </div>
      <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.9rem' }}>{message}</div>
      {sub && <div style={{ fontSize: '0.77rem', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ─── Custom Recharts Tooltip ────────────────────────────── */
function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-white)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: '0.77rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)', lineHeight: 1.7,
    }}>
      <strong style={{ display: 'block', marginBottom: 4, color: 'var(--text-dark)' }}>{label}</strong>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}{unit}</strong>
        </div>
      ))}
    </div>
  );
}

/* ─── Period Selector ────────────────────────────────────── */
function PeriodSelector({ period, onChange }) {
  const tabs = [
    { key: 'daily',   label: 'Daily', iconClass: 'fa-regular fa-calendar' },
    { key: 'weekly',  label: 'Weekly', iconClass: 'fa-solid fa-calendar-week' },
    { key: 'monthly', label: 'Monthly', iconClass: 'fa-solid fa-calendar-days' },
  ];
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--surface-muted)', borderRadius: 12, padding: '4px', width: 'fit-content' }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          padding: '8px 22px', borderRadius: 9, border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: '0.82rem', fontFamily: 'var(--font)',
          background: period === t.key ? 'var(--bg-white)' : 'transparent',
          color: period === t.key ? 'var(--primary)' : 'var(--text-muted)',
          boxShadow: period === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.15s',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <i className={t.iconClass} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Activity Heatmap ───────────────────────────────────── */
function ActivityHeatmap({ heatmapData = {} }) {
  const weeks = [];
  const today = new Date();
  for (let w = 51; w >= 0; w--) {
    const days = [];
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - (w * 7 + d));
      const iso = dt.toISOString().slice(0, 10);
      days.unshift({ date: iso, mins: heatmapData[iso] || 0 });
    }
    weeks.push(days);
  }

  function cellColor(mins) {
    if (mins === 0) return '#EEF2FF';
    if (mins <= 20) return '#C7D2FE';
    if (mins <= 50) return '#818CF8';
    if (mins <= 90) return '#5B5FDE';
    return '#3730A3';
  }

  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 18, marginRight: 4, flexShrink: 0 }}>
          {DAY_LABELS.map((l, i) => (
            <div key={i} style={{ height: 12, fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: '12px', width: 10, textAlign: 'right' }}>{l}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ height: 16, fontSize: '0.6rem', color: 'var(--text-muted)', paddingBottom: 2 }}>
              {wi % 4 === 0 ? new Date(week[0].date).toLocaleDateString('en-US', { month: 'short' }) : ''}
            </div>
            {week.map((day, di) => (
              <div key={di}
                title={`${day.date}: ${day.mins} min`}
                style={{ width: 12, height: 12, borderRadius: 2, background: cellColor(day.mins), cursor: 'default', transition: 'transform 0.1s' }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, fontSize: '0.7rem', color: 'var(--text-muted)', alignItems: 'center' }}>
        <span>Less</span>
        {['#EEF2FF', '#C7D2FE', '#818CF8', '#5B5FDE', '#3730A3'].map(c => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

/* ─── Badge Grid ─────────────────────────────────────────── */
function BadgeGrid({ allDefs = [], earned = [] }) {
  const [tip, setTip] = useState(null);
  const earnedMap = Object.fromEntries(earned.map(b => [b.badge_id, b]));
  const BADGE_ICON_CLASS = {
    first_steps: 'fa-solid fa-shoe-prints',
    bookworm: 'fa-solid fa-book-open',
    writer_badge: 'fa-solid fa-pen-nib',
    on_fire: 'fa-solid fa-fire',
    sharpshooter: 'fa-solid fa-bullseye',
    scholar: 'fa-solid fa-graduation-cap',
    perfectionist: 'fa-solid fa-gem',
    champion: 'fa-solid fa-trophy',
    master: 'fa-solid fa-medal',
    legend: 'fa-solid fa-crown',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
      {allDefs.map(b => {
        const e = earnedMap[b.badge_id];
        const iconClass = BADGE_ICON_CLASS[b.badge_id] || 'fa-solid fa-award';
        return (
          <div key={b.badge_id}
            onMouseEnter={() => setTip(b.badge_id)}
            onMouseLeave={() => setTip(null)}
            style={{
              position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '12px 6px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
              border: e ? '2px solid #F59E0B' : '2px solid var(--border)',
              background: e ? '#FFFBEB' : '#F8FAFC',
              opacity: e ? 1 : 0.55, transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: e ? '#FEF3C7' : '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: e ? '#B45309' : '#64748B',
              marginBottom: 6,
            }}>
              <i className={iconClass} style={{ fontSize: '1rem' }} />
            </div>
            <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.2 }}>
              {stripLeadingSymbols(b.name)}
            </span>
            <span style={{ fontSize: '0.75rem', marginTop: 5, color: e ? '#16A34A' : '#94A3B8' }}>
              <i className={e ? 'fa-solid fa-circle-check' : 'fa-solid fa-lock'} />
            </span>
            {tip === b.badge_id && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
                background: 'var(--text-dark)', color: '#fff', borderRadius: 8, padding: '7px 12px',
                fontSize: '0.72rem', whiteSpace: 'nowrap', zIndex: 50,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)', pointerEvents: 'none', lineHeight: 1.6,
              }}>
                {e
                  ? `Earned: ${new Date(e.earned_at).toLocaleDateString()}`
                  : `${b.requirement}`
                }
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Certificate ────────────────────────────────────────── */
function Certificate({ cards }) {
  const ref = useRef(null);

  const download = async () => {
    try {
      const { toPng } = await import('html-to-image');
      const url = await toPng(ref.current, { quality: 0.95, pixelRatio: 2 });
      const a = document.createElement('a');
      a.download = 'WriteWisely_Certificate.png';
      a.href = url;
      a.click();
    } catch { alert('Certificate generation failed. Please try again.'); }
  };

  return (
    <div>
      <div ref={ref} style={{
        borderRadius: 18,
        overflow: 'hidden',
        background: '#FFFFFF',
        border: '1px solid #DCE3F1',
        boxShadow: '0 20px 45px rgba(37,99,235,0.14)',
      }}>
        <div style={{
          background: 'linear-gradient(120deg, #1D4ED8 0%, #4338CA 100%)',
          color: '#fff',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.66rem', letterSpacing: '0.15em', opacity: 0.85, textTransform: 'uppercase', fontWeight: 700 }}>
              Achievement Certificate
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: 2 }}>WriteWisely Analytics</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-award" style={{ fontSize: '0.95rem' }} />
          </div>
        </div>

        <div style={{ padding: '1.35rem 1.25rem 1.15rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.15rem', color: '#0F172A', fontWeight: 700, marginBottom: 4 }}>
            Certificate of Progress
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: 14 }}>
            Awarded for consistent growth in writing quality and practice discipline.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 320, margin: '0 auto 12px' }}>
          {[
            ['Level', `${cards.level}/30`],
            ['Accuracy', `${cards.accuracy}%`],
            ['Streak', `${cards.streak} days`],
            ['Credits', fmt(cards.credits)],
            ['Badges', `${cards.badgesEarned || 0} earned`],
          ].map(([k, v]) => (
            <div key={k} style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.56rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{v}</div>
            </div>
          ))}

            <div style={{ background: '#EFF6FF', borderRadius: 10, padding: '8px 10px', border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: '0.56rem', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Issued On</div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E3A8A' }}>
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, borderTop: '1px solid #CBD5E1', paddingTop: 6, fontSize: '0.67rem', color: '#64748B', textAlign: 'left' }}>
              Platform Signature
            </div>
            <div style={{ flex: 1, borderTop: '1px solid #CBD5E1', paddingTop: 6, fontSize: '0.67rem', color: '#64748B', textAlign: 'right' }}>
              Verified Learner Record
            </div>
          </div>
        </div>
      </div>
      <button className="ww-btn-secondary" onClick={download} style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}>
        <i className="fa-solid fa-download" style={{ marginRight: 8 }} />
        Download Certificate
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function Analytics() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [period, setPeriod] = useState('weekly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cache, setCache] = useState({});

  const load = useCallback(async (p) => {
    if (cache[p]) { setData(cache[p]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetchAnalyticsOverview(p);
      setData(res);
      setCache(prev => ({ ...prev, [p]: res }));
    } catch (e) {
      console.error('Analytics fetch failed:', e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [cache]);

  useEffect(() => { load(period); }, [period]);

  /* Destructure safely */
  const cards     = data?.overview_cards     || {};
  const graph     = data?.accuracy_graph     || [];
  const errA      = data?.error_analysis     || {};
  const learn     = data?.learning_progress  || {};
  const pract     = data?.practice_performance || {};
  const timeAct   = data?.time_activity      || {};
  const achieve   = data?.achievements       || {};
  const cmp       = data?.comparison         || {};
  const insights  = data?.insights           || [];

  return (
    <div className="analytics-root ww-page-enter" style={{ paddingBottom: '2rem' }}>

      {/* ── Page Header ───────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="db-page-title">
          Analytics <span>Dashboard</span>
        </h1>
        <p className="db-page-sub">Track your writing progress and improvements.</p>
        <div style={{ marginTop: '1rem' }}>
          <PeriodSelector period={period} onChange={p => { setLoading(true); setData(null); setPeriod(p); }} />
        </div>
      </div>

      {/* ── Loading ────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="ww-card" style={{ padding: '1.5rem' }}>
              <Skel w={180} h={20} r={6} />
              <div style={{ height: 12 }} />
              <Skel w="100%" h={80} r={10} />
            </div>
          ))}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────── */}
      {!loading && !data && (
        <div className="ww-card" style={{ padding: '2.5rem' }}>
          <EmptyState iconClass="fa-solid fa-triangle-exclamation" message="Couldn't load analytics" sub="Make sure the backend is running and try refreshing." />
        </div>
      )}

      {/* ── Content ───────────────────────────────────────── */}
      {!loading && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ═══ SECTION 1: KPI Overview Cards ═══════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              {
                iconClass: 'fa-solid fa-chart-line',
                label: 'Average Accuracy',
                value: `${cards.accuracy || 0}%`,
                sub: cards.period_label || 'Selected period',
                iconBg: isDark ? 'rgba(59,130,246,0.22)' : '#DBEAFE',
              },
              {
                iconClass: 'fa-solid fa-square-pen',
                label: 'Practice Average',
                value: `${cards.avg_practice_score || 0}/10`,
                sub: `${cards.practice_done || 0} practice tasks`,
                iconBg: isDark ? 'rgba(16,185,129,0.22)' : '#DCFCE7',
              },
              {
                iconClass: 'fa-solid fa-list-check',
                label: 'Practice Done',
                value: `${cards.practice_done || 0}`,
                sub: cards.period_label || 'Selected period',
                iconBg: isDark ? 'rgba(139,92,246,0.24)' : '#EDE9FE',
              },
              {
                iconClass: 'fa-solid fa-file-lines',
                label: 'Words Written',
                value: fmt(cards.total_words),
                sub: cards.period_label || 'Selected period',
                iconBg: isDark ? 'rgba(245,158,11,0.22)' : '#FEF3C7',
              },
              {
                iconClass: 'fa-solid fa-triangle-exclamation',
                label: 'Errors Logged',
                value: `${cards.total_errors || 0}`,
                sub: 'Detected issues',
                iconBg: isDark ? 'rgba(239,68,68,0.22)' : '#FEE2E2',
              },
              {
                iconClass: 'fa-solid fa-circle-check',
                label: 'Errors Resolved',
                value: `${cards.errors_resolved || 0}`,
                sub: 'Improved corrections',
                iconBg: isDark ? 'rgba(16,185,129,0.22)' : '#DCFCE7',
              },
              {
                iconClass: 'fa-regular fa-clock',
                label: 'Time Logged',
                value: `${cards.time_minutes || 0}m`,
                sub: cards.period_label || 'Selected period',
                iconBg: isDark ? 'rgba(148,163,184,0.24)' : '#E2E8F0',
              },
              {
                iconClass: 'fa-solid fa-coins',
                label: 'Credits Earned',
                value: fmt(cards.credits),
                sub: cards.period_label || 'Selected period',
                iconBg: isDark ? 'rgba(250,204,21,0.24)' : '#FDE68A',
              },
            ].map((c, i) => (
              <div key={i} className="ww-card" style={{ padding: '1.1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'var(--text-dark)' }}>
                    <i className={c.iconClass} />
                  </div>
                  <span className="ww-pill-green" style={{ fontSize: '0.65rem' }}>{period.toUpperCase()}</span>
                </div>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>{c.value}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '1px 0 8px' }}>{c.label}</p>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 7 }}>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: 0 }}>{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ═══ SECTION 2: Accuracy Trend ════════════════════ */}
          <SectionCard title="Accuracy Over Time" iconClass="fa-solid fa-chart-line" subtitle="Your accuracy and practice performance trend">
            {graph.length === 0 ? (
              <EmptyState iconClass="fa-solid fa-chart-area" message="No trend data yet" sub="Complete quizzes and practice tasks to see your progress chart." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={graph} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font)' }} unit="%" />
                  <Tooltip content={<ChartTooltip unit="%" />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '0.78rem', fontFamily: 'var(--font)' }} />
                  <ReferenceLine y={80} stroke="#C7D2FE" strokeDasharray="6 3"
                    label={{ value: '80% Target', position: 'insideTopLeft', fontSize: 10, fill: 'var(--primary)' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="var(--primary)" strokeWidth={2.5}
                    dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }} name="Accuracy %" activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="practice_avg" stroke="#10B981" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} name="Practice Avg %" activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          {/* ═══ SECTION 3: Error Analysis ════════════════════ */}
          <SectionCard title="Error Analysis" iconClass="fa-solid fa-bug" subtitle="Error breakdown by type and most repeated mistakes">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Donut */}
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8 }}>Distribution</p>
                {(errA.distribution || []).length === 0 ? (
                  <EmptyState iconClass="fa-solid fa-circle-check" message="No errors recorded" sub="Great consistency." />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={errA.distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value" paddingAngle={3}>
                        {(errA.distribution || []).map((e, i) => (
                          <Cell key={i} fill={ETYPE_COLOR[e.name] || ETYPE_COLOR.other} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} errors`, n]} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '0.73rem', fontFamily: 'var(--font)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Top errors table */}
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8 }}>Top Repeated Errors</p>
                {(errA.top_errors || []).length === 0 ? (
                  <EmptyState iconClass="fa-solid fa-check" message="No patterns found" />
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.77rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['#', 'Error', 'Type', 'Count', 'Status'].map(h => (
                          <th key={h} style={{ padding: '6px 4px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(errA.top_errors || []).map(e => (
                        <tr key={e.rank} style={{ borderBottom: '1px solid #F8FAFC' }}>
                          <td style={{ padding: '7px 4px', color: 'var(--text-muted)' }}>{e.rank}</td>
                          <td style={{ padding: '7px 4px', fontWeight: 700, color: 'var(--text-dark)' }}>{e.error}</td>
                          <td style={{ padding: '7px 4px', fontWeight: 600, color: ETYPE_COLOR[e.type] || ETYPE_COLOR.other, textTransform: 'capitalize' }}>{e.type}</td>
                          <td style={{ padding: '7px 4px', fontWeight: 600 }}>{e.count}</td>
                          <td style={{ padding: '7px 4px' }}>
                            <span className={e.status === 'active' ? 'db-badge db-badge-danger' : 'db-badge db-badge-success'} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                              {e.status === 'active' ? 'Active' : 'Improving'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ═══ SECTION 4: Learning Progress ════════════════ */}
          <SectionCard title="Learning Progress" iconClass="fa-solid fa-graduation-cap" subtitle={`${learn.completed_levels || 0} / 30 levels completed`}>
            {/* Overall */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-dark)' }}>Overall Completion</span>
                <span style={{ color: 'var(--primary)' }}>{learn.stats?.completion_rate || 0}%</span>
              </div>
              <ProgressBar value={learn.completed_levels || 0} max={30} height={10} />
            </div>

            {/* Category breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Beginner (Levels 1-10)',       data: learn.beginner,     color: '#16A34A' },
                { label: 'Intermediate (Levels 11-20)', data: learn.intermediate, color: '#CA8A04' },
                { label: 'Advanced (Levels 21-30)',      data: learn.advanced,     color: '#EF4444' },
              ].map(cat => (
                <div key={cat.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-dark)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
                      {cat.label}
                    </span>
                    <span style={{ color: cat.color }}>{cat.data?.done || 0} / {cat.data?.total || 10}</span>
                  </div>
                  <ProgressBar value={cat.data?.done || 0} max={cat.data?.total || 10} color={cat.color} height={7} />
                </div>
              ))}
            </div>

            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                ['Lessons Done',   learn.stats?.lessons_completed || 0,  'fa-solid fa-book-open'],
                ['Quizzes Passed', learn.stats?.quizzes_passed    || 0,  'fa-solid fa-circle-check'],
                ['Assignments',    learn.stats?.assignments_done  || 0,  'fa-solid fa-file-pen'],
              ].map(([label, val, iconClass]) => (
                <div key={label} style={{ background: 'var(--primary-light)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', color: 'var(--primary)' }}><i className={iconClass} /></div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{val}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Quiz chart */}
            {(learn.quiz_performance || []).length > 0 && (
              <>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 8px' }}>Quiz Scores by Level</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={learn.quiz_performance} layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: 'var(--font)' }} unit="%" />
                    <YAxis type="category" dataKey="level" tick={{ fontSize: 10, fontFamily: 'var(--font)' }} width={28} />
                    <Tooltip formatter={v => [`${v}%`, 'Score']} />
                    <Bar dataKey="score_percentage" fill="var(--primary)" radius={[0, 4, 4, 0]} name="Score %" />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </SectionCard>

          {/* ═══ SECTION 5: Practice Performance ════════════ */}
          <SectionCard title="Practice Performance" iconClass="fa-solid fa-pen-ruler" subtitle="Score trend and task-type breakdown">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Score trend */}
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 8px' }}>Score Trend (last 10)</p>
                {(pract.score_trend || []).length === 0 ? (
                  <EmptyState iconClass="fa-solid fa-pen-to-square" message="No practice yet" sub="Complete a practice task to see your trend." />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={pract.score_trend} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'var(--font)' }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 10, fontFamily: 'var(--font)' }} />
                      <Tooltip formatter={v => [`${v}/10`, 'Score']} />
                      <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* By task type */}
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 8px' }}>By Task Type</p>
                {(pract.by_task_type || []).length === 0 ? (
                  <EmptyState iconClass="fa-solid fa-list" message="No task data yet" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(pract.by_task_type || []).map(t => (
                      <div key={t.type}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.77rem', fontWeight: 600, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-dark)', textTransform: 'capitalize' }}>{t.type}</span>
                          <span style={{ color: '#10B981' }}>{t.avg_score}/10 · {t.count}×</span>
                        </div>
                        <ProgressBar value={t.avg_score} max={10} color="#10B981" height={6} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginTop: '1.25rem' }}>
              {[
                ['Total Done',  pract.stats?.total_done  || 0, '#DBEAFE', 'var(--primary)'],
                ['Best Score',  `${pract.stats?.best_score  || 0}/10`, '#DCFCE7', '#16A34A'],
                ['Avg Score',   `${pract.stats?.avg_score   || 0}/10`, '#FEF9C3', '#CA8A04'],
                ['Worst Score', `${pract.stats?.worst_score || 0}/10`, '#FEE2E2', '#EF4444'],
              ].map(([label, val, bg, col]) => (
                <div key={label} style={{ background: bg, borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: col }}>{val}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ═══ SECTION 6: Time & Activity ═══════════════════ */}
          <SectionCard title="Time & Activity" iconClass="fa-regular fa-clock" subtitle="Study consistency over the last 52 weeks">
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 10px' }}>Activity Heatmap</p>
            <ActivityHeatmap heatmapData={timeAct.heatmap || {}} />

            {/* Last 7 days bar */}
            {(timeAct.daily_bars || []).some(b => b.minutes > 0) && (
              <div style={{ marginTop: '1.25rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 8px' }}>Time by Day (last 7 days)</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={timeAct.daily_bars} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: 'var(--font)' }} />
                    <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font)' }} unit="m" />
                    <Tooltip formatter={v => [`${v} min`, 'Time']} />
                    <Bar dataKey="minutes" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Distribution */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
              {[
                ['Learning', `${timeAct.distribution?.learning || 0}%`, '#DBEAFE'],
                ['Practice', `${timeAct.distribution?.practice || 0}%`, '#DCFCE7'],
                ['Total',    `${timeAct.distribution?.total_minutes || 0} min`, '#F1F5F9'],
              ].map(([label, val, bg]) => (
                <div key={label} style={{ flex: 1, background: bg, borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.1rem' }}>{val}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ═══ SECTION 7: Achievements ══════════════════════ */}
          <SectionCard title="Achievements & Badges" iconClass="fa-solid fa-award" subtitle={`${achieve.total_earned || 0} / ${achieve.total_available || 10} earned`}>
            <BadgeGrid
              allDefs={achieve.all_badge_defs || []}
              earned={achieve.badges_earned || []}
            />

            {/* Next badges */}
            {(achieve.next_badges || []).length > 0 && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 10px' }}>Next Badges to Unlock</p>
                {(achieve.next_badges || []).map(b => (
                  <div key={b.badge_id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: 5 }}>
                      <span style={{ color: 'var(--text-dark)' }}>{b.name}</span>
                      <span style={{ color: '#F59E0B' }}>{b.requirement}</span>
                    </div>
                    <ProgressBar value={0} max={b.credits_needed} color="#F59E0B" height={7} />
                    <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', marginTop: 3 }}>Requires {b.credits_needed} credits</div>
                  </div>
                ))}
              </div>
            )}

            {/* Credits growth */}
            {(achieve.credits_growth || []).length > 0 && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 8px' }}>Credits Growth</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={achieve.credits_growth} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'var(--font)' }} />
                    <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font)' }} />
                    <Tooltip formatter={v => [`${v} credits`, '']} />
                    <Line type="monotone" dataKey="credits" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4, fill: '#F59E0B' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Badge timeline */}
            {(achieve.badges_earned || []).length > 0 && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 10px' }}>Badge Timeline</p>
                <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '1rem' }}>
                  {(achieve.badges_earned || []).map((b, i) => (
                    <div key={i} style={{ position: 'relative', marginBottom: 12 }}>
                      <div style={{ position: 'absolute', left: -20, top: 3, width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                      <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', marginBottom: 1 }}>
                        {b.earned_at ? new Date(b.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)' }}>{stripLeadingSymbols(b.name || b.badge_id)}</div>
                      {b.description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificate */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 12px' }}>Download Your Certificate</p>
              <Certificate cards={{
                level:        cards.level || 1,
                accuracy:     cards.overall_accuracy || cards.accuracy || 0,
                streak:       cards.streak || 0,
                credits:      cards.total_credits || cards.credits || 0,
                badgesEarned: achieve.total_earned || 0,
              }} />
            </div>
          </SectionCard>

          {/* ═══ SECTION 8: Comparison & Insights ═══════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

            {/* Comparison */}
            <SectionCard title="This Week vs Last Week" iconClass="fa-solid fa-scale-balanced">
              {Object.keys(cmp).length === 0 ? (
                <EmptyState iconClass="fa-solid fa-chart-column" message="Not enough data yet" sub="Keep going each week to unlock comparison view." />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.79rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Metric', 'Last', 'This', 'Δ'].map(h => (
                        <th key={h} style={{ padding: '6px 4px', textAlign: h === 'Metric' ? 'left' : 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'accuracy',     label: 'Accuracy',  unit: '%',   lb: false },
                      { key: 'errors',       label: 'Errors',    unit: '',    lb: true  },
                      { key: 'practice_avg', label: 'Practice',  unit: '/10', lb: false },
                      { key: 'time_spent',   label: 'Time',      unit: 'm',   lb: false },
                      { key: 'words',        label: 'Words',     unit: '',    lb: false },
                      { key: 'lessons',      label: 'Lessons',   unit: '',    lb: false },
                    ].map(m => {
                      const d = cmp[m.key];
                      if (!d) return null;
                      const { arrow, color } = dirIcon(d.direction, m.lb);
                      return (
                        <tr key={m.key} style={{ borderBottom: '1px solid #F8FAFC' }}>
                          <td style={{ padding: '7px 4px', fontWeight: 600, color: 'var(--text-dark)' }}>{m.label}</td>
                          <td style={{ padding: '7px 4px', textAlign: 'center', color: 'var(--text-muted)' }}>{d.previous}{m.unit}</td>
                          <td style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, color: 'var(--text-dark)' }}>{d.current}{m.unit}</td>
                          <td style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, color }}>{arrow} {Math.abs(d.diff)}{m.unit}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </SectionCard>

            {/* Insights */}
            <SectionCard title="Insights" iconClass="fa-solid fa-lightbulb" subtitle="Rule-based observations from your data">
              {insights.length === 0 ? (
                <EmptyState iconClass="fa-solid fa-lightbulb" message="No insights yet" sub="Complete more activities to receive personalised suggestions." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {insights.map((ins, i) => {
                    const s = {
                      warning:    { bg: '#FEF2F2', border: '#FCA5A5', iconClass: 'fa-solid fa-triangle-exclamation', text: '#991B1B' },
                      success:    { bg: '#F0FDF4', border: '#86EFAC', iconClass: 'fa-solid fa-circle-check', text: '#14532D' },
                      info:       { bg: '#EFF6FF', border: '#BFDBFE', iconClass: 'fa-solid fa-lightbulb', text: '#1E40AF' },
                      suggestion: { bg: '#FFFBEB', border: '#FDE68A', iconClass: 'fa-solid fa-compass', text: '#92400E' },
                    }[ins.type] || { bg: '#F1F5F9', border: 'var(--border)', iconClass: 'fa-solid fa-thumbtack', text: 'var(--text-dark)' };
                    return (
                      <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderLeft: `4px solid ${s.border}`, borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.83rem', color: s.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className={s.iconClass} />
                          <span>{ins.text}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', marginTop: 3, color: s.text, opacity: 0.8 }}>{ins.detail}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

          </div>

        </div>
      )}
    </div>
  );
}
