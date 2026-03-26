import React from 'react';

function Analytics() {
  return (
    <div className="animate-view space-y-8 pb-6 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-100 tracking-tight">Analytics <span className="text-indigo-600">Dashboard</span></h1>
        <p className="text-sm font-medium text-slate-400 mt-1">Track your writing progress and improvements.</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Grammar Accuracy</p>
          <p className="text-3xl font-black text-indigo-600">96.8%</p>
          <p className="text-xs text-slate-400 mt-2">↑ 2.1% from last week</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Vocabulary Score</p>
          <p className="text-3xl font-black text-amber-500">8.4/10</p>
          <p className="text-xs text-slate-400 mt-2">↑ Improved consistency</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Words Written</p>
          <p className="text-3xl font-black text-emerald-500">12,450</p>
          <p className="text-xs text-slate-400 mt-2">This month</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Active Streak</p>
          <p className="text-3xl font-black text-rose-500">14 days</p>
          <p className="text-xs text-slate-400 mt-2">Keep it going!</p>
        </div>
      </div>

      <div className="glass-card p-8">
        <h2 className="font-bold text-slate-200 mb-6">Writing Improvement Trend</h2>
        <div className="flex items-end gap-2 h-48 mb-4">
          <div className="flex-1 bg-indigo-600 rounded-t-lg chart-bar" style={{ height: '45%' }}></div>
          <div className="flex-1 bg-indigo-600 rounded-t-lg chart-bar" style={{ height: '55%' }}></div>
          <div className="flex-1 bg-indigo-600 rounded-t-lg chart-bar" style={{ height: '65%' }}></div>
          <div className="flex-1 bg-indigo-600 rounded-t-lg chart-bar" style={{ height: '75%' }}></div>
          <div className="flex-1 bg-indigo-600 rounded-t-lg chart-bar" style={{ height: '85%' }}></div>
          <div className="flex-1 bg-indigo-600 rounded-t-lg chart-bar" style={{ height: '90%' }}></div>
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>Week 1</span>
          <span>Week 2</span>
          <span>Week 3</span>
          <span>Week 4</span>
          <span>Week 5</span>
          <span>Week 6</span>
        </div>
      </div>

      <div className="glass-card p-8">
        <h2 className="font-bold text-slate-200 mb-6">Skill Breakdown</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm font-bold mb-2 text-slate-300">
              <span>Grammar & Punctuation</span>
              <span className="text-indigo-600">92%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full" style={{ width: '92%' }}></div></div>
          </div>
          <div>
            <div className="flex justify-between text-sm font-bold mb-2 text-slate-300">
              <span>Clarity & Tone</span>
              <span className="text-indigo-600">87%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full" style={{ width: '87%' }}></div></div>
          </div>
          <div>
            <div className="flex justify-between text-sm font-bold mb-2 text-slate-300">
              <span>Vocabulary</span>
              <span className="text-indigo-600">84%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full" style={{ width: '84%' }}></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
