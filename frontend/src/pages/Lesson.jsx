import React from 'react';

function Lesson() {
  return (
    <div className="animate-view w-full max-w-4xl mx-auto glass-card p-12 overflow-y-auto pb-6 space-y-8">
      <div>
        <h1 className="text-4xl font-black text-slate-100">The Art of Brevity</h1>
        <p className="text-slate-400 mt-2">Cut unnecessary words and increase impact</p>
      </div>

      <div className="prose prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-bold text-slate-200 mt-6 mb-3">Introduction</h2>
          <p className="text-slate-300 leading-relaxed">Brevity is the soul of wit, and the essence of effective writing. In today's fast-paced world, readers value conciseness highly. This lesson will teach you how to eliminate redundant words and communicate with greater impact.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-200 mt-6 mb-3">Key Principles</h2>
          <div className="space-y-3">
            <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded">
              <h3 className="font-bold text-slate-800">Remove Redundancy</h3>
              <p className="text-sm text-slate-600 mt-1">Eliminate words that repeat ideas or add no new information.</p>
            </div>
            <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded">
              <h3 className="font-bold text-slate-800">Use Active Voice</h3>
              <p className="text-sm text-slate-600 mt-1">Active voice is more direct and usually shorter than passive voice.</p>
            </div>
            <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded">
              <h3 className="font-bold text-slate-800">Choose Precise Words</h3>
              <p className="text-sm text-slate-600 mt-1">Use specific words instead of vague ones that require explanation.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-200 mt-6 mb-3">Examples</h2>
          <table className="w-full border-collapse border border-slate-700">
            <thead>
              <tr className="bg-slate-800">
                <th className="border border-slate-700 p-3 text-left font-bold text-slate-200">Verbose</th>
                <th className="border border-slate-700 p-3 text-left font-bold text-slate-200">Concise</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-700 p-3 text-slate-300">Due to the fact that the meeting was cancelled</td>
                <td className="border border-slate-700 p-3 text-slate-300">Because the meeting was cancelled</td>
              </tr>
              <tr className="bg-slate-800">
                <td className="border border-slate-700 p-3 text-slate-300">At the present time, we are working on this</td>
                <td className="border border-slate-700 p-3 text-slate-300">We are currently working on this</td>
              </tr>
              <tr>
                <td className="border border-slate-700 p-3 text-slate-300">In spite of the fact that it was raining</td>
                <td className="border border-slate-700 p-3 text-slate-300">Despite the rain</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <div className="flex gap-4 mt-8">
        <button className="flex-1 py-3 bg-slate-700 text-slate-200 font-bold rounded-xl hover:bg-slate-600 transition">
          Previous Lesson
        </button>
        <button className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
          Next Lesson
        </button>
      </div>
    </div>
  );
}

export default Lesson;
