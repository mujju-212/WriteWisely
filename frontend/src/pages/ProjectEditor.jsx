import React, { useState } from 'react';

function ProjectEditor() {
  const [projectTitle, setProjectTitle] = useState('My Writing Project');
  const [projectContent, setProjectContent] = useState('Start typing your content here...');

  return (
    <div className="animate-view w-full h-full flex flex-col overflow-hidden bg-slate-800 rounded-2xl shadow-xl">
      <div className="p-6 border-b flex justify-between items-center bg-slate-900 shrink-0">
        <input
          type="text"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          className="text-2xl font-bold text-slate-200 bg-transparent border-none outline-none"
        />
        <div className="flex gap-3">
          <button className="px-6 py-2 bg-slate-700 text-slate-200 font-bold rounded-lg hover:bg-slate-600 transition">
            Save Draft
          </button>
          <button className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition">
            Publish
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden">
          <textarea
            value={projectContent}
            onChange={(e) => setProjectContent(e.target.value)}
            className="flex-1 p-6 border border-slate-700 rounded-xl resize-none outline-none focus:ring-2 focus:ring-indigo-500 overflow-y-auto bg-slate-900 text-slate-100 placeholder-slate-500"
            placeholder="Write your content here..."
          />
        </div>

        <div className="w-64 space-y-4 overflow-y-auto">
          <div className="glass-card p-4">
            <h3 className="font-bold text-slate-200 mb-3">Document Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Word Count</span>
                <span className="font-bold text-slate-200">{projectContent.split(/\s+/).filter(w => w).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Characters</span>
                <span className="font-bold text-slate-200">{projectContent.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reading Time</span>
                <span className="font-bold text-slate-200">~{Math.ceil(projectContent.split(/\s+/).filter(w => w).length / 200)} min</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="font-bold text-slate-200 mb-3">AI Suggestions</h3>
            <div className="space-y-2">
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                Consider using more active voice
              </div>
              <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
                Grammar issue detected on line 3
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectEditor;
