import React from 'react';

function PracticeHome() {
  return (
    <div className="animate-view w-full max-w-6xl mx-auto space-y-8 overflow-y-auto pb-6">
      <div>
        <h1 className="text-3xl font-black text-slate-100">Practice <span className="text-indigo-600">Sessions</span></h1>
        <p className="text-slate-400 mt-1">Choose a practice mode to improve your writing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Grammar Drill', icon: 'fa-spell-check', desc: '10 exercises', color: 'indigo' },
          { title: 'Tone Adjustment', icon: 'fa-wand-magic-sparkles', desc: '15 scenarios', color: 'purple' },
          { title: 'Clarity Challenge', icon: 'fa-bolt', desc: '12 tasks', color: 'blue' },
          { title: 'Vocabulary Expansion', icon: 'fa-book-open', desc: '20 exercises', color: 'emerald' },
          { title: 'Punctuation Master', icon: 'fa-list', desc: '8 exercises', color: 'amber' },
          { title: 'Flow & Rhythm', icon: 'fa-music', desc: '10 readings', color: 'rose' }
        ].map((practice, i) => (
          <div key={i} className="glass-card p-8 space-y-4 hover:border-indigo-300 transition cursor-pointer">
            <div className={`w-12 h-12 rounded-xl bg-${practice.color}-50 text-${practice.color}-600 flex items-center justify-center text-2xl`}>
              <i className={`fa-solid ${practice.icon}`}></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-200">{practice.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{practice.desc}</p>
            </div>
            <button className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition">
              Start Practice
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PracticeHome;
