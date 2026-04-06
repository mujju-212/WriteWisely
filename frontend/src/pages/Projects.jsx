import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchProjects, getProject,
  createProject, updateProject, deleteProject,
  checkText,
} from '../services/api';
import { buildHighlightSegments, errorUnderlineStyle } from '../utils/errorHighlight';

/* ─── Constants ─────────────────────────────────────────────── */
const DOC_TYPES = [
  { value: 'journal',  label: 'Journal',  iconClass: 'fa-solid fa-book-open', color: '#06B6D4', bg: '#ECFEFF' },
  { value: 'research', label: 'Research', iconClass: 'fa-solid fa-flask', color: '#8B5CF6', bg: '#F5F3FF' },
  { value: 'letter',   label: 'Letter',   iconClass: 'fa-solid fa-file-lines', color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'email',    label: 'Email',    iconClass: 'fa-solid fa-envelope', color: '#1D4ED8', bg: '#EFF6FF' },
  { value: 'other',    label: 'Other',    iconClass: 'fa-solid fa-file-pen', color: '#64748B', bg: '#F8FAFC' },
];

const TYPE_MAP = Object.fromEntries(DOC_TYPES.map(t => [t.value, t]));

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function renderProjectHighlightedText(text, errors, activeTooltip, setActiveTooltip, textareaRef) {
  const segments = buildHighlightSegments(text, errors);

  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.text}</span>;
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
            className="pj-error-span"
            style={{ position: 'relative', display: 'inline', cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip(i)}
            onMouseLeave={() => setActiveTooltip(null)}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setActiveTooltip(prev => (prev === i ? null : i));
              if (textareaRef?.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(seg.start, seg.start);
              }
            }}
          >
            <span style={errorUnderlineStyle(color)}>{seg.text}</span>
            {isActive && (
              <span style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1E293B',
                color: '#fff',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                zIndex: 120,
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
                lineHeight: 1.5,
                ...tooltipPlacement,
              }}>
                <span style={{ display: 'block', fontWeight: 700, marginBottom: 2 }}>
                  {isSpelling ? 'Spelling issue' : 'Grammar issue'}
                </span>
                <span style={{ color: '#94A3B8' }}>{seg.err.hint || seg.err.explanation || 'Check this phrase'}</span>
                {seg.err.correction ? (
                  <span style={{ display: 'block', color: '#86EFAC', marginTop: 3 }}>
                    Try: {seg.err.correction}
                  </span>
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
export default function Projects() {
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [openProject, setOpenProject] = useState(null);   // null = list view
  const [editorLoading, setEditorLoading] = useState(false);

  // New-project modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle]         = useState('');
  const [newType, setNewType]           = useState('other');
  const [creating, setCreating]         = useState(false);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(null); // project id

  // Editor state
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle]     = useState('');
  const [saveStatus, setSaveStatus]       = useState('saved'); // saved | saving | unsaved
  const autoSaveRef = useRef(null);
  const isDirtyRef  = useRef(false);

  /* ── Load list ────────────────────────────────────────────── */
  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Open project in editor ───────────────────────────────── */
  const handleOpenProject = async (proj) => {
    setEditorLoading(true);
    setOpenProject(proj);
    setEditorTitle(proj.title);
    setEditorContent('');
    setSaveStatus('saved');
    isDirtyRef.current = false;
    try {
      const full = await getProject(proj.id);
      setEditorContent(full.content || '');
    } catch {
      setEditorContent('');
    } finally {
      setEditorLoading(false);
    }
  };

  /* ── Auto-save (1.5s debounce) ────────────────────────────── */
  const triggerAutoSave = useCallback((content, title, projId) => {
    setSaveStatus('unsaved');
    isDirtyRef.current = true;
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await updateProject(projId, { content, title });
        setSaveStatus('saved');
        isDirtyRef.current = false;
        // Refresh list word count in background
        setProjects(prev => prev.map(p =>
          p.id === projId
            ? { ...p, title, word_count: countWords(content), updated_at: new Date().toISOString() }
            : p
        ));
      } catch {
        setSaveStatus('unsaved');
      }
    }, 1500);
  }, []);

  const handleEditorChange = (val) => {
    setEditorContent(val);
    if (openProject) triggerAutoSave(val, editorTitle, openProject.id);
  };

  const handleTitleChange = (val) => {
    setEditorTitle(val);
    if (openProject) triggerAutoSave(editorContent, val, openProject.id);
  };

  /* ── Manual save ─────────────────────────────────────────── */
  const handleManualSave = async () => {
    if (!openProject) return;
    setSaveStatus('saving');
    try {
      await updateProject(openProject.id, { content: editorContent, title: editorTitle });
      setSaveStatus('saved');
      isDirtyRef.current = false;
      setProjects(prev => prev.map(p =>
        p.id === openProject.id
          ? { ...p, title: editorTitle, word_count: countWords(editorContent), updated_at: new Date().toISOString() }
          : p
      ));
    } catch {
      setSaveStatus('unsaved');
    }
  };

  /* ── Back to list ─────────────────────────────────────────── */
  const handleBack = () => {
    clearTimeout(autoSaveRef.current);
    setOpenProject(null);
    setEditorContent('');
    setEditorTitle('');
    setSaveStatus('saved');
  };

  /* ── Create project ──────────────────────────────────────── */
  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const result = await createProject({ title: newTitle.trim(), doc_type: newType });
      const newProj = {
        id: result.id,
        title: newTitle.trim(),
        doc_type: newType,
        word_count: 0,
        updated_at: new Date().toISOString(),
      };
      setProjects(prev => [newProj, ...prev]);
      setShowNewModal(false);
      setNewTitle('');
      setNewType('other');
      // Auto-open
      await handleOpenProject(newProj);
    } catch (err) {
      alert('Failed to create project: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  /* ── Delete project ──────────────────────────────────────── */
  const handleDelete = async (id) => {
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setConfirmDelete(null);
      if (openProject?.id === id) handleBack();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  /* ── Render ─────────────────────────────────────────────── */
  if (openProject) {
    return (
      <ProjectEditor
        project={openProject}
        content={editorContent}
        title={editorTitle}
        saveStatus={saveStatus}
        loading={editorLoading}
        onTitleChange={handleTitleChange}
        onChange={handleEditorChange}
        onSave={handleManualSave}
        onBack={handleBack}
        onDelete={() => setConfirmDelete(openProject.id)}
        confirmDelete={confirmDelete === openProject.id}
        onConfirmDelete={() => handleDelete(openProject.id)}
        onCancelDelete={() => setConfirmDelete(null)}
      />
    );
  }

  return (
    <ProjectList
      projects={projects}
      loading={loading}
      showNewModal={showNewModal}
      newTitle={newTitle}
      newType={newType}
      creating={creating}
      confirmDelete={confirmDelete}
      onOpenProject={handleOpenProject}
      onNewModal={() => setShowNewModal(true)}
      onCloseModal={() => { setShowNewModal(false); setNewTitle(''); setNewType('other'); }}
      onNewTitleChange={setNewTitle}
      onNewTypeChange={setNewType}
      onCreate={handleCreate}
      onConfirmDelete={handleDelete}
      onAskDelete={(id) => setConfirmDelete(id)}
      onCancelDelete={() => setConfirmDelete(null)}
    />
  );
}

/* ─── Project List View ───────────────────────────────────────── */
function ProjectList({
  projects, loading, showNewModal, newTitle, newType, creating,
  confirmDelete, onOpenProject, onNewModal, onCloseModal,
  onNewTitleChange, onNewTypeChange, onCreate,
  onConfirmDelete, onAskDelete, onCancelDelete,
}) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? projects
    : projects.filter(p => p.doc_type === filter);

  return (
    <div className="pj-root" style={{ maxWidth: 1320, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeInUp 0.4s ease' }}>
      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
        .pj-card{background:#fff;border-radius:16px;border:1px solid #E2E8F0;transition:box-shadow 0.2s,transform 0.2s;cursor:pointer;position:relative;overflow:hidden;}
        .pj-card:hover{box-shadow:0 8px 24px rgba(0,0,0,0.10);transform:translateY(-2px);}
        .pj-filter-btn{border:1.5px solid #E2E8F0;background:#fff;border-radius:999px;padding:6px 16px;font-size:0.8rem;font-weight:600;cursor:pointer;transition:all 0.15s;color:#64748B;font-family:inherit;}
        .pj-filter-btn.active{background:#2563EB;border-color:#2563EB;color:#fff;}
        .pj-filter-btn:hover:not(.active){border-color:#94A3B8;color:#1E293B;}
        .pj-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px);}
        .pj-modal{background:#fff;border-radius:20px;padding:2rem;min-width:440px;max-width:480px;animation:modalIn 0.25s ease;}
        .pj-input{width:100%;box-sizing:border-box;padding:10px 14px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:0.9rem;outline:none;font-family:inherit;color:#1E293B;transition:border-color 0.15s;}
        .pj-input:focus{border-color:#2563EB;}
        .pj-btn-primary{background:#2563EB;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-weight:700;cursor:pointer;font-family:inherit;font-size:0.875rem;transition:background 0.15s;display:flex;align-items:center;gap:6px;}
        .pj-btn-primary:hover:not(:disabled){background:#1D4ED8;}
        .pj-btn-primary:disabled{opacity:0.5;cursor:not-allowed;}
        .pj-btn-secondary{background:#F1F5F9;color:#1E293B;border:1px solid #E2E8F0;border-radius:10px;padding:10px 20px;font-weight:600;cursor:pointer;font-family:inherit;font-size:0.875rem;transition:all 0.15s;}
        .pj-btn-secondary:hover{background:#E2E8F0;}
        .pj-type-option{border:2px solid #E2E8F0;border-radius:10px;padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;font-size:0.85rem;font-weight:600;transition:all 0.15s;background:#fff;}
        .pj-type-option.selected{border-color:#2563EB;background:#EFF6FF;color:#2563EB;}
      `}</style>

      {/* Header */}
      <div className="pj-header-card" style={{ background: 'linear-gradient(135deg,#F8FAFC,#EFF6FF)', borderRadius: 18, padding: '1.5rem 2rem', border: '1px solid #DBEAFE' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#1E293B', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <i className="fa-solid fa-folder-tree" style={{ color: '#2563EB' }}></i>
              Project Workspace
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.9rem' }}>Create, edit, and manage your writing projects</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="pj-stat-card" style={{ background: '#fff', borderRadius: 12, padding: '0.75rem 1.25rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Total Projects</p>
              <p style={{ margin: 0, fontWeight: 800, color: '#1E293B', fontSize: '1.1rem' }}>{projects.length}</p>
            </div>
            <div className="pj-stat-card" style={{ background: '#fff', borderRadius: 12, padding: '0.75rem 1.25rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Total Words</p>
              <p style={{ margin: 0, fontWeight: 800, color: '#1E293B', fontSize: '1.1rem' }}>
                {projects.reduce((s, p) => s + (p.word_count || 0), 0).toLocaleString()}
              </p>
            </div>
            <button className="pj-btn-primary" onClick={onNewModal} style={{ padding: '12px 24px', fontSize: '0.9rem' }}>
              + New Project
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button className={`pj-filter-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          All Types
        </button>
        {DOC_TYPES.map(t => (
          <button key={t.value} className={`pj-filter-btn${filter === t.value ? ' active' : ''}`} onClick={() => setFilter(t.value)}>
            <i className={t.iconClass} style={{ marginRight: 6 }}></i>{t.label}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 180, borderRadius: 16, background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', animation: 'shimmer 1.4s infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: 16, border: '2px dashed #E2E8F0' }}>
          <p style={{ fontSize: '2.3rem', marginBottom: '0.75rem', color: '#64748B' }}><i className="fa-regular fa-folder-open"></i></p>
          <p style={{ fontWeight: 700, color: '#1E293B', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            {filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
          </p>
          <p style={{ color: '#94A3B8', marginBottom: '1.5rem' }}>Create your first project to get started</p>
          <button className="pj-btn-primary" onClick={onNewModal} style={{ display: 'inline-flex', margin: '0 auto' }}>
            + New Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
          {filtered.map(proj => {
            const t = TYPE_MAP[proj.doc_type] || TYPE_MAP.other;
            const isConfirm = confirmDelete === proj.id;
            return (
              <div key={proj.id} className="pj-card" style={{ borderLeft: `4px solid ${t.color}`, padding: '1.25rem' }}
                onClick={() => !isConfirm && onOpenProject(proj)}
              >
                {/* Type icon */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                      <i className={t.iconClass} style={{ color: t.color }}></i>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: t.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</p>
                      <p style={{ margin: 0, fontWeight: 700, color: '#1E293B', fontSize: '0.95rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {proj.title}
                      </p>
                    </div>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onAskDelete(proj.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#CBD5E1', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#CBD5E1'}
                    title="Delete project"
                  >
                    <i className="fa-regular fa-trash-can"></i>
                  </button>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>WORDS</p>
                    <p style={{ margin: 0, fontWeight: 800, color: '#1E293B', fontSize: '1rem' }}>{(proj.word_count || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>LAST EDITED</p>
                    <p style={{ margin: 0, fontWeight: 600, color: '#64748B', fontSize: '0.82rem' }}>{formatDate(proj.updated_at)}</p>
                  </div>
                </div>

                {/* Delete confirm */}
                {isConfirm ? (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px', textAlign: 'center' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#DC2626', fontWeight: 600 }}>Delete this project?</p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button onClick={(e) => { e.stopPropagation(); onConfirmDelete(proj.id); }}
                        style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                        Yes, Delete
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onCancelDelete(); }}
                        style={{ background: '#F1F5F9', color: '#1E293B', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button style={{ width: '100%', padding: '9px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = t.bg; e.currentTarget.style.borderColor = t.color; e.currentTarget.style.color = t.color; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
                  >
                    Open & Edit →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      {showNewModal && (
        <div className="pj-modal-overlay" onClick={onCloseModal}>
          <div className="pj-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: 800, color: '#1E293B', fontSize: '1.3rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-folder-plus" style={{ color: '#2563EB' }}></i>
                New Project
              </h2>
              <button onClick={onCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#94A3B8' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Project Title
            </label>
            <input
              className="pj-input"
              placeholder="e.g. My Research Paper, Dear Diary..."
              value={newTitle}
              onChange={e => onNewTitleChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && newTitle.trim() && onCreate()}
              autoFocus
              style={{ marginBottom: '1.25rem' }}
            />
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
              Document Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {DOC_TYPES.map(t => (
                <button key={t.value} className={`pj-type-option${newType === t.value ? ' selected' : ''}`}
                  onClick={() => onNewTypeChange(t.value)}
                  style={{ borderColor: newType === t.value ? t.color : '#E2E8F0', color: newType === t.value ? t.color : '#475569', background: newType === t.value ? t.bg : '#fff' }}
                >
                  <i className={t.iconClass}></i> {t.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="pj-btn-secondary" onClick={onCloseModal} style={{ flex: 1 }}>Cancel</button>
              <button className="pj-btn-primary" onClick={onCreate} disabled={!newTitle.trim() || creating} style={{ flex: 1, justifyContent: 'center' }}>
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Project Editor ────────────────────────────────────── */
function ProjectEditor({
  project, content, title, saveStatus, loading,
  onTitleChange, onChange, onSave, onBack,
  onDelete, confirmDelete, onConfirmDelete, onCancelDelete,
}) {
  const textareaRef   = useRef(null);
  const mirrorRef     = useRef(null);
  const debounceRef   = useRef(null);

  const [liveErrors,    setLiveErrors]    = useState([]);
  const [checking,      setChecking]      = useState(false);
  const [checkError,    setCheckError]    = useState(null);
  const [errCount,      setErrCount]      = useState({ spelling: 0, grammar: 0 });
  const [activeTooltip, setActiveTooltip] = useState(null);

  const wordCount = countWords(content);
  const charCount = content.length;
  const readTime  = Math.max(1, Math.ceil(wordCount / 200));
  const t = TYPE_MAP[project.doc_type] || TYPE_MAP.other;

  const saveColor = saveStatus === 'saved' ? '#16A34A' : saveStatus === 'saving' ? '#D97706' : '#EF4444';
  const saveLabel = saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved';

  // Live check: debounced for project suggestions.
  const runCheck = useCallback((val) => {
    clearTimeout(debounceRef.current);
    const trimmed = val.trim();
    if (!trimmed || !/[A-Za-z]/.test(trimmed)) {
      setLiveErrors([]);
      setErrCount({ spelling: 0, grammar: 0 });
      setCheckError(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setChecking(true);
      setCheckError(null);
      try {
        const res = await checkText(val, 'project', project.doc_type || 'general');
        const errs = res.errors || [];
        setLiveErrors(errs);
        const spellingCount = errs.filter((e) => {
          const type = String(e?.type || '').toLowerCase();
          const color = String(e?.color || '').toLowerCase();
          return type === 'spelling' || color === 'red';
        }).length;
        setErrCount({
          spelling: spellingCount,
          grammar: Math.max(0, errs.length - spellingCount),
        });
      } catch (err) {
        setCheckError(err?.message || 'Check failed. Retrying on next change.');
      } finally {
        setChecking(false);
      }
    }, 1200);
  }, [project.doc_type]);

  // Run check on initial content once the document has loaded.
  useEffect(() => {
    if (!loading && content) {
      runCheck(content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleChange = (val) => {
    setActiveTooltip(null);
    onChange(val);
    runCheck(val);
  };

  const syncMirrorScroll = () => {
    if (textareaRef.current && mirrorRef.current) {
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const applySuggestion = (err) => {
    if (!err?.correction) return;

    let next = content;
    const start = err?.position?.start;
    const end = err?.position?.end;

    if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end > start && end <= content.length) {
      next = content.slice(0, start) + err.correction + content.slice(end);
    } else {
      const original = (err.original || err.word || '').trim();
      if (!original) return;
      const idx = next.toLowerCase().indexOf(original.toLowerCase());
      if (idx < 0) return;
      next = next.slice(0, idx) + err.correction + next.slice(idx + original.length);
    }

    if (next !== content) {
      onChange(next);
      runCheck(next);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: 0, animation: 'fadeInUp 0.3s ease' }}>
      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .pj-editor-ta{width:100%;box-sizing:border-box;border:none;outline:none;resize:none;font-size:1.05rem;line-height:1.85;font-family:'Georgia','Times New Roman',serif;color:#1E293B;background:#fff;padding:2rem;display:block;height:100%;}
        .pj-editor-ta::placeholder{color:#CBD5E1;}
        .pj-editor-ta.transparent-text{color:transparent;caret-color:#1E293B;}
        .pj-editor-wrap{position:relative;height:100%;}
        .pj-mirror{position:absolute;inset:0;padding:2rem;font-size:1.05rem;line-height:1.85;font-family:'Georgia','Times New Roman',serif;color:#1E293B;white-space:pre-wrap;word-wrap:break-word;overflow:hidden;z-index:2;pointer-events:none;}
        .pj-mirror .pj-error-span{pointer-events:all;}
        .pj-suggest-card{border:1px solid #E2E8F0;border-radius:10px;padding:10px 12px;background:#fff;}
        .confirm-bar{background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:0.875rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;}
      `}</style>

      {/* Top toolbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'inherit', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: t.bg, border: `1px solid ${t.color}30`, borderRadius: 8, padding: '5px 10px' }}>
          <span><i className={t.iconClass} style={{ color: t.color }}></i></span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: t.color }}>{t.label}</span>
        </div>

        <input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Project title..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', fontWeight: 700, color: '#1E293B', background: 'transparent', fontFamily: 'inherit', cursor: 'text', minWidth: 0 }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto', flexShrink: 0 }}>
          {checking && <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Checking...</span>}
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: saveColor, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {saveStatus === 'saved' && <i className="fa-solid fa-circle-check"></i>}
            {saveStatus === 'saving' && <i className="fa-solid fa-floppy-disk"></i>}
            {saveStatus === 'unsaved' && <i className="fa-solid fa-circle"></i>}
            {saveLabel}
          </span>
          <button onClick={onSave} disabled={saveStatus === 'saved'}
            style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, cursor: saveStatus === 'saved' ? 'not-allowed' : 'pointer', opacity: saveStatus === 'saved' ? 0.5 : 1, fontSize: '0.83rem', fontFamily: 'inherit' }}>
            <i className="fa-solid fa-floppy-disk" style={{ marginRight: 6 }}></i>Save
          </button>
          <button onClick={onDelete} style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, padding: '8px 14px', fontWeight: 600, cursor: 'pointer', fontSize: '0.83rem', fontFamily: 'inherit' }}>
            <i className="fa-regular fa-trash-can" style={{ marginRight: 6 }}></i>Delete
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="confirm-bar" style={{ margin: '0.75rem 1.5rem 0' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#DC2626', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            Delete this project permanently?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onConfirmDelete} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>Yes, Delete</button>
            <button onClick={onCancelDelete} style={{ background: '#F1F5F9', color: '#1E293B', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Editor area + suggestions */}
      <div style={{ flex: 1, background: '#fff', marginTop: '0.75rem', borderTop: '1px solid #F1F5F9', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94A3B8', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem' }}><i className="fa-regular fa-file-lines"></i></span>
            <p style={{ fontWeight: 600 }}>Loading document...</p>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 320px' }}>
            <div style={{ borderRight: '1px solid #E2E8F0', minHeight: 0 }}>
              <div className="pj-editor-wrap">
                <div ref={mirrorRef} className="pj-mirror" aria-hidden="true">
                  {renderProjectHighlightedText(content, liveErrors, activeTooltip, setActiveTooltip, textareaRef)}
                  <span style={{ visibility: 'hidden' }}>.</span>
                </div>
                <textarea
                  ref={textareaRef}
                  className="pj-editor-ta transparent-text"
                  value={content}
                  onChange={e => handleChange(e.target.value)}
                  onScroll={syncMirrorScroll}
                  placeholder="Start writing here... Your work saves automatically."
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                />
              </div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '1rem', overflowY: 'auto' }}>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.8rem', fontWeight: 800, color: '#1E293B', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-regular fa-lightbulb" style={{ color: '#D97706' }}></i>
                Live Suggestions
              </p>
              <p style={{ margin: '0 0 0.9rem', fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5 }}>
                Suggestions update while you type. Click Apply to fix quickly.
              </p>

              {checking && (
                <div className="pj-suggest-card" style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '0.6rem' }}>
                  <i className="fa-solid fa-hourglass-half" style={{ marginRight: 6 }}></i>
                  Checking your text...
                </div>
              )}

              {checkError && !checking && (
                <div className="pj-suggest-card" style={{ fontSize: '0.78rem', color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: '0.6rem' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }}></i>
                  {checkError}
                </div>
              )}

              {!checking && !checkError && liveErrors.length === 0 && (
                <div className="pj-suggest-card" style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  No suggestions yet. Keep writing to get grammar and spelling feedback.
                </div>
              )}

              {liveErrors.slice(0, 8).map((err, idx) => {
                const type = String(err?.type || '').toLowerCase();
                const color = String(err?.color || '').toLowerCase();
                const isSpelling = type === 'spelling' || color === 'red';
                const labelColor = isSpelling ? '#DC2626' : '#CA8A04';
                return (
                  <div key={`${err.original || err.word || 'issue'}-${idx}`} className="pj-suggest-card" style={{ marginBottom: '0.55rem' }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, color: labelColor }}>
                      <i className={isSpelling ? 'fa-solid fa-circle' : 'fa-solid fa-circle-dot'} style={{ marginRight: 6 }}></i>
                      {isSpelling ? 'Spelling' : 'Grammar'}
                    </p>
                    <p style={{ margin: '4px 0 2px', fontSize: '0.78rem', color: '#1E293B', fontWeight: 700 }}>
                      {err.original || err.word || 'Issue detected'}
                      {err.correction ? <span style={{ color: '#16A34A' }}> → {err.correction}</span> : null}
                    </p>
                    <p style={{ margin: '0 0 8px', fontSize: '0.73rem', color: '#64748B', lineHeight: 1.45 }}>
                      {err.explanation || err.hint || 'Check this part of your sentence.'}
                    </p>
                    {err.correction ? (
                      <button
                        onClick={() => applySuggestion(err)}
                        style={{ border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#166534', borderRadius: 8, padding: '5px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Apply
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
          <i className="fa-solid fa-file-pen" style={{ marginRight: 6 }}></i>
          {wordCount.toLocaleString()} words
        </span>
        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
          <i className="fa-solid fa-font" style={{ marginRight: 6 }}></i>
          {charCount.toLocaleString()} chars
        </span>
        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
          <i className="fa-regular fa-clock" style={{ marginRight: 6 }}></i>
          ~{readTime} min read
        </span>
        {(errCount.spelling + errCount.grammar) > 0 && (
          <span style={{ fontSize: '0.75rem', marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            {errCount.spelling > 0 && <span style={{ color: '#EF4444', fontWeight: 700 }}><i className="fa-solid fa-circle" style={{ marginRight: 6 }}></i>{errCount.spelling} spelling</span>}
            {errCount.grammar  > 0 && <span style={{ color: '#CA8A04', fontWeight: 700 }}><i className="fa-solid fa-circle-dot" style={{ marginRight: 6 }}></i>{errCount.grammar} grammar</span>}
          </span>
        )}
        <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: (errCount.spelling + errCount.grammar) > 0 ? 0 : 'auto' }}>
          Auto-saves every 1.5s - {saveLabel}
        </span>
      </div>
    </div>
  );
}
