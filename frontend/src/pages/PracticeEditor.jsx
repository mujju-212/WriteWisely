import React, { useState, useRef } from 'react';

function PracticeEditor() {
  const [practiceText, setPracticeText] = useState('Start writing your practice text here... The AI will provide real-time feedback on grammar, clarity, and style.');
  const [practiceMode, setPracticeMode] = useState('realtime');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const practiceEditorRef = useRef(null);

  const toggleSession = () => {
    setIsSessionActive(!isSessionActive);
  };

  return (
    <div className="animate-view max-w-6xl mx-auto flex flex-col h-full pb-6 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Practice <span className="text-indigo-600">Panel</span></h1>
          <p className="text-sm font-medium text-slate-400 mt-1">Enhance your writing with real-time AI assistance.</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-trophy text-amber-500"></i>
            <span className="text-xs font-bold text-slate-400">Daily Goal: 350 / 500 Words</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 space-y-6">
        <div className="flex gap-3 border-b pb-4">
          <button className="w-9 h-9 rounded-lg hover:bg-slate-700 flex items-center justify-center text-slate-400 transition" title="Bold"><i className="fa-solid fa-bold"></i></button>
          <button className="w-9 h-9 rounded-lg hover:bg-slate-700 flex items-center justify-center text-slate-400 transition" title="Italic"><i className="fa-solid fa-italic"></i></button>
          <button className="w-9 h-9 rounded-lg hover:bg-slate-700 flex items-center justify-center text-slate-400 transition" title="Underline"><i className="fa-solid fa-underline"></i></button>
        </div>

        <div className="flex gap-3">
          <button className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${practiceMode === 'realtime' ? 'bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-200'}`} onClick={() => setPracticeMode('realtime')}>
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            Realtime
          </button>
          <button className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${practiceMode === 'analysis' ? 'bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-200'}`} onClick={() => setPracticeMode('analysis')}>
            <i className="fa-solid fa-chart-line"></i>
            Analysis
          </button>
        </div>

        <div ref={practiceEditorRef} className="min-h-96 p-6 bg-slate-900 border border-slate-700 rounded-2xl overflow-y-auto resize-none text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <div contentEditable="true" className="editor-content min-h-full focus:outline-none">
            {practiceText}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs font-bold text-slate-400">
            Issues Found: <span className="text-rose-500">3</span>
          </div>
          <button onClick={toggleSession} className={`px-8 py-3 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 ${isSessionActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            <i className={`fa-solid fa-${isSessionActive ? 'stop' : 'play'}`}></i>
            {isSessionActive ? 'End Session' : 'Start Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PracticeEditor;
