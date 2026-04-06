import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getPracticeTask, checkLiveText, submitPractice } from '../services/api';
import { buildHighlightSegments, errorUnderlineStyle } from '../utils/errorHighlight';

/* ─── Constants ─────────────────────────────────────────────── */
const TYPE_ICON_CLASSES = {
  email: 'fa-solid fa-envelope', letter: 'fa-solid fa-file-lines', report: 'fa-solid fa-chart-column',
  conversation: 'fa-solid fa-comments', article: 'fa-solid fa-newspaper', essay: 'fa-solid fa-pen-nib',
};

const getTypeIconClass = (type) => TYPE_ICON_CLASSES[type] || 'fa-solid fa-file-pen';

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/* ─── Render mirror text with error underlines ─────────────────── */
function renderHighlightedText(text, errors, activeTooltip, setActiveTooltip, textareaRef) {
  const segments = buildHighlightSegments(text, errors);

  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i} style={{ cursor: 'text' }}>{seg.text}</span>;
        }
        const color = seg.err.colorName || 'yellow';
        const isSpelling = color === 'red';
        const isActive = activeTooltip === i;
        const isFirstLine = text.lastIndexOf('\n', Math.max(0, (seg.start || 0) - 1)) === -1;
        const tooltipPlacement = isFirstLine
          ? { top: 'calc(100% + 6px)', bottom: 'auto' }
          : { bottom: 'calc(100% + 6px)', top: 'auto' };
        return (
          <span
            key={i}
            className="pe-error-span"
            style={{ position: 'relative', display: 'inline', cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip(i)}
            onMouseLeave={() => setActiveTooltip(null)}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setActiveTooltip(prev => (prev === i ? null : i));
              // Forward click to textarea so user can type at this position
              if (textareaRef?.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(seg.start, seg.start);
              }
            }}
          >
            <span style={{
              ...errorUnderlineStyle(color),
              paddingBottom: '4px',
            }}>
              {seg.text}
            </span>
            {isActive && (
              <span style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1E293B',
                color: '#fff',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                zIndex: 200,
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
                lineHeight: 1.6,
                minWidth: 180,
                ...tooltipPlacement,
              }}>
                <span style={{ fontSize: '0.85rem', display: 'block', marginBottom: 2 }}>
                  <i className={isSpelling ? 'fa-solid fa-circle' : 'fa-solid fa-circle-dot'} style={{ marginRight: 6 }}></i>
                  {isSpelling ? 'Spelling Error' : 'Grammar Issue'}
                </span>
                <span style={{ color: '#94A3B8' }}>
                  {seg.err.hint || 'Check this word'}
                </span>
                {seg.err.suggestion && (
                  <span style={{ display: 'block', color: '#86EFAC', marginTop: 3 }}>
                    Try: {seg.err.suggestion}
                  </span>
                )}
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
    const trimmed = val.trim();
    if (!trimmed || !/[A-Za-z]/.test(trimmed)) {
      setLiveErrors([]);
      setErrorCount({ spelling: 0, grammar: 0 });
      return;
    }
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
    setActiveTooltip(null);
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
  const canSubmit = text.trim().length > 0 && !submitting;

  if (loading) return <LoadingState />;
  if (!task) return <div style={{ padding: '2rem', color: '#94A3B8' }}>Task not found.</div>;

  return (
    <div className="pe-root" style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeInUp 0.4s ease' }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes countUp { from{opacity:0;transform:scale(0.8);}to{opacity:1;transform:scale(1);} }
        @keyframes barFill { from{width:0%}to{width:var(--target-width)} }
        @keyframes popBadge { 0%{opacity:0;transform:scale(0.5)}60%{transform:scale(1.15)}100%{opacity:1;transform:scale(1)} }
        .pe-mode-btn { border:2px solid #E2E8F0; background:#fff; padding:10px 20px; border-radius:12px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:all 0.18s; display:flex;align-items:center;gap:8px; font-family:inherit; color:#64748B; }
        .pe-mode-btn.active-live { border-color:#EF4444; background:#FEF2F2; color:#DC2626; }
        .pe-mode-btn.active-after { border-color:#3B82F6; background:#EFF6FF; color:#2563EB; }
        .pe-textarea { width:100%; box-sizing:border-box; border:none; outline:none; resize:none; font-size:1rem; line-height:1.75; font-family:'Inter',system-ui,sans-serif; background:transparent; color:#1E293B; padding:1.25rem; position:relative; z-index:1; caret-color:#1E293B; }
        .pe-textarea.transparent-text { color:transparent; }
        .pe-mirror { position:absolute; inset:0; padding:1.25rem; font-size:1rem; line-height:1.75; font-family:'Inter',system-ui,sans-serif; color:#1E293B; white-space:pre-wrap; word-wrap:break-word; overflow:hidden; z-index:3; pointer-events:none; }
        .pe-mirror .pe-error-span { pointer-events:all; }
        .pe-submit-btn { padding:12px 28px; border:none; border-radius:12px; font-weight:800; font-size:0.95rem; cursor:pointer; transition:all 0.18s; font-family:inherit; display:flex;align-items:center;gap:8px; }
        .pe-submit-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .err-card { border-radius:12px; padding:1rem 1.25rem; margin-bottom:0.75rem; border-left:4px solid; }
        .badge-pop { animation: popBadge 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', color: '#475569' }}>
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1E293B' }}>
            <i className={getTypeIconClass(task.type)} style={{ marginRight: 8, color: '#2563EB' }}></i>
            Practice: {task.title}
          </h1>
        </div>
        <span style={{ background: '#FEF9C3', color: '#B45309', borderRadius: 999, padding: '4px 12px', fontWeight: 700, fontSize: '0.82rem' }}>
          <i className="fa-solid fa-coins" style={{ marginRight: 6 }}></i>
          Up to {task.credits} pts
        </span>
      </div>

      {/* ── Task prompt ── */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i className="fa-solid fa-clipboard-list"></i>
          Your Task
        </p>
        <p style={{ margin: 0, color: '#374151', fontSize: '0.95rem', lineHeight: 1.6 }}>{task.prompt}</p>
      </div>

      {/* ── Mode toggle ── */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          className={`pe-mode-btn${mode === 'live' ? ' active-live' : ''}`}
          onClick={() => { setMode('live'); setResults(null); }}
        >
          <i className="fa-solid fa-circle"></i>
          Live Suggestions
          <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'inherit', opacity: 0.8 }}>hints as you type</span>
        </button>
        <button
          className={`pe-mode-btn${mode === 'after' ? ' active-after' : ''}`}
          onClick={() => { setMode('after'); setResults(null); setLiveErrors([]); }}
        >
          <i className="fa-solid fa-circle-dot"></i>
          Submit & Analyze
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
          onSubmit={handleSubmit}
          submitting={submitting}
          canSubmit={canSubmit}
        />
      )}

      {/* ── Submit error ── */}
      {submitError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '0.875rem 1rem', color: '#DC2626', fontSize: '0.875rem' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }}></i>
          {submitError}
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
function LiveEditor({ text, onTextChange, onScroll, liveErrors, errorCount, liveChecking, activeTooltip, setActiveTooltip, wordCount, onSubmit, submitting, canSubmit, textareaRef, mirrorRef }) {
  // Show errors in sidebar — include any error that has a word OR a hint
  const liveSuggestions = (liveErrors || []).filter(e => e?.word || e?.hint).slice(0, 5);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1rem', alignItems: 'start' }}>
      {/* Left: editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: 14, overflow: 'visible' }}>
          <div style={{ borderBottom: '1px solid #F1F5F9', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>
              <i className="fa-solid fa-circle" style={{ marginRight: 6, color: '#EF4444' }}></i>
              Live Mode - hints shown as you type
            </span>
            {liveChecking && <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginLeft: 'auto' }}>Checking...</span>}
          </div>
          {/* Mirror + textarea container */}
          <div style={{ position: 'relative', minHeight: 280 }}>
            <div ref={mirrorRef} className="pe-mirror">
              {renderHighlightedText(text, liveErrors, activeTooltip, setActiveTooltip, textareaRef)}
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
          <div style={{ borderTop: '1px solid #F1F5F9', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', position: 'relative', zIndex: 6 }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
              Words: <strong style={{ color: '#1E293B' }}>{wordCount}</strong>
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
              {submitting ? <><i className="fa-solid fa-hourglass-half"></i>Analyzing...</> : 'Submit for Full Analysis →'}
            </button>
          </div>
        </div>
      </div>

      {/* Right: hint panel */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.25rem', position: 'sticky', top: '1rem' }}>
        <p style={{ margin: '0 0 0.75rem', fontWeight: 700, color: '#1E293B', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i className="fa-solid fa-list-check"></i>
          Error Summary
        </p>
        <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}><i className="fa-solid fa-circle" style={{ marginRight: 6, color: '#EF4444' }}></i>Spelling</span>
            <span style={{ fontWeight: 700, color: errorCount.spelling > 0 ? '#EF4444' : '#94A3B8', fontSize: '0.8rem' }}>{errorCount.spelling}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}><i className="fa-solid fa-circle-dot" style={{ marginRight: 6, color: '#EAB308' }}></i>Grammar</span>
            <span style={{ fontWeight: 700, color: errorCount.grammar > 0 ? '#EAB308' : '#94A3B8', fontSize: '0.8rem' }}>{errorCount.grammar}</span>
          </div>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
          Hover over any underlined word to see a hint!
        </p>
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '0.75rem', fontSize: '0.75rem', color: '#64748B', lineHeight: 1.6 }}>
          <i className="fa-regular fa-lightbulb" style={{ marginRight: 6 }}></i><strong>Tip:</strong><br />
          <i className="fa-solid fa-circle" style={{ marginRight: 6, color: '#EF4444' }}></i>RED = Spelling error<br />
          <i className="fa-solid fa-circle-dot" style={{ marginRight: 6, color: '#EAB308' }}></i>YELLOW = Grammar issue
        </div>

        {liveSuggestions.length > 0 ? (
          <div style={{ marginTop: '0.8rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: 700, color: '#1E293B' }}><i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 6 }}></i>AI Suggestions</p>
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
      </div>
    </div>
  );
}

/* ─── After Editor ────────────────────────────────────────────── */
function AfterEditor({ text, onTextChange, wordCount, onSubmit, submitting, canSubmit }) {
  return (
    <div style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ borderBottom: '1px solid #F1F5F9', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>
          <i className="fa-solid fa-circle-dot" style={{ marginRight: 6, color: '#3B82F6' }}></i>
          Submit & Analyze - write freely, full review after submit
        </span>
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
        <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
          <i className="fa-solid fa-file-pen" style={{ marginRight: 6 }}></i>
          Words: {wordCount}
        </span>
        <button
          className="pe-submit-btn"
          onClick={onSubmit}
          disabled={!canSubmit}
          style={{ background: canSubmit ? '#2563EB' : '#94A3B8', color: '#fff' }}
        >
          {submitting ? (
            <><i className="fa-solid fa-hourglass-half"></i>Analyzing your writing...</>
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
        <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <i className="fa-solid fa-chart-column" style={{ marginRight: 6 }}></i>
          Practice Results
        </p>
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
                <i className="fa-solid fa-gift" style={{ marginRight: 5 }}></i>
                +{val} {key.replace(/_/g, ' ')}
              </p>
            ))}
          </div>

          {/* Streak */}
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 14, padding: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fa-solid fa-fire" style={{ fontSize: '1.5rem', color: '#EA580C' }}></i>
            <div>
              <p style={{ margin: 0, fontWeight: 800, color: '#F97316', fontSize: '1.1rem' }}>{streak}-day streak!</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#FB923C' }}>Keep it going!</p>
            </div>
          </div>

          {/* New badges */}
          {badges.length > 0 && (
            <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 14, padding: '1rem' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#7C3AED', fontSize: '0.8rem' }}><i className="fa-solid fa-award" style={{ marginRight: 6 }}></i>New Badges!</p>
              {badges.map((b, i) => (
                <div key={i} className="badge-pop" style={{ animationDelay: `${i * 0.15}s`, background: '#fff', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '1.2rem' }}><i className="fa-solid fa-award" style={{ color: '#7C3AED' }}></i></span>
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
          <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#15803D', fontSize: '0.9rem' }}><i className="fa-solid fa-circle-check" style={{ marginRight: 6 }}></i>What You Did Well</p>
          {results.strengths.map((s, i) => (
            <p key={i} style={{ margin: '0 0 4px', color: '#166534', fontSize: '0.875rem' }}><i className="fa-solid fa-check" style={{ marginRight: 6 }}></i>{s}</p>
          ))}
        </div>
      )}

      {/* ── Errors ── */}
      {errors.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.5rem' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}><i className="fa-solid fa-magnifying-glass" style={{ marginRight: 6 }}></i>Errors Found ({errors.length})</p>
          {errors.map((err, i) => {
            const isSpelling = err.type === 'spelling' || err.color === 'red';
            return (
              <div key={i} className="err-card" style={{
                background: isSpelling ? '#FEF2F2' : '#FEFCE8',
                borderColor: isSpelling ? '#EF4444' : '#EAB308',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: isSpelling ? '#DC2626' : '#CA8A04' }}>
                    Error {i + 1} - {isSpelling ? 'Spelling' : (err.type || 'Grammar').charAt(0).toUpperCase() + (err.type || 'grammar').slice(1)}
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
                    <i className="fa-solid fa-book-open" style={{ marginRight: 6, color: '#2563EB' }}></i>
                    {err.explanation}
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
          <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#C2410C', fontSize: '0.9rem' }}><i className="fa-solid fa-arrow-trend-up" style={{ marginRight: 6 }}></i>Areas to Improve</p>
          {results.areas_to_improve.map((a, i) => (
            <p key={i} style={{ margin: '0 0 4px', color: '#9A3412', fontSize: '0.875rem' }}>• {a}</p>
          ))}
        </div>
      )}

      {/* ── Improved version ── */}
      {results.improved_version && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.5rem' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}><i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 6 }}></i>Improved Version</p>
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
          <i className="fa-solid fa-rotate-right" style={{ marginRight: 6 }}></i>
          Retry Same Task
        </button>
        <button onClick={onNewTask} style={{ background: '#F1F5F9', color: '#1E293B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>
          <i className="fa-solid fa-file-pen" style={{ marginRight: 6 }}></i>
          New Task
        </button>
        <button onClick={onPatterns} style={{ background: '#F1F5F9', color: '#1E293B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>
          <i className="fa-solid fa-chart-line" style={{ marginRight: 6 }}></i>
          View My Patterns
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
