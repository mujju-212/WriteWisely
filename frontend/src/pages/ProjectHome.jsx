import React, { useState } from 'react';

function ProjectHome() {
  const [activeCategory, setActiveCategory] = useState('essays');

  const projects = [
    { id: 1, title: 'Product Proposal', category: 'essays', progress: 45, chapters: 8, avatar: '🎯' },
    { id: 2, title: 'Marketing Strategy', category: 'essays', progress: 70, chapters: 5, avatar: '📈' },
    { id: 3, title: 'Research Paper', category: 'essays', progress: 30, chapters: 12, avatar: '📚' },
    { id: 4, title: 'Email Campaign', category: 'marketing', progress: 85, chapters: 3, avatar: '📧' },
    { id: 5, title: 'Blog Series', category: 'blog', progress: 60, chapters: 10, avatar: '✍️' },
  ];

  const filteredProjects = projects.filter(p => p.category === activeCategory);

  return (
    <div className="animate-view flex h-full gap-6 pb-6 overflow-y-auto">
      <div className="w-48 space-y-2 pt-2">
        {['essays', 'marketing', 'blog'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`w-full text-left px-5 py-3 rounded-xl font-bold text-sm transition ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <div className="grid grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <div key={project.id} className="glass-card p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">{project.avatar}</span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{project.progress}%</span>
              </div>
              <h3 className="font-bold text-slate-200 mb-2">{project.title}</h3>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${project.progress}%` }}></div>
              </div>
              <p className="text-xs text-slate-400 font-medium">{project.chapters} chapters</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProjectHome;
