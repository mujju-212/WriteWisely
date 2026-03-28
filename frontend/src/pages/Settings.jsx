import React from 'react';

function Settings({ onLogout }) {
  return (
    <div className="animate-view max-w-2xl mx-auto glass-card p-12 mt-10 text-center overflow-y-auto pb-6">
      <h2 className="text-2xl font-black mb-8 text-slate-200">Settings</h2>
      <div className="space-y-6 text-left">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Display Name</label>
          <input type="text" defaultValue="John Doe" className="w-full bg-slate-700 border-none rounded-2xl p-4 text-sm font-bold mt-2 text-slate-200 placeholder-slate-500" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
          <input type="email" defaultValue="john@example.com" className="w-full bg-slate-700 border-none rounded-2xl p-4 text-sm font-bold mt-2 text-slate-200 placeholder-slate-500" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Notification Preferences</label>
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm text-slate-300">Email notifications</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm text-slate-300">Weekly progress report</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm text-slate-300">Marketing emails</span>
            </label>
          </div>
        </div>
        <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 mt-4 transition hover:bg-indigo-700">Save Changes</button>
        <button onClick={onLogout} className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl shadow-xl shadow-red-100 mt-4 transition hover:bg-red-600">Logout</button>
      </div>
    </div>
  );
}

export default Settings;
