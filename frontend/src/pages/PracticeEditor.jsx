import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getPracticeTask, checkLiveText, submitPractice } from '../services/api';

/* ─── Constants ─────────────────────────────────────────────── */
const TYPE_ICONS = {
  email: '📧', letter: '📄', report: '📊',
  conversation: '💬', article: '📰', essay: '📝',
};

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/* ─── Wavy underline via SVG data-uri ─────────────────────────── */
function wavyBorder(color) {
  const c = color === 'red' ? '%23EF4444' : '%23EAB308';
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3'%3E%3Cpath d='M0 2 Q1.5 0 3 2 Q4.5 4 6 2' fill='none' stroke='${c}' stroke-width='1.2'/%3E%3C/svg%3E") repeat-x bottom left`;
}

/* ─── Render mirror text with error underlines ─────────────────── */
function renderHighlightedText(text, errors, activeTooltip, setActiveTooltip) {
  if (!errors || errors.length === 0) {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>;
  }

  // Normalise each error: if position is missing/wrong, find the word in text
  const normalised = [];
  const usedRanges = []; // [[start, end], ...] already spoken for

  const isOverlap = (s, e) => usedRanges.some(([us, ue]) => s < ue && e > us);

  for (const err of errors) {
    const word = (err.word || err.original || '').trim();
    let start = err.position?.start ?? -1;
    let end   = err.position?.end   ?? -1;

    // Validate: positions must be integers, in-bounds, non-empty, matching the word
    const validRange = (
      Number.isInteger(start) && Number.isInteger(end) &&
      start >= 0 && end > start && end <= text.length &&
      !isOverlap(start, end)
    );

    if (validRange) {
      // Extra sanity: confirm the slice actually looks like the word
      const slice = text.slice(start, end).toLowerCase();
      const clean = word.toLowerCase();
      if (slice !== clean && !slice.includes(clean) && !clean.includes(slice)) {
        // Position mismatch — try to locate by word
        start = -1;
      }
    }

    if (start < 0 || !validRange) {
      // Fallback: find the word in the text
      if (word) {
        let searchFrom = 0;
        let idx = -1;
        while (searchFrom < text.length) {
          idx = text.toLowerCase().indexOf(word.toLowerCase(), searchFrom);
          if (idx < 0) break;
          const candidate = [idx, idx + word.length];
          if (!isOverlap(candidate[0], candidate[1])) {
            start = candidate[0];
            end   = candidate[1];
            break;
          }
          searchFrom = idx + 1;
        }
      }
      if (start < 0) {
        // Can't locate — skip rendering but don't lose the error
        continue;
      }
    }

    usedRanges.push([start, end]);
    normalised.push({ ...err, word: word || text.slice(start, end), position: { start, end } });
  }

  // Sort by start position
  const sorted = normalised.sort((a, b) => a.position.start - b.position.start);

  const segments = [];
  let cursor = 0;

  for (const err of sorted) {
    const { start, end } = err.position;

    if (start > cursor) {
      segments.push({ type: 'text', text: text.slice(cursor, start) });
    } else if (start < cursor) {
      // Overlapping — skip
      continue;
    }

    segments.push({ type: 'error', text: text.slice(start, end), err, start });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', text: text.slice(cursor) });
  }

  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.text}</span>;
        }
        const isSpelling = seg.err.type === 'spelling';
        const color = seg.err.color || (isSpelling ? 'red' : 'yellow');
        const isActive = activeTooltip === i;
        return (
          <span
            key={i}
            style={{ position: 'relative', display: 'inline' }}
            onMouseEnter={() => setActiveTooltip(i)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <span style={{
              backgroundImage: wavyBorder(color),
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'bottom left',
              backgroundSize: '6px 3px',
              paddingBottom: '3px',
              cursor: 'help',
            }}>
              {seg.text}
            </span>
            {isActive && (
              <span style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: 6,
                background: '#1E293B',
                color: '#fff',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                zIndex: 100,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                pointerEvents: 'none',
                lineHeight: 1.5,
              }}>
                <span style={{ fontSize: '0.85rem' }}>{isSpelling ? '🔴 Spelling Error' : '🟡 Grammar Issue'}</span>
                <br />
                <span style={{ color: '#94A3B8' }}>Hint: {seg.err.hint || 'Check this word'}</span>
                {seg.err.suggestion ? (
                  <>
                    <br />
                    <span style={{ color: '#86EFAC' }}>Try: {seg.err.suggestion}</span>
                  </>
                ) : null}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function PracticeEditor({ taskId, onBack, onNavigate }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('live'); // 'live' | 'after'

  const [text, setText] = useState('');
  const [liveErrors, setLiveErrors] = useState([]);
  const [errorCount, setErrorCount] = useState({ spelling: 0, grammar: 0 });
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [liveChecking, setLiveChecking] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const textareaRef = useRef(null);
  const mirrorRef = useRef(null);
  const debounceRef = useRef(null);

  // Load task
  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    getPracticeTask(taskId)
      .then(t => setTask(t))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId]);

  // Sync mirror scroll
  const syncScroll = () => {
    if (textareaRef.current && mirrorRef.current) {
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Live check debounced
  const runLiveCheck = useCallback((val) => {
    if (mode !== 'live' || !task) return;
    if (val.length < 20) { setLiveErrors([]); setErrorCount({ spelling: 0, grammar: 0 }); return; }
    setLiveChecking(true);
    checkLiveText(val, task.type || 'general')
      .then(res => {
        setLiveErrors(res.errors || []);
        setErrorCount(res.error_count || { spelling: 0, grammar: 0 });
      })
      .catch(() => {})
      .finally(() => setLiveChecking(false));
  }, [mode, task]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (mode === 'live') {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runLiveCheck(val), 800);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!task || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await submitPractice({
        task_id: task.task_id,
        text,
        mode: mode === 'live' ? 'live' : 'after_analysis',
        attempt_number: (task.history?.length || 0) + 1,
      });
      setResults(res);
      // Scroll to results
      setTimeout(() => {
        document.getElementById('pw-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = countWords(text);
  const minWords = task?.min_words || 20;
  const canSubmit = wordCount >= minWords && !submitting;

  if (loading) return <LoadingState />;
  if (!task) return <div style={{ padding: '2rem', color: '#94A3B8' }}>Task not found.</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeInUp 0.4s ease' }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes countUp { from{opacity:0;transform:scale(0.8);}to{opacity:1;transform:scale(1);} }
        @keyframes barFill { from{width:0%}to{width:var(--target-width)} }
        @keyframes popBadge { 0%{opacity:0;transform:scale(0.5)}60%{transform:scale(1.15)}100%{opacity:1;transform:scale(1)} }
        .pe-mode-btn { border:2px solid #E2E8F0; background:#fff; padding:10px 20px; border-radius:12px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:all 0.18s; display:flex;align-items:center;gap:8px; font-family:inherit; color:#64748B; }
        .pe-mode-btn.active-live { border-color:#EF4444; background:#FEF2F2; color:#DC2626; }
        .pe-mode-btn.active-after { border-color:#3B82F6; background:#EFF6FF; color:#2563EB; }
        .pe-textarea { width:100%; box-sizing:border-box; border:none; outline:none; resize:none; font-size:1rem; line-height:1.75; font-family:'Inter',system-ui,sans-serif; background:transparent; color:#1E293B; padding:1.25rem; position:relative; z-index:2; caret-color:#1E293B; }
        .pe-textarea.transparent-text { color:transparent; }
        .pe-mirror { position:absolute; inset:0; padding:1.25rem; font-size:1rem; line-height:1.75; font-family:'Inter',system-ui,sans-serif; color:#1E293B; pointer-events:none; white-space:pre-wrap; word-wrap:break-word; overflow:hidden; z-index:1; }
        .pe-submit-btn { padding:12px 28px; border:none; border-radius:12px; font-weight:800; font-size:0.95rem; cursor:pointer; transition:all 0.18s; font-family:inherit; display:flex;align-items:center;gap:8px; }
        .pe-submit-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .err-card { border-radius:12px; padding:1rem 1.25rem; margin-bottom:0.75rem; border-left:4px solid; }
        .badge-pop { animation: popBadge 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', color: '#475569' }}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1E293B' }}>
            {TYPE_ICONS[task.type] || '📝'} Practice: {task.title}
          </h1>
        </div>
        <span style={{ background: '#FEF9C3', color: '#B45309', borderRadius: 999, padding: '4px 12px', fontWeight: 700, fontSize: '0.82rem' }}>
          ⭐ Up to {task.credits} pts
        </span>
      </div>

      {/* ── Task prompt ── */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📋 Your Task</p>
        <p style={{ margin: 0, color: '#374151', fontSize: '0.95rem', lineHeight: 1.6 }}>{task.prompt}</p>
      </div>

      {/* ── Mode toggle ── */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          className={`pe-mode-btn${mode === 'live' ? ' active-live' : ''}`}
          onClick={() => { setMode('live'); setResults(null); }}
        >
          🔴 Live Suggestions
          <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'inherit', opacity: 0.8 }}>hints as you type</span>
        </button>
        <button
          className={`pe-mode-btn${mode === 'after' ? ' active-after' : ''}`}
          onClick={() => { setMode('after'); setResults(null); setLiveErrors([]); }}
        >
          🔵 Submit & Analyze
          <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'inherit', opacity: 0.8 }}>full review after</span>
        </button>
      </div>

      {/* ── Editor area ── */}
      {mode === 'live' ? (
        <LiveEditor
          text={text}
          onTextChange={handleTextChange}
          onScroll={syncScroll}
          liveErrors={liveErrors}
          errorCount={errorCount}
          liveChecking={liveChecking}
          activeTooltip={activeTooltip}
          setActiveTooltip={setActiveTooltip}
          wordCount={wordCount}
          minWords={minWords}
          onSubmit={handleSubmit}
          submitting={submitting}
          canSubmit={canSubmit}
          textareaRef={textareaRef}
          mirrorRef={mirrorRef}
        />
      ) : (
        <AfterEditor
          text={text}
          onTextChange={handleTextChange}
          wordCount={wordCount}
          minWords={minWords}
          onSubmit={handleSubmit}
          submitting={submitting}
          canSubmit={canSubmit}
        />
      )}

      {/* ── Submit error ── */}
      {submitError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '0.875rem 1rem', color: '#DC2626', fontSize: '0.875rem' }}>
          ⚠️ {submitError}
        </div>
      )}

      {/* ── Results ── */}
      {results && (
        <ResultsView
          results={results}
          task={task}
          originalText={text}
          onRetry={() => { setResults(null); setText(''); setLiveErrors([]); }}
          onNewTask={() => onBack()}
          onPatterns={() => onNavigate('analytics')}
        />
      )}
    </div>
  );
}

/* ─── Live Editor ─────────────────────────────────────────────── */
function LiveEditor({ text, onTextChange, onScroll, liveErrors, errorCount, liveChecking, activeTooltip, setActiveTooltip, wordCount, minWords, onSubmit, submitting, canSubmit, textareaRef, mirrorRef }) {
  // Show errors in sidebar — include any error that has a word OR a hint
  const liveSuggestions = (liveErrors || []).filter(e => e?.word || e?.hint).slice(0, 5);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1rem', alignItems: 'start' }}>
      {/* Left: editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid #F1F5F9', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>🔴 Live Mode — hints shown as you type</span>
            {liveChecking && <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginLeft: 'auto' }}>Checking...</span>}
          </div>
          {/* Mirror + textarea container */}
          <div style={{ position: 'relative', minHeight: 280 }}>
            <div ref={mirrorRef} className="pe-mirror" aria-hidden="true">
              {renderHighlightedText(text, liveErrors, activeTooltip, setActiveTooltip)}
              {/* Ghost char to keep height */}
              <span style={{ visibility: 'hidden' }}>.</span>
            </div>
            <textarea
              ref={textareaRef}
              className={`pe-textarea transparent-text`}
              value={text}
              onChange={onTextChange}
              onScroll={onScroll}
              placeholder="Start writing here... Hints will appear as you type!"
              rows={12}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
          {/* Footer bar */}
          <div style={{ borderTop: '1px solid #F1F5F9', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
              Words: <strong style={{ color: wordCount >= minWords ? '#16A34A' : '#1E293B' }}>{wordCount}</strong>
              {wordCount < minWords && <> / {minWords} min</>}
              {wordCount >= minWords && <> ✅</>}
              {' '}·{' '}
              Errors: <strong style={{ color: (errorCount.spelling + errorCount.grammar) > 0 ? '#EF4444' : '#16A34A' }}>
                {errorCount.spelling + errorCount.grammar}
              </strong>
            </span>
            <button
              className="pe-submit-btn"
              onClick={onSubmit}
              disabled={!canSubmit}
              style={{ background: canSubmit ? '#2563EB' : '#94A3B8', color: '#fff', padding: '8px 20px', fontSize: '0.85rem' }}
            >
              {submitting ? '⏳ Analyzing...' : 'Submit for Full Analysis →'}
            </button>
          </div>
        </div>
      </div>

      {/* Right: hint panel */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.25rem', position: 'sticky', top: '1rem' }}>
        <p style={{ margin: '0 0 0.75rem', fontWeight: 700, color: '#1E293B', fontSize: '0.875rem' }}>📋 Error Summary</p>
        <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>🔴 Spelling</span>
            <span style={{ fontWeight: 700, color: errorCount.spelling > 0 ? '#EF4444' : '#94A3B8', fontSize: '0.8rem' }}>{errorCount.spelling}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>🟡 Grammar</span>
            <span style={{ fontWeight: 700, color: errorCount.grammar > 0 ? '#EAB308' : '#94A3B8', fontSize: '0.8rem' }}>{errorCount.grammar}</span>
          </div>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
          Hover over any underlined word to see a hint!
        </p>
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '0.75rem', fontSize: '0.75rem', color: '#64748B', lineHeight: 1.6 }}>
          💡 <strong>Tip:</strong><br />
          🔴 RED = Spelling error<br />
          🟡 YELLOW = Grammar issue
        </div>

        {liveSuggestions.length > 0 ? (
          <div style={{ marginTop: '0.8rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: 700, color: '#1E293B' }}>🤖 AI Suggestions</p>
            {liveSuggestions.map((err, idx) => (
              <div key={`${err.word}-${idx}`} style={{ marginBottom: '0.45rem', fontSize: '0.75rem', lineHeight: 1.45 }}>
                <span style={{ color: err.color === 'red' ? '#DC2626' : '#CA8A04', fontWeight: 700 }}>{err.word}</span>
                {err.suggestion ? (
                  <>
                    {' '}→{' '}
                    <span style={{ color: '#15803D', fontWeight: 700 }}>{err.suggestion}</span>
                  </>
                ) : null}
                <div style={{ color: '#64748B' }}>{err.hint || 'Possible issue detected'}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.72rem', fontWeight: 600, color: '#94A3B8' }}>MIN WORDS</p>
          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, background: wordCount >= minWords ? '#16A34A' : '#2563EB', width: `${Math.min(100, (wordCount / minWords) * 100)}%`, transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#94A3B8' }}>{wordCount} / {minWords} words</p>
        </div>
      </div>
    </div>
  );
}

/* ─── After Editor ────────────────────────────────────────────── */
function AfterEditor({ text, onTextChange, wordCount, minWords, onSubmit, submitting, canSubmit }) {
  return (
    <div style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ borderBottom: '1px solid #F1F5F9', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>🔵 Submit & Analyze — write freely, full review after submit</span>
      </div>
      <textarea
        className="pe-textarea"
        value={text}
        onChange={onTextChange}
        placeholder="Write your response here. No hints — just write naturally!"
        rows={14}
        spellCheck={false}
        style={{ display: 'block', minHeight: 280 }}
      />
      <div style={{ borderTop: '1px solid #F1F5F9', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
        <span style={{ fontSize: '0.78rem', color: wordCount >= minWords ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>
          {wordCount >= minWords ? '✅' : '📝'} Words: {wordCount} / {minWords} minimum
        </span>
        <button
          className="pe-submit-btn"
          onClick={onSubmit}
          disabled={!canSubmit}
          style={{ background: canSubmit ? '#2563EB' : '#94A3B8', color: '#fff' }}
        >
          {submitting ? (
            <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Analyzing your writing...</>
          ) : 'Submit & Analyze →'}
        </button>
      </div>
    </div>
  );
}

/* ─── Results View ────────────────────────────────────────────── */
function ResultsView({ results, task, originalText, onRetry, onNewTask, onPatterns }) {
  const score = results.overall_score || 0;
  const cats = results.category_scores || {};
  const errors = results.errors || [];
  const credits = results.credits_earned || 0;
  const breakdown = results.credits_breakdown || {};
  const badges = results.badges_earned || [];
  const streak = results.current_streak || 0;

  const scoreColor = score >= 8 ? '#16A34A' : score >= 6 ? '#D97706' : '#DC2626';
  const scoreBg = score >= 8 ? '#F0FDF4' : score >= 6 ? '#FFFBEB' : '#FEF2F2';

  return (
    <div id="pw-results" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeInUp 0.5s ease' }}>
      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg,#1E293B,#334155)', borderRadius: 16, padding: '1.5rem', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>📊 Practice Results</p>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{task.title}</h2>
      </div>

      {/* ── Score card + gamification grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Score card */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.5rem' }}>
          <p style={{ margin: '0 0 0.75rem', fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}>Overall Score</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: scoreBg, border: `3px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: scoreColor }}>{score}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 10, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: scoreColor, width: `${score * 10}%`, transition: 'width 1s ease' }} />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>{score * 10}%</p>
            </div>
          </div>
          {/* Category bars */}
          {Object.entries(cats).map(([key, val]) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B' }}>{val}/10</span>
              </div>
              <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: val >= 7 ? '#16A34A' : val >= 5 ? '#EAB308' : '#EF4444', width: `${val * 10}%`, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Gamification panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Credits */}
          <div style={{ background: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', border: '1px solid #FDE68A', borderRadius: 14, padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.72rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>Credits Earned</p>
            <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#D97706', animation: 'countUp 0.5s ease forwards' }}>+{credits}</p>
            {Object.entries(breakdown).filter(([k, v]) => k !== 'base' && k !== 'total' && v > 0).map(([key, val]) => (
              <p key={key} style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#92400E' }}>
                +{val} {key.replace(/_/g, ' ')} 🎁
              </p>
            ))}
          </div>

          {/* Streak */}
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 14, padding: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.75rem' }}>🔥</span>
            <div>
              <p style={{ margin: 0, fontWeight: 800, color: '#F97316', fontSize: '1.1rem' }}>{streak}-day streak!</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#FB923C' }}>Keep it going!</p>
            </div>
          </div>

          {/* New badges */}
          {badges.length > 0 && (
            <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 14, padding: '1rem' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#7C3AED', fontSize: '0.8rem' }}>🏅 New Badges!</p>
              {badges.map((b, i) => (
                <div key={i} className="badge-pop" style={{ animationDelay: `${i * 0.15}s`, background: '#fff', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '1.2rem' }}>🏅</span>
                  <span style={{ fontWeight: 700, color: '#5B21B6', fontSize: '0.82rem' }}>{b.badge_name || b.badge_id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Strengths ── */}
      {results.strengths?.length > 0 && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '1.25rem' }}>
          <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#15803D', fontSize: '0.9rem' }}>✅ What You Did Well</p>
          {results.strengths.map((s, i) => (
            <p key={i} style={{ margin: '0 0 4px', color: '#166534', fontSize: '0.875rem' }}>✓ {s}</p>
          ))}
        </div>
      )}

      {/* ── Errors ── */}
      {errors.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.5rem' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}>🔍 Errors Found ({errors.length})</p>
          {errors.map((err, i) => {
            const isSpelling = err.type === 'spelling' || err.color === 'red';
            return (
              <div key={i} className="err-card" style={{
                background: isSpelling ? '#FEF2F2' : '#FEFCE8',
                borderColor: isSpelling ? '#EF4444' : '#EAB308',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: isSpelling ? '#DC2626' : '#CA8A04' }}>
                    Error {i + 1} — {isSpelling ? '🔴 Spelling' : '🟡 ' + (err.type || 'Grammar').charAt(0).toUpperCase() + (err.type || 'grammar').slice(1)}
                  </span>
                  {err.severity && (
                    <span style={{ fontSize: '0.68rem', background: err.severity === 'major' ? '#FEE2E2' : '#F1F5F9', color: err.severity === 'major' ? '#DC2626' : '#64748B', borderRadius: 6, padding: '2px 6px', fontWeight: 600 }}>
                      {err.severity}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: 6, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>YOU WROTE</p>
                    <p style={{ margin: 0, fontWeight: 700, color: '#DC2626', fontFamily: 'monospace', fontSize: '0.95rem', textDecoration: 'line-through' }}> {err.original}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#94A3B8' }}>→</div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>CORRECT</p>
                    <p style={{ margin: 0, fontWeight: 700, color: '#16A34A', fontFamily: 'monospace', fontSize: '0.95rem' }}>{err.correction}</p>
                  </div>
                </div>
                {err.explanation && (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151', lineHeight: 1.6, background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                    📖 {err.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Areas to improve ── */}
      {results.areas_to_improve?.length > 0 && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 14, padding: '1.25rem' }}>
          <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#C2410C', fontSize: '0.9rem' }}>📈 Areas to Improve</p>
          {results.areas_to_improve.map((a, i) => (
            <p key={i} style={{ margin: '0 0 4px', color: '#9A3412', fontSize: '0.875rem' }}>• {a}</p>
          ))}
        </div>
      )}

      {/* ── Improved version ── */}
      {results.improved_version && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.5rem' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}>✨ Improved Version</p>
          <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '1rem 1.25rem', borderLeft: '4px solid #16A34A' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.75, color: '#1E293B', whiteSpace: 'pre-wrap' }}>
              <ImprovedTextDiff original={originalText} improved={results.improved_version} />
            </p>
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '0.5rem 0 1.5rem' }}>
        <button onClick={onRetry} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>
          🔄 Retry Same Task
        </button>
        <button onClick={onNewTask} style={{ background: '#F1F5F9', color: '#1E293B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>
          📝 New Task
        </button>
        <button onClick={onPatterns} style={{ background: '#F1F5F9', color: '#1E293B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>
          📊 View My Patterns
        </button>
      </div>
    </div>
  );
}

/* ─── Simple word-level diff for improved version ─────────────── */
function ImprovedTextDiff({ original, improved }) {
  const origWords = original.trim().split(/(\s+)/);
  const impWords = improved.trim().split(/(\s+)/);
  const origSet = new Set(origWords.map(w => w.toLowerCase().trim()).filter(Boolean));

  return (
    <>
      {impWords.map((word, i) => {
        if (/\s+/.test(word)) return <React.Fragment key={i}>{word}</React.Fragment>;
        const clean = word.toLowerCase().replace(/[.,!?;:"']/g, '');
        const isNew = !origSet.has(clean) && clean.length > 0;
        return isNew ? (
          <mark key={i} style={{ background: '#BBF7D0', color: '#15803D', borderRadius: 3, padding: '0 2px' }}>{word}</mark>
        ) : (
          <React.Fragment key={i}>{word}</React.Fragment>
        );
      })}
    </>
  );
}

function LoadingState() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[240, 80, 60, 360].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 16, background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      ))}
    </div>
  );
}
