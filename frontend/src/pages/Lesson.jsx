import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, BookOpen, Brain, PenLine, Check, X, Lock,
  CheckCircle, Loader2, RefreshCw, Trophy, Lightbulb, AlertCircle
} from 'lucide-react';
import { getLesson, markLessonRead, submitQuiz, submitAssignment } from '../services/dataService';

const WW = '#5B5FDE';
const WW_LIGHT = '#EEF0FF';

/* ─── Progress Stepper ─── */
function ProgressStepper({ step, completed }) {
  const steps = [
    { label: 'Lesson', icon: BookOpen },
    { label: 'Quiz', icon: Brain },
    { label: 'Assignment', icon: PenLine },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
      {steps.map((s, i) => {
        const done = completed.includes(i);
        const active = step === i;
        const Icon = s.icon;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: done ? '#16A34A' : active ? WW : '#E5E7EB',
                color: done || active ? '#fff' : '#9CA3AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? `0 0 0 5px ${WW_LIGHT}` : 'none',
                transition: 'all 0.3s',
              }}>
                {done ? <Check style={{ width: 16, height: 16 }} /> : <Icon style={{ width: 16, height: 16 }} />}
              </div>
              <span style={{ fontSize: '0.72rem', marginTop: 4, fontWeight: active ? 800 : 600, color: done ? '#16A34A' : active ? WW : '#9CA3AF' }}>{s.label}</span>
            </div>
            {i < 2 && <div style={{ width: 60, height: 2, background: done ? '#16A34A' : '#E5E7EB', marginBottom: 20, marginLeft: 4, marginRight: 4, transition: 'background 0.4s' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const CreditBadge = ({ amount }) => (
  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    <i className="fa-solid fa-coins"></i>
    +{amount}
  </span>
);

/* ─── Section Renderer — handles all section types from the real JSON ─── */
function SectionBlock({ sec }) {
  // Type 1: has body + comparison
  if (sec.body) {
    return (
      <div style={{ marginBottom: 20, background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>{sec.heading}</h3>
        <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.7, marginBottom: sec.comparison ? 12 : 0 }}>{sec.body}</p>
        {sec.comparison && (
          <div style={{ background: '#F8F7FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '0.875rem 1rem' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <X style={{ width: 14, height: 14, color: '#EF4444', flexShrink: 0 }} />
                <s style={{ color: '#EF4444', fontSize: '0.875rem' }}>{sec.comparison.wrong}</s>
              </div>
              <span style={{ color: '#9CA3AF', fontSize: '1.2rem' }}>→</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check style={{ width: 14, height: 14, color: '#16A34A', flexShrink: 0 }} />
                <span style={{ color: '#16A34A', fontWeight: 700, fontSize: '0.875rem' }}>{sec.comparison.right}</span>
              </div>
            </div>
          </div>
        )}
        {sec.key_point && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '8px 12px' }}>
            <Lightbulb style={{ width: 14, height: 14, color: '#D97706', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.82rem', color: '#92400E', fontWeight: 600, margin: 0 }}>{sec.key_point}</p>
          </div>
        )}
      </div>
    );
  }

  // Type 2: sub_rules (e.g. I before E rule with parts)
  if (sec.sub_rules) {
    return (
      <div style={{ marginBottom: 20, background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>{sec.heading}</h3>
        {sec.rule && <div style={{ background: WW_LIGHT, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: '0.875rem', fontWeight: 600, color: WW }}>{sec.rule}</div>}
        {sec.sub_rules.map((sr, i) => (
          <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < sec.sub_rules.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>{sr.title}</p>
            <p style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: 8 }}>{sr.explanation}</p>
            {sr.words && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {sr.words.slice(0, 6).map((w, j) => (
                  <span key={j} style={{ background: '#F3F4F6', borderRadius: 6, padding: '3px 10px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }} title={w.meaning || ''}>{w.word}</span>
                ))}
              </div>
            )}
            {sr.examples?.length > 0 && (
              <div style={{ background: '#F8F7FF', borderRadius: 8, padding: '8px 12px' }}>
                {sr.examples.slice(0, 2).map((ex, j) => (
                  <p key={j} style={{ fontSize: '0.8rem', color: '#374151', fontStyle: 'italic', margin: j > 0 ? '4px 0 0' : 0 }}>"{ex}"</p>
                ))}
              </div>
            )}
          </div>
        ))}
        {sec.memory_trick && (
          <div style={{ display: 'flex', gap: 8, background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '8px 12px' }}>
            <Lightbulb style={{ width: 14, height: 14, color: '#D97706', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.8rem', color: '#92400E', fontStyle: 'italic', margin: 0 }}>{sec.memory_trick}</p>
          </div>
        )}
      </div>
    );
  }

  // Type 3: groups (e.g. Silent Letters with K/W/B/G groups)
  if (sec.groups) {
    return (
      <div style={{ marginBottom: 20, background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>{sec.heading}</h3>
        {sec.explanation && <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: 12, lineHeight: 1.6 }}>{sec.explanation}</p>}
        {sec.groups.map((g, i) => (
          <div key={i} style={{ marginBottom: 14, background: '#F8F7FF', border: '1px solid #E0E7FF', borderRadius: 10, padding: '0.875rem 1rem' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: WW, marginBottom: 6 }}>{g.type}</p>
            {g.note && <p style={{ fontSize: '0.78rem', color: '#6B7280', marginBottom: 6 }}>{g.note}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
              {g.words?.slice(0, 6).map((w, j) => (
                <span key={j} style={{ background: '#fff', border: '1px solid #C7D2FE', borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }} title={w.pronunciation || w.meaning || ''}>{w.word}</span>
              ))}
            </div>
            {g.examples?.slice(0, 1).map((ex, j) => (
              <p key={j} style={{ fontSize: '0.78rem', color: '#374151', fontStyle: 'italic', margin: 0 }}>"{ex}"</p>
            ))}
            {g.memory_trick && (
              <p style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 600, marginTop: 4, margin: '4px 0 0', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Lightbulb style={{ width: 13, height: 13 }} /> {g.memory_trick}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Type 4: examples_double / drop_e_rule (doubling rule, drop-E rule)
  if (sec.examples_double || sec.drop_e_rule) {
    return (
      <div style={{ marginBottom: 20, background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>{sec.heading}</h3>
        {sec.explanation && <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: 10, lineHeight: 1.6 }}>{sec.explanation}</p>}
        {sec.rule_name && <div style={{ background: WW_LIGHT, borderRadius: 8, padding: '6px 12px', marginBottom: 10, fontSize: '0.85rem', fontWeight: 700, color: WW, display: 'inline-flex', alignItems: 'center', gap: 6 }}><i className="fa-solid fa-thumbtack"></i>{sec.rule_name}: {sec.rule_description}</div>}
        {sec.examples_double && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {sec.examples_double.map((ex, i) => (
              <div key={i} style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '4px 12px', fontSize: '0.8rem' }}>
                <span style={{ color: '#374151' }}>{ex.base}</span>
                <span style={{ color: '#9CA3AF', margin: '0 4px' }}>→</span>
                <span style={{ color: '#16A34A', fontWeight: 700 }}>{ex.with_ing || ex.with_ed || ex.with_er}</span>
              </div>
            ))}
          </div>
        )}
        {sec.drop_e_rule?.examples && (
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>{sec.drop_e_rule.when}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sec.drop_e_rule.examples.map((ex, i) => (
                <div key={i} style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '4px 12px', fontSize: '0.8rem' }}>
                  <s style={{ color: '#EF4444' }}>{ex.wrong}</s>
                  <span style={{ color: '#9CA3AF', margin: '0 4px' }}>→</span>
                  <span style={{ color: '#16A34A', fontWeight: 700 }}>{ex.correct}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {sec.memory_trick && (
          <div style={{ display: 'flex', gap: 8, background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '8px 12px', marginTop: 10 }}>
            <Lightbulb style={{ width: 14, height: 14, color: '#D97706', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.8rem', color: '#92400E', fontStyle: 'italic', margin: 0 }}>{sec.memory_trick}</p>
          </div>
        )}
      </div>
    );
  }

  // Fallback: just show heading + any text fields
  return (
    <div style={{ marginBottom: 20, background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>{sec.heading}</h3>
      {Object.entries(sec).filter(([k]) => !['id','heading'].includes(k)).map(([k, v]) => (
        typeof v === 'string' ? <p key={k} style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7 }}>{v}</p> : null
      ))}
    </div>
  );
}

/* ─── Lesson Section ─── */
function LessonSection({ lesson, progress, levelId, onComplete, loading }) {
  const alreadyRead = progress?.lesson_read;
  const sections = lesson?.sections || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen style={{ width: 20, height: 20, color: WW }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1F2937', margin: 0 }}>Lesson Content</h2>
        </div>
        <CreditBadge amount={10} />
      </div>

      {sections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
          <AlertCircle style={{ width: 28, height: 28, margin: '0 auto 8px', color: '#D1D5DB' }} />
          <p style={{ fontSize: '0.875rem' }}>No lesson content found.</p>
        </div>
      ) : (
        sections.map((sec, i) => <SectionBlock key={sec.id || i} sec={sec} />)
      )}

      <button
        style={{ width: '100%', padding: '13px', marginTop: 8, background: alreadyRead ? '#16A34A' : WW, color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700, cursor: alreadyRead || loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', transition: 'background 0.2s' }}
        disabled={loading}
        onClick={alreadyRead ? undefined : onComplete}
      >
        {alreadyRead
          ? <><CheckCircle style={{ width: 17, height: 17 }} /> Already Read - Go to Quiz →</>
          : loading
            ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 0.7s linear infinite' }} /> Saving...</>
            : <><i className="fa-solid fa-coins"></i> I've read this - Go to Quiz → (+10)</>}
      </button>
    </div>
  );
}

/* ─── Quiz Section ─── */
function QuizSection({ questions, progress, levelId, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const alreadyDone = progress?.quiz_completed;
  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  const handleSubmit = async () => {
    setSubmitting(true);
    const formatted = Object.entries(answers).map(([qId, selected]) => ({ question_id: qId, selected }));
    const res = await submitQuiz(levelId, formatted).catch(() => null);
    setResult(res);
    setSubmitting(false);
    if (res?.passed) setTimeout(() => onComplete(res), 900);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain style={{ width: 20, height: 20, color: WW }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1F2937', margin: 0 }}>Quiz - {questions.length} Questions</h2>
        </div>
        <CreditBadge amount={15} />
      </div>

      {alreadyDone && !result && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <CheckCircle style={{ width: 15, height: 15, color: '#16A34A', flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', color: '#15803D', fontWeight: 600 }}>Quiz already completed! Retry anytime (credits already awarded).</span>
        </div>
      )}

      {questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
          <p style={{ fontSize: '0.875rem' }}>No quiz questions found for this level.</p>
        </div>
      ) : questions.map((q, qi) => {
        const selected = answers[q.id];
        const fb = result?.results?.find((r) => r.question_id === q.id);
        return (
          <div key={q.id} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '1.1rem 1.25rem', marginBottom: 12 }}>
            <p style={{ fontSize: '0.72rem', color: WW, fontWeight: 700, marginBottom: 6 }}>Q{qi + 1} / {questions.length}</p>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1F2937', marginBottom: 12, lineHeight: 1.5 }}>{q.question}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {q.options.map((opt, idx) => {
                const isSel = selected === idx;
                const showResult = !!result;
                const isCorrect = showResult && idx === q.correct;
                const isWrong = showResult && isSel && idx !== q.correct;
                return (
                  <button key={idx} type="button" disabled={!!result}
                    onClick={() => setAnswers((p) => ({ ...p, [q.id]: idx }))}
                    style={{ textAlign: 'left', padding: '9px 14px', borderRadius: 9, border: `2px solid ${isCorrect ? '#86EFAC' : isWrong ? '#FCA5A5' : isSel ? WW : '#E5E7EB'}`, background: isCorrect ? '#F0FDF4' : isWrong ? '#FFF1F2' : isSel ? WW_LIGHT : '#fff', color: isCorrect ? '#15803D' : isWrong ? '#DC2626' : isSel ? WW : '#374151', fontWeight: isSel || isCorrect ? 600 : 400, cursor: result ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.865rem', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: isCorrect ? '#16A34A' : isWrong ? '#EF4444' : isSel ? WW : '#F3F4F6', color: isCorrect || isWrong || isSel ? '#fff' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                      {isCorrect ? <Check style={{ width: 11, height: 11 }} /> : isWrong ? <X style={{ width: 11, height: 11 }} /> : String.fromCharCode(65 + idx)}
                    </div>
                    {opt}
                  </button>
                );
              })}
            </div>
            {result && fb?.explanation && (
              <div style={{ marginTop: 8, padding: '7px 12px', background: '#F8F7FF', borderRadius: 7, fontSize: '0.78rem', color: '#374151', fontStyle: 'italic' }}>
                <Lightbulb style={{ width: 12, height: 12, marginRight: 5, verticalAlign: 'text-bottom' }} />
                {fb.explanation}
              </div>
            )}
          </div>
        );
      })}

      {result ? (
        <div style={{ marginTop: 4 }}>
          <div style={{ background: result.passed ? '#F0FDF4' : '#FFF1F2', border: `1.5px solid ${result.passed ? '#86EFAC' : '#FCA5A5'}`, borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ fontWeight: 800, color: result.passed ? '#15803D' : '#DC2626', fontSize: '1rem', marginBottom: 2 }}>
                <i className={result.passed ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'} style={{ marginRight: 6 }}></i>
                {result.passed ? 'Passed!' : 'Not quite!'}
              </p>
              <p style={{ fontSize: '0.82rem', color: '#6B7280' }}>Score: {result.score}/{result.total} ({result.percentage}%)</p>
            </div>
            {result.credits_earned > 0 && <span style={{ fontSize: '1rem', fontWeight: 800, color: '#D97706' }}><i className="fa-solid fa-coins" style={{ marginRight: 5 }}></i>+{result.credits_earned}</span>}
          </div>
          {!result.passed && (
            <button onClick={() => { setAnswers({}); setResult(null); }}
              style={{ width: '100%', padding: '11px', background: '#fff', color: WW, border: `2px solid ${WW}`, borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', fontSize: '0.875rem' }}>
              <RefreshCw style={{ width: 14, height: 14 }} /> Retry Quiz
            </button>
          )}
        </div>
      ) : (
        <button onClick={handleSubmit} disabled={!allAnswered || submitting}
          style={{ width: '100%', padding: '13px', background: allAnswered ? WW : '#E5E7EB', color: allAnswered ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700, cursor: allAnswered && !submitting ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', transition: 'all 0.2s', marginTop: 4 }}>
          {submitting ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 0.7s linear infinite' }} /> Submitting...</> : allAnswered ? 'Submit Quiz →' : `Answer all ${questions.length} questions to submit`}
        </button>
      )}
    </div>
  );
}

/* ─── Assignment Section ─── */
function AssignmentSection({ lesson, progress, levelId, onComplete, onLevelComplete }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const alreadySubmitted = progress?.assignment_submitted;

  // Build a prompt from the actual assignment structure
  const assignment = lesson?.assignment;
  const tasks = assignment?.tasks || [];
  const promptText = tasks.map((t, i) => `Task ${t.task_number || i + 1}: ${t.instruction}${t.words ? ' - Words: ' + t.words.join(', ') : ''}${t.sentences ? '. Correct each sentence.' : ''}`).join('\n\n');

  const handleSubmit = async () => {
    if (text.trim().length < 20) return;
    setSubmitting(true);
    const res = await submitAssignment(levelId, text).catch(() => null);
    setResult(res);
    setSubmitting(false);
    if (res) onComplete(res);
  };

  if (alreadySubmitted && !result) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <PenLine style={{ width: 20, height: 20, color: WW }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1F2937', margin: 0 }}>Assignment</h2>
        </div>
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
          <p style={{ fontWeight: 700, color: '#15803D' }}><i className="fa-solid fa-circle-check" style={{ marginRight: 6 }}></i>Assignment already submitted!</p>
          <p style={{ fontSize: '0.875rem', color: '#374151', marginTop: 4 }}>Score: {progress.assignment_score}/{progress.assignment_total}</p>
        </div>
        <button onClick={onLevelComplete} style={{ width: '100%', padding: '13px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Trophy style={{ width: 17, height: 17 }} /> Level Complete - Back to Levels
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PenLine style={{ width: 20, height: 20, color: WW }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1F2937', margin: 0 }}>Assignment</h2>
        </div>
        <CreditBadge amount={20} />
      </div>

      {tasks.length > 0 ? (
        <div style={{ background: '#F8F7FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 14 }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: WW, marginBottom: 8 }}><i className="fa-solid fa-list-check" style={{ marginRight: 6 }}></i>Your Tasks</p>
          {tasks.map((t, i) => (
            <div key={i} style={{ marginBottom: i < tasks.length - 1 ? 10 : 0 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Task {t.task_number || i + 1}: {t.instruction}</p>
              {t.words && <p style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: 2 }}>Words: <strong>{t.words.join(', ')}</strong></p>}
              {t.example && <p style={{ fontSize: '0.78rem', color: '#6B7280', fontStyle: 'italic', marginTop: 2 }}>Example: "{t.example}"</p>}
              {t.sentences && t.sentences.map((s, j) => (
                <div key={j} style={{ background: '#fff', border: '1px solid #E0E7FF', borderRadius: 6, padding: '5px 10px', marginTop: 5, fontSize: '0.8rem', color: '#374151', fontStyle: 'italic' }}>"{s.text}"</div>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {!result ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your answers here..."
            rows={6}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${text.length >= 20 ? WW : '#E5E7EB'}`, fontSize: '0.875rem', fontFamily: 'inherit', color: '#1F2937', resize: 'vertical', outline: 'none', transition: 'border-color 0.2s', lineHeight: 1.7, boxSizing: 'border-box' }}
            onFocus={(e) => { e.target.style.borderColor = WW; e.target.style.boxShadow = `0 0 0 3px ${WW_LIGHT}`; }}
            onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = text.length >= 20 ? WW : '#E5E7EB'; }}
          />
          <p style={{ fontSize: '0.72rem', color: text.length >= 20 ? '#16A34A' : '#9CA3AF', marginTop: 4, marginBottom: 12 }}>
            {text.length} characters {text.length < 20 ? `(${20 - text.length} more needed)` : 'Ready to submit'}
          </p>
          <button onClick={handleSubmit} disabled={text.length < 20 || submitting}
            style={{ width: '100%', padding: '13px', background: text.length >= 20 ? WW : '#E5E7EB', color: text.length >= 20 ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700, cursor: text.length >= 20 && !submitting ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', transition: 'all 0.2s' }}>
            {submitting ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 0.7s linear infinite' }} /> Grading with AI...</> : 'Submit Assignment →'}
          </button>
        </>
      ) : (
        <div>
          {result?.review?.length > 0 && (
            <div style={{ background: '#F8F7FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: '1.1rem 1.25rem', marginBottom: 12 }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: WW, marginBottom: 10 }}><i className="fa-solid fa-chart-line" style={{ marginRight: 6 }}></i>Review</p>
              {result.review.map((s, i) => (
                <div key={i} style={{ borderLeft: `3px solid ${s.correct !== false ? '#16A34A' : '#EF4444'}`, paddingLeft: 12, marginBottom: 12 }}>
                  <p style={{ fontSize: '0.875rem', color: '#1F2937', fontWeight: 500 }}>
                    <i className={s.correct !== false ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'} style={{ marginRight: 6 }}></i>
                    "{s.sentence || s.text}"
                  </p>
                  {s.error && <p style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 3 }}>{s.error}: {s.explanation}</p>}
                  {s.errors?.map((err, j) => (
                    <p key={j} style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 3 }}>
                      <span style={{ color: '#EF4444', fontWeight: 600 }}>{err.original}</span> → <span style={{ color: '#16A34A', fontWeight: 600 }}>{err.correction}</span>: {err.explanation}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#15803D' }}>Score: {result.score}/{result.total}</span>
            <span style={{ fontWeight: 800, color: '#D97706' }}><i className="fa-solid fa-coins" style={{ marginRight: 5 }}></i>+{result.credits_earned}</span>
          </div>
          <button onClick={onLevelComplete}
            style={{ width: '100%', padding: '13px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Trophy style={{ width: 17, height: 17 }} /> Level Complete - Back to Levels
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Lesson Component ─── */
export default function Lesson({ levelId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    getLesson(levelId)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        const prog = res?.progress || {};
        const c = [];
        if (prog.lesson_read) c.push(0);
        if (prog.quiz_completed) c.push(1);
        if (prog.assignment_submitted) c.push(2);
        setCompleted(c);
        if (prog.assignment_submitted) setStep(2);
        else if (prog.quiz_completed) setStep(2);
        else if (prog.lesson_read) setStep(1);
        else setStep(0);
      })
      .catch((err) => {
        if (cancelled) return;
        setData(null);
        setLoadError(err?.message || 'Could not load this lesson right now.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [levelId]);

  const completeLesson = async () => {
    setSaving(true);
    await markLessonRead(levelId).catch(() => {});
    setSaving(false);
    setCompleted((p) => p.includes(0) ? p : [...p, 0]);
    setStep(1);
  };

  const completeQuiz = (res) => {
    if (res?.passed) {
      setCompleted((p) => p.includes(1) ? p : [...p, 1]);
      setTimeout(() => setStep(2), 900);
    }
  };

  const completeAssignment = () => {
    setCompleted((p) => p.includes(2) ? p : [...p, 2]);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#6B7280' }}>
        <Loader2 style={{ width: 36, height: 36, marginBottom: 12, animation: 'spin 0.7s linear infinite', color: WW }} />
        <p style={{ fontSize: '0.875rem' }}>Loading lesson...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 18, padding: '2rem', textAlign: 'center', maxWidth: 780, margin: '0 auto' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FFF7ED', color: '#EA580C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <i className="fa-solid fa-circle-info" style={{ fontSize: '1.1rem' }} />
        </div>
        <h2 style={{ margin: 0, color: '#1F2937', fontSize: '1.08rem', fontWeight: 800 }}>Lesson content unavailable</h2>
        <p style={{ margin: '8px 0 18px', color: '#64748B', fontSize: '0.9rem' }}>{loadError}</p>
        <button
          onClick={onBack}
          style={{ background: WW, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Back to Learning Hub
        </button>
      </div>
    );
  }

  const lesson = data?.lesson || data;
  const quizQuestions = data?.quiz?.questions || lesson?.quiz?.questions || [];
  const progress = data?.progress || {};

  return (
    <div style={{ padding: '0 0 3rem', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', fontWeight: 600, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit' }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Levels
        </button>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1F2937', margin: 0 }}>Level {levelId}: {lesson?.title}</h1>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: lesson?.category === 'beginner' ? '#16A34A' : lesson?.category === 'intermediate' ? '#D97706' : '#DC2626', textTransform: 'capitalize' }}>{lesson?.category}</span>
        </div>
      </div>

      <ProgressStepper step={step} completed={completed} />

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {['Lesson', 'Quiz', 'Assignment'].map((label, i) => {
          const unlocked = i === 0 || completed.includes(i - 1);
          const isActive = step === i;
          return (
            <button key={i} disabled={!unlocked} onClick={() => unlocked && setStep(i)}
              style={{ flex: 1, padding: '9px 4px', borderRadius: 10, border: `1.5px solid ${isActive ? WW : '#E5E7EB'}`, background: isActive ? WW_LIGHT : '#fff', color: isActive ? WW : unlocked ? '#374151' : '#9CA3AF', fontWeight: isActive ? 800 : 600, fontSize: '0.82rem', cursor: unlocked ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'inherit', transition: 'all 0.2s' }}>
              {!unlocked && <Lock style={{ width: 11, height: 11 }} />} {label}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 18, padding: '1.5rem', boxShadow: '0 2px 12px rgba(91,95,222,0.05)' }}>
        {step === 0 && <LessonSection lesson={lesson} progress={progress} levelId={levelId} onComplete={completeLesson} loading={saving} />}
        {step === 1 && <QuizSection questions={quizQuestions} progress={progress} levelId={levelId} onComplete={completeQuiz} />}
        {step === 2 && <AssignmentSection lesson={lesson} progress={progress} levelId={levelId} onComplete={completeAssignment} onLevelComplete={onBack} />}
      </div>
    </div>
  );
}
